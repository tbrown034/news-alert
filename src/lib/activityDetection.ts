import { WatchpointId } from '@/types';
import { tier1Sources, tier2Sources, tier3Sources } from './sources-clean';
import { getEffectivePPD } from './baselineUtils';
import { getRegionBaselineAverages } from './activityLogging';

// =============================================================================
// DYNAMIC ACTIVITY DETECTION
// =============================================================================
// Baselines are derived from 14-day rolling averages stored in the database
// (post_activity_logs table). The DB captures actual per-region post counts
// AFTER region reclassification, so baselines naturally account for sources
// tagged region:'all' whose posts get classified to specific regions.
//
// Falls back to PPD-sum calculation from sources-clean.ts when DB has no data
// (fresh deployment, DB issues, etc.)
// =============================================================================

// Regions excluded from activity scoring due to insufficient source coverage.
// These always show NORMAL level regardless of post frequency.
const SCORING_EXCLUDED_REGIONS: WatchpointId[] = ['latam', 'asia', 'africa'];

// Platforms that /api/news actually fetches — must match ENABLED_PLATFORMS in route.ts
const FEED_PLATFORMS = new Set(['bluesky', 'telegram', 'mastodon']);

// ---------- BASELINE CACHE ----------

interface BaselineCache {
  baselines: Record<WatchpointId, number>;
  source: 'db' | 'ppd-fallback';
  fetchedAt: number;
}

const BASELINE_REFRESH_MS = 30 * 60 * 1000; // 30 minutes
let baselineCache: BaselineCache | null = null;
let baselineFetchInFlight: Promise<BaselineCache> | null = null;

/**
 * PPD-sum fallback baseline calculation.
 * Used when DB has no data (fresh deployment, DB down, etc.)
 * Only counts feed platforms (bluesky/telegram/mastodon).
 */
function calculatePpdFallbackBaselines(): Record<WatchpointId, number> {
  const allSources = [...tier1Sources, ...tier2Sources, ...tier3Sources]
    .filter(s => FEED_PLATFORMS.has(s.platform));

  const regionTotals: Record<string, number> = {
    'us': 0, 'latam': 0, 'middle-east': 0,
    'europe-russia': 0, 'asia': 0, 'africa': 0,
    'all': 0, 'seismic': 0,
  };

  for (const source of allSources) {
    const ppd = getEffectivePPD(source);
    const region = source.region;
    if (region in regionTotals) regionTotals[region] += ppd;
    regionTotals['all'] += ppd;
  }

  const baselines = {} as Record<WatchpointId, number>;
  for (const [region, total] of Object.entries(regionTotals)) {
    baselines[region as WatchpointId] = Math.round(total / 4);
  }
  return baselines;
}

/**
 * Fetch baselines from DB (14-day rolling average of actual post counts).
 * Falls back to PPD-sum if DB is empty or query fails.
 */
async function fetchBaselinesFromDb(): Promise<BaselineCache> {
  try {
    const averages = await getRegionBaselineAverages();

    // Require minimum sample count (at least 4 buckets = 1 day of data)
    const validAverages = averages.filter(a => a.sample_count >= 4);

    if (validAverages.length === 0) {
      console.log('[ActivityDetection] No DB baselines available, using PPD fallback');
      return {
        baselines: calculatePpdFallbackBaselines(),
        source: 'ppd-fallback',
        fetchedAt: Date.now(),
      };
    }

    const baselines = {} as Record<WatchpointId, number>;
    for (const avg of validAverages) {
      baselines[avg.region as WatchpointId] = Math.round(avg.avg_posts_6h);
    }

    // Fill any missing regions from PPD fallback
    const ppdFallback = calculatePpdFallbackBaselines();
    const allRegions: WatchpointId[] = [
      'us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa',
    ];
    for (const region of allRegions) {
      if (!(region in baselines) || baselines[region] <= 0) {
        baselines[region] = ppdFallback[region] || 30;
      }
    }

    console.log('[ActivityDetection] DB baselines loaded:',
      Object.entries(baselines).map(([r, b]) => `${r}=${b}`).join(', '));

    return {
      baselines,
      source: 'db',
      fetchedAt: Date.now(),
    };
  } catch (err) {
    console.error('[ActivityDetection] DB baseline fetch failed, using PPD fallback:', err);
    return {
      baselines: calculatePpdFallbackBaselines(),
      source: 'ppd-fallback',
      fetchedAt: Date.now(),
    };
  }
}

/**
 * Get current baselines, refreshing from DB if stale.
 * Returns immediately with cached values if available.
 * Background-refreshes if cache is older than 30 min.
 */
async function getBaselines(): Promise<Record<WatchpointId, number>> {
  const now = Date.now();

  // First call: must await DB fetch
  if (!baselineCache) {
    if (!baselineFetchInFlight) {
      baselineFetchInFlight = fetchBaselinesFromDb();
    }
    baselineCache = await baselineFetchInFlight;
    baselineFetchInFlight = null;
    return baselineCache.baselines;
  }

  // Cache exists but needs refresh (>30 min old): background refresh
  if (now - baselineCache.fetchedAt > BASELINE_REFRESH_MS) {
    if (!baselineFetchInFlight) {
      baselineFetchInFlight = fetchBaselinesFromDb().then(result => {
        baselineCache = result;
        baselineFetchInFlight = null;
        return result;
      }).catch(() => {
        baselineFetchInFlight = null;
        return baselineCache!;
      });
    }
  }

  return baselineCache.baselines;
}

// ---------- PUBLIC API ----------

export interface RegionActivity {
  level: 'critical' | 'elevated' | 'normal';
  count: number;
  baseline: number;
  multiplier: number;
  vsNormal: 'above' | 'below' | 'normal';
  percentChange: number;
}

/**
 * Calculate activity level for all regions.
 * Uses DB-derived 14-day rolling averages as baselines.
 * Items passed in should already be filtered to the 6h window by the API.
 */
export async function calculateRegionActivity(
  items: { region: WatchpointId; timestamp: Date }[]
): Promise<Record<WatchpointId, RegionActivity>> {
  const regions: WatchpointId[] = [
    'us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa',
  ];

  // Count ALL posts per region (items are already 6h filtered by API)
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.region] = (counts[item.region] || 0) + 1;
  }

  // Get baselines (DB-derived or PPD fallback)
  const baselines = await getBaselines();

  const activity = {} as Record<WatchpointId, RegionActivity>;

  for (const region of regions) {
    const count = counts[region] || 0;
    const baseline = Math.max(1, baselines[region] || 30);
    const multiplier = baseline > 0 ? Math.round((count / baseline) * 10) / 10 : 0;
    const percentChange = baseline > 0 ? Math.round(((count - baseline) / baseline) * 100) : 0;

    const MIN_ELEVATED_COUNT = 25;
    const MIN_CRITICAL_COUNT = 50;

    let level: RegionActivity['level'];
    if (SCORING_EXCLUDED_REGIONS.includes(region)) {
      level = 'normal';
    } else if (multiplier >= 5 && count >= MIN_CRITICAL_COUNT) {
      level = 'critical';
    } else if (multiplier >= 2.5 && count >= MIN_ELEVATED_COUNT) {
      level = 'elevated';
    } else {
      level = 'normal';
    }

    let vsNormal: 'above' | 'below' | 'normal';
    if (multiplier >= 1.5) vsNormal = 'above';
    else if (multiplier <= 0.5) vsNormal = 'below';
    else vsNormal = 'normal';

    activity[region] = { level, count, baseline, multiplier, vsNormal, percentChange };
  }

  return activity;
}

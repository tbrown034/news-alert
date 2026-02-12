import { WatchpointId } from '@/types';
import { tier1Sources, tier2Sources, tier3Sources, TieredSource } from './sources-clean';

// =============================================================================
// DYNAMIC ACTIVITY DETECTION
// =============================================================================
// Baselines are calculated from source postsPerDay values, then adjusted for
// time-of-day using a 4-slot UTC multiplier.
//
// TRUST LEVELS:
// - Decimal values (37.9, 16.6) = measured from actual data → trust these
// - Round numbers (50, 30, 15) = guessed/estimated → use conservative default
//
// TIME-OF-DAY ADJUSTMENT:
// Sources are ~70% US, ~20% EU, ~10% Middle East. Posting follows their
// business hours. A flat baseline would under-expect daytime and over-expect
// nighttime, causing false "below normal" at night and muted surge detection
// during peak hours. The multipliers redistribute the daily expectation:
//
//   UTC Slot       | US Time         | EU Time         | Multiplier
//   00:00–06:00    | 7pm–1am EST     | 1am–7am CET     | 0.4 (trough)
//   06:00–12:00    | 1am–7am EST     | 7am–1pm CET     | 0.8 (EU morning)
//   12:00–18:00    | 7am–1pm EST     | 1pm–7pm CET     | 1.5 (peak overlap)
//   18:00–24:00    | 1pm–7pm EST     | 7pm–1am CET     | 1.3 (US afternoon)
//
// Sum = 4.0 → daily total expectation unchanged.
// =============================================================================

const CONSERVATIVE_DEFAULT = 3; // posts/day for guessed sources

// Regions excluded from activity scoring due to insufficient source coverage.
// These always show NORMAL level regardless of post frequency.
const SCORING_EXCLUDED_REGIONS: WatchpointId[] = ['latam', 'asia', 'africa'];

// Check if a number was likely measured (has decimals) vs guessed (round)
function isMeasuredValue(n: number): boolean {
  return n !== Math.floor(n);
}

// Calculate 6-hour baseline per region from source postsPerDay
function calculateDynamicBaselines(): Record<WatchpointId, number> {
  const allSources = [...tier1Sources, ...tier2Sources, ...tier3Sources];

  const regionTotals: Record<string, number> = {
    'us': 0,
    'latam': 0,
    'middle-east': 0,
    'europe-russia': 0,
    'asia': 0,
    'africa': 0,
    'all': 0,
    'seismic': 0,
  };

  for (const source of allSources) {
    const rawValue = source.postsPerDay || 0;
    // Trust measured values (decimals or has baselineMeasuredAt), use conservative default for round guesses
    const measured = isMeasuredValue(rawValue) || source.baselineMeasuredAt;
    const postsPerDay = measured ? rawValue : CONSERVATIVE_DEFAULT;
    const region = source.region;

    // Add to specific region
    if (region in regionTotals) {
      regionTotals[region] += postsPerDay;
    }

    // All sources contribute to 'all' total
    regionTotals['all'] += postsPerDay;
  }

  // Convert postsPerDay to posts per 6 hours (divide by 4)
  const baselines: Record<WatchpointId, number> = {} as Record<WatchpointId, number>;
  for (const [region, total] of Object.entries(regionTotals)) {
    baselines[region as WatchpointId] = Math.round(total / 4);
  }

  return baselines;
}

// Calculate once at module load
const REGION_BASELINES_6H = calculateDynamicBaselines();

// Time-of-day multipliers for 6h UTC slots.
// Adjusts the flat baseline to match expected posting patterns.
// Must sum to 4.0 so daily total is preserved.
const TIME_OF_DAY_MULTIPLIERS: [number, number, number, number] = [
  0.4, // 00:00–06:00 UTC — US evening/night, EU night (trough)
  0.8, // 06:00–12:00 UTC — US sleeping, EU morning peak
  1.5, // 12:00–18:00 UTC — US morning + EU afternoon (peak)
  1.3, // 18:00–24:00 UTC — US afternoon, EU evening
];

/**
 * Get the time-of-day multiplier for the current UTC hour.
 * Returns a value that adjusts the flat 6h baseline to account for
 * natural posting rhythms (peak during US+EU overlap, trough at night).
 */
function getTimeOfDayMultiplier(now?: Date): number {
  const hour = (now || new Date()).getUTCHours();
  const slot = Math.floor(hour / 6); // 0-3
  return TIME_OF_DAY_MULTIPLIERS[slot];
}

export interface RegionActivity {
  level: 'critical' | 'elevated' | 'normal';
  count: number;
  baseline: number;
  multiplier: number;
  vsNormal: 'above' | 'below' | 'normal';
  percentChange: number;
}

/**
 * Calculate activity level for all regions - O(n) single pass
 * Items passed in are already filtered to the 6h window by the API
 */
export function calculateRegionActivity(
  items: { region: WatchpointId; timestamp: Date }[]
): Record<WatchpointId, RegionActivity> {
  const regions: WatchpointId[] = [
    'us',
    'latam',
    'middle-east',
    'europe-russia',
    'asia',
    'africa',
  ];

  // Count ALL posts per region (items are already 6h filtered by API)
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.region] = (counts[item.region] || 0) + 1;
  }

  // Time-of-day adjusted baseline: flat 6h baseline × time slot multiplier
  const todMultiplier = getTimeOfDayMultiplier();

  // Calculate activity levels
  const activity = {} as Record<WatchpointId, RegionActivity>;

  for (const region of regions) {
    const count = counts[region] || 0;
    const rawBaseline = REGION_BASELINES_6H[region] || 30;
    const baseline = Math.max(1, Math.round(rawBaseline * todMultiplier));
    const multiplier = baseline > 0 ? Math.round((count / baseline) * 10) / 10 : 0;
    const percentChange = baseline > 0 ? Math.round(((count - baseline) / baseline) * 100) : 0;

    // Critical = major crisis (Israel/Iran, large-scale protests, etc.)
    // Elevated = notable activity worth watching
    // Normal = typical news day
    //
    // Requirements:
    // - Raised thresholds: 2.5x for elevated, 5x for critical (was 2x/4x)
    // - Minimum post count: need at least 25 posts to trigger elevated, 50 for critical
    // - LATAM and Asia excluded from scoring (always NORMAL) until source coverage improves
    let level: RegionActivity['level'];
    const MIN_ELEVATED_COUNT = 25;
    const MIN_CRITICAL_COUNT = 50;

    // Excluded regions always show NORMAL regardless of activity
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

    activity[region] = {
      level,
      count,
      baseline,
      multiplier,
      vsNormal,
      percentChange,
    };
  }

  return activity;
}

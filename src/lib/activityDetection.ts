import { NewsItem, Source, SourceActivityProfile, RegionalSurge, WatchpointId } from '@/types';

// =============================================================================
// ACTIVITY ANOMALY DETECTION
// =============================================================================
// Detects when sources are posting more than their baseline rate.
// "Bellingcat usually posts 3x/day but has posted 8x in 2 hours"

// Configuration
const ANOMALY_THRESHOLD = 2.0; // Ratio above baseline to be considered anomalous
const TRACKING_WINDOW_HOURS = 2; // Look at recent posts within this window
const SURGE_THRESHOLD = 0.3; // 30% of sources anomalous = regional surge

/**
 * Calculate activity profile for a single source based on recent posts
 */
export function calculateSourceActivity(
  sourceId: string,
  recentPosts: NewsItem[],
  baselinePostsPerDay: number = 5
): SourceActivityProfile {
  const now = Date.now();
  const windowMs = TRACKING_WINDOW_HOURS * 60 * 60 * 1000;

  // Count posts from this source in the tracking window
  const postsInWindow = recentPosts.filter(
    (item) =>
      item.source.id === sourceId &&
      now - item.timestamp.getTime() < windowMs
  ).length;

  // Calculate what we'd expect in this window given the baseline
  // baseline is posts/day, window is in hours
  const expectedInWindow = (baselinePostsPerDay / 24) * TRACKING_WINDOW_HOURS;

  // Avoid division by zero
  const safeExpected = Math.max(expectedInWindow, 0.1);

  // Calculate anomaly ratio (how many times above expected)
  const anomalyRatio = postsInWindow / safeExpected;

  return {
    sourceId,
    baselinePostsPerDay,
    recentPosts: postsInWindow,
    recentWindowHours: TRACKING_WINDOW_HOURS,
    anomalyRatio,
    isAnomalous: anomalyRatio >= ANOMALY_THRESHOLD,
  };
}

/**
 * Calculate activity profiles for all active sources
 */
export function calculateAllSourceActivity(
  allPosts: NewsItem[],
  sources: (Source & { baselinePostsPerDay?: number })[]
): Map<string, SourceActivityProfile> {
  const profiles = new Map<string, SourceActivityProfile>();

  // Get unique source IDs that have posted
  const activeSourceIds = new Set(allPosts.map((item) => item.source.id));

  for (const sourceId of activeSourceIds) {
    const source = sources.find((s) => s.id === sourceId);
    const baseline = source?.baselinePostsPerDay ?? 5;

    const profile = calculateSourceActivity(sourceId, allPosts, baseline);
    profiles.set(sourceId, profile);
  }

  return profiles;
}

/**
 * Attach activity metadata to news items
 */
export function enrichWithActivityData(
  items: NewsItem[],
  activityProfiles: Map<string, SourceActivityProfile>
): NewsItem[] {
  return items.map((item) => {
    const profile = activityProfiles.get(item.source.id);

    if (!profile) return item;

    return {
      ...item,
      sourceActivity: {
        isAnomalous: profile.isAnomalous,
        anomalyRatio: Math.round(profile.anomalyRatio * 10) / 10, // Round to 1 decimal
        recentCount: profile.recentPosts,
        windowHours: profile.recentWindowHours,
        baseline: profile.baselinePostsPerDay,
      },
    };
  });
}

// =============================================================================
// REGIONAL SURGE DETECTION
// =============================================================================
// When multiple sources for a region are posting above baseline

/**
 * Detect regional surge based on source activity patterns
 */
export function detectRegionalSurge(
  region: WatchpointId,
  allPosts: NewsItem[],
  activityProfiles: Map<string, SourceActivityProfile>
): RegionalSurge {
  // Get posts for this region
  const regionPosts = allPosts.filter(
    (item) => item.region === region || (region === 'all' && true)
  );

  // Get unique sources that posted in this region
  const regionSourceIds = new Set(regionPosts.map((item) => item.source.id));

  // Count how many are anomalous
  const anomalousSources: string[] = [];
  for (const sourceId of regionSourceIds) {
    const profile = activityProfiles.get(sourceId);
    if (profile?.isAnomalous) {
      const post = regionPosts.find((p) => p.source.id === sourceId);
      if (post) {
        anomalousSources.push(post.source.name);
      }
    }
  }

  const totalActive = regionSourceIds.size;
  const anomalousCount = anomalousSources.length;
  const surgeRatio = totalActive > 0 ? anomalousCount / totalActive : 0;

  return {
    region,
    anomalousSources: anomalousCount,
    totalActiveSources: totalActive,
    surgeRatio,
    isSurging: surgeRatio >= SURGE_THRESHOLD && anomalousCount >= 2,
    topContributors: anomalousSources.slice(0, 5), // Top 5 contributors
  };
}

/**
 * Detect surges across all regions
 */
export function detectAllRegionalSurges(
  allPosts: NewsItem[],
  activityProfiles: Map<string, SourceActivityProfile>
): Record<WatchpointId, RegionalSurge> {
  const regions: WatchpointId[] = [
    'middle-east',
    'ukraine-russia',
    'china-taiwan',
    'venezuela',
    'us-domestic',
  ];

  const surges = {} as Record<WatchpointId, RegionalSurge>;

  for (const region of regions) {
    surges[region] = detectRegionalSurge(region, allPosts, activityProfiles);
  }

  return surges;
}

/**
 * Get a human-readable description of activity
 */
export function getActivityDescription(
  activity: NewsItem['sourceActivity']
): string | null {
  if (!activity || !activity.isAnomalous) return null;

  const ratio = activity.anomalyRatio;
  const baseline = activity.baseline;
  const recent = activity.recentCount;
  const hours = activity.windowHours;

  // Format baseline nicely
  let baselineDesc: string;
  if (baseline >= 1) {
    baselineDesc = `~${Math.round(baseline)}/day`;
  } else {
    const perWeek = Math.round(baseline * 7);
    baselineDesc = `~${perWeek}/week`;
  }

  return `${recent} posts in ${hours}h (usually ${baselineDesc})`;
}

/**
 * Get a formatted activity indicator for UI
 */
export function getActivityIndicator(
  activity: NewsItem['sourceActivity']
): { icon: string; label: string; color: string; multiplier: number } | null {
  if (!activity || !activity.isAnomalous) return null;

  const ratio = activity.anomalyRatio;

  // More severe = more urgent indicator
  if (ratio >= 5) {
    return {
      icon: '🔥',
      label: `${ratio}x normal rate`,
      color: 'text-red-500',
      multiplier: ratio,
    };
  } else if (ratio >= 3) {
    return {
      icon: '⚡',
      label: `${ratio}x normal rate`,
      color: 'text-orange-500',
      multiplier: ratio,
    };
  } else {
    return {
      icon: '📈',
      label: `${ratio}x normal rate`,
      color: 'text-yellow-500',
      multiplier: ratio,
    };
  }
}

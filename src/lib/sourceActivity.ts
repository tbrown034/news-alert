/**
 * PER-SOURCE ACTIVITY DETECTION
 * ==============================
 * Detects when individual sources are posting more than usual.
 * Uses baselinePPD/estimatedPPD from source definitions, compared against
 * actual post count in the current 6-hour window.
 *
 * Works alongside region-level activityDetection.ts — this is source-level.
 */

import type { NewsItem, SourceActivityProfile } from '@/types';
import { getEffectivePPD } from './baselineUtils';

// Minimum posts in window to flag as anomalous (avoids noise from low-volume sources)
const MIN_ANOMALOUS_COUNT = 3;

// Multiplier threshold to flag as anomalous
const ANOMALY_THRESHOLD = 2.5;

// Window size in hours (matches region-level detection)
const WINDOW_HOURS = 6;

/**
 * Calculate per-source activity profiles from items in the current window.
 * Items should already be filtered to the 6-hour window by the API.
 *
 * Returns only sources that have posts in the current window.
 */
export function calculateSourceActivity(
  items: NewsItem[]
): Record<string, SourceActivityProfile> {
  // Group items by source ID
  const bySource = new Map<string, { count: number; baselinePPD?: number; estimatedPPD?: number }>();

  for (const item of items) {
    const sourceId = item.source.id;
    const existing = bySource.get(sourceId);
    if (existing) {
      existing.count++;
    } else {
      bySource.set(sourceId, {
        count: 1,
        baselinePPD: (item.source as any).baselinePPD,
        estimatedPPD: (item.source as any).estimatedPPD,
      });
    }
  }

  // Calculate activity profile for each source
  const result: Record<string, SourceActivityProfile> = {};

  for (const [sourceId, data] of bySource) {
    const baseline = getEffectivePPD({ baselinePPD: data.baselinePPD, estimatedPPD: data.estimatedPPD });
    const expectedIn6h = baseline / (24 / WINDOW_HOURS); // postsPerDay / 4
    const anomalyRatio = expectedIn6h > 0
      ? Math.round((data.count / expectedIn6h) * 10) / 10
      : 0;

    result[sourceId] = {
      sourceId,
      baselinePostsPerDay: baseline,
      recentPosts: data.count,
      recentWindowHours: WINDOW_HOURS,
      anomalyRatio,
      isAnomalous: anomalyRatio >= ANOMALY_THRESHOLD && data.count >= MIN_ANOMALOUS_COUNT,
    };
  }

  return result;
}

/**
 * Attach source activity data to individual news items.
 * Mutates items in place for efficiency (items are already being built for response).
 */
export function attachSourceActivity(
  items: NewsItem[],
  activity: Record<string, SourceActivityProfile>
): void {
  for (const item of items) {
    const profile = activity[item.source.id];
    if (profile) {
      item.sourceActivity = {
        isAnomalous: profile.isAnomalous,
        anomalyRatio: profile.anomalyRatio,
        recentCount: profile.recentPosts,
        windowHours: profile.recentWindowHours,
        baseline: profile.baselinePostsPerDay,
      };
    }
  }
}

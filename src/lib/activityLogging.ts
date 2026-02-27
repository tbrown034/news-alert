// Activity Logging - Track post counts over time for rolling averages
// Fire-and-forget: don't block the response, log asynchronously

import { query } from './db';
import { WatchpointId } from '@/types';

interface NewsItemForLogging {
  region: WatchpointId;
  platform?: string;
}

/**
 * Get the 6-hour bucket timestamp for a given date
 * Rounds down to nearest 6-hour boundary (00:00, 06:00, 12:00, 18:00 UTC)
 */
function getBucketTimestamp(date: Date = new Date()): Date {
  const bucket = new Date(date);
  const hours = Math.floor(bucket.getUTCHours() / 6) * 6;
  bucket.setUTCHours(hours, 0, 0, 0);
  return bucket;
}

/**
 * Log activity snapshot - call this after fetching posts
 * Returns a promise that resolves when logging completes (or fails gracefully)
 */
export async function logActivitySnapshot(
  region: WatchpointId,
  items: NewsItemForLogging[],
  sourceCount: number,
  fetchDurationMs?: number
): Promise<void> {
  try {
    await logActivityAsync(region, items, sourceCount, fetchDurationMs);
  } catch (err) {
    // Log error but don't throw - logging shouldn't break the main request
    console.error('[ActivityLogging] Failed to log snapshot:', err instanceof Error ? err.message : err);
  }
}

async function logActivityAsync(
  region: WatchpointId,
  items: NewsItemForLogging[],
  sourceCount: number,
  fetchDurationMs?: number
): Promise<void> {
  const bucketTimestamp = getBucketTimestamp();

  // Count posts per region
  const regionBreakdown: Record<string, number> = {};
  const platformBreakdown: Record<string, number> = {};

  for (const item of items) {
    regionBreakdown[item.region] = (regionBreakdown[item.region] || 0) + 1;
    if (item.platform) {
      platformBreakdown[item.platform] = (platformBreakdown[item.platform] || 0) + 1;
    }
  }

  // Upsert - if bucket already exists for this region, update it
  await query(
    `INSERT INTO post_activity_logs
      (bucket_timestamp, region, post_count, source_count, region_breakdown, platform_breakdown, fetch_duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (bucket_timestamp, region)
     DO UPDATE SET
       post_count = GREATEST(post_activity_logs.post_count, EXCLUDED.post_count),
       source_count = EXCLUDED.source_count,
       region_breakdown = EXCLUDED.region_breakdown,
       platform_breakdown = EXCLUDED.platform_breakdown,
       fetch_duration_ms = EXCLUDED.fetch_duration_ms,
       recorded_at = NOW()`,
    [
      bucketTimestamp.toISOString(),
      region,
      items.length,
      sourceCount,
      JSON.stringify(regionBreakdown),
      JSON.stringify(platformBreakdown),
      fetchDurationMs || null,
    ]
  );
}

// Types for querying logged data
export interface ActivityLogEntry {
  id: number;
  bucket_timestamp: Date;
  region: string;
  post_count: number;
  source_count: number;
  region_breakdown: Record<string, number> | null;
  platform_breakdown: Record<string, number> | null;
  recorded_at: Date;
  fetch_duration_ms: number | null;
}

export interface RollingAverage {
  region: string;
  avg_posts_6h: number;
  sample_count: number;
  min_posts: number;
  max_posts: number;
  latest_count: number;
}

/**
 * Get recent activity logs
 */
export async function getRecentActivityLogs(
  limit: number = 50
): Promise<ActivityLogEntry[]> {
  return query<ActivityLogEntry>(
    `SELECT * FROM post_activity_logs
     ORDER BY bucket_timestamp DESC, region
     LIMIT $1`,
    [limit]
  );
}

/**
 * Get rolling averages by region (14-day window)
 */
export async function getRollingAverages(): Promise<RollingAverage[]> {
  return query<RollingAverage>(
    `SELECT
       region,
       ROUND(AVG(post_count)::numeric, 1) as avg_posts_6h,
       COUNT(*) as sample_count,
       MIN(post_count) as min_posts,
       MAX(post_count) as max_posts,
       (SELECT post_count FROM post_activity_logs p2
        WHERE p2.region = post_activity_logs.region
        ORDER BY bucket_timestamp DESC LIMIT 1) as latest_count
     FROM post_activity_logs
     WHERE bucket_timestamp > NOW() - INTERVAL '14 days'
     GROUP BY region
     ORDER BY region`
  );
}

/**
 * Get activity trend for a specific region
 */
export async function getActivityTrend(
  region: WatchpointId,
  days: number = 7
): Promise<ActivityLogEntry[]> {
  return query<ActivityLogEntry>(
    `SELECT * FROM post_activity_logs
     WHERE region = $1
       AND bucket_timestamp > NOW() - INTERVAL '1 day' * $2
     ORDER BY bucket_timestamp DESC`,
    [region, days]
  );
}

export interface RegionBaselineAverage {
  region: string;
  avg_posts_6h: number;
  sample_count: number;
}

/**
 * Get per-region baseline averages from the 'all' region rows.
 * The 'all' rows contain region_breakdown JSONB with per-region counts
 * that reflect the ACTUAL post distribution after region reclassification.
 * Uses 14-day rolling average.
 */
export async function getRegionBaselineAverages(): Promise<RegionBaselineAverage[]> {
  return query<RegionBaselineAverage>(
    `SELECT
       breakdown.key as region,
       ROUND(AVG(breakdown.value::numeric), 1) as avg_posts_6h,
       COUNT(*) as sample_count
     FROM post_activity_logs,
       jsonb_each_text(region_breakdown) as breakdown(key, value)
     WHERE region = 'all'
       AND bucket_timestamp > NOW() - INTERVAL '14 days'
       AND region_breakdown IS NOT NULL
     GROUP BY breakdown.key
     ORDER BY breakdown.key`
  );
}

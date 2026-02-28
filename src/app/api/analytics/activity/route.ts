import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  getRecentActivityLogs,
  getRollingAverages,
  getActivityTrend,
} from '@/lib/activityLogging';
import { REGION_BASELINES } from '@/lib/regionBaselines';
import { getAllCachedNews } from '@/lib/newsCache';
import { WatchpointId } from '@/types';

export const dynamic = 'force-dynamic';

const DISPLAY_REGIONS = new Set(['us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa']);
const BUCKET_MS = 6 * 60 * 60 * 1000;

/** Minimum DB data points before we fall back to computing from cached posts */
const MIN_DB_POINTS = 4;

/**
 * Compute activity history from cached news items by bucketing posts into 6h windows.
 * Fallback when the DB doesn't have enough logged history.
 */
function computeHistoryFromCache(daysParam: number) {
  const items = getAllCachedNews();
  if (!items || items.length === 0) return [];

  const cutoff = Date.now() - (daysParam * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const currentBucketStart = now - (now % BUCKET_MS);

  // Bucket posts by 6h window
  const buckets = new Map<number, Record<string, number>>();

  for (const item of items) {
    const ts = item.timestamp.getTime();
    if (ts < cutoff) continue;
    const bucketStart = ts - (ts % BUCKET_MS);
    // Skip the current incomplete bucket
    if (bucketStart >= currentBucketStart) continue;

    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, {});
    }
    const regionCounts = buckets.get(bucketStart)!;
    const region = item.region as string;
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  }

  // Convert to sorted data points
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, regionCounts]) => {
      const regions: Record<string, number> = {};
      let total = 0;
      for (const [key, value] of Object.entries(regionCounts)) {
        if (DISPLAY_REGIONS.has(key)) {
          regions[key] = value;
        }
        total += value;
      }
      return {
        timestamp: new Date(bucketStart).toISOString(),
        total,
        regions,
      };
    });
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`analytics-activity:${clientIp}`, { maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview';
  const region = searchParams.get('region') as WatchpointId | null;
  const days = parseInt(searchParams.get('days') || '7', 10);

  try {
    if (view === 'overview') {
      const [averages, recentLogs] = await Promise.all([
        getRollingAverages(),
        getRecentActivityLogs(100),
      ]);

      return NextResponse.json({
        averages,
        recentLogs,
        meta: {
          generatedAt: new Date().toISOString(),
          windowDays: 14,
        },
      });
    }

    if (view === 'trend' && region) {
      const trend = await getActivityTrend(region, days);
      const regionTrend = trend.map(row => ({
        ...row,
        post_count: region === 'all'
          ? row.post_count
          : (row.region_breakdown?.[region] ?? 0),
      }));
      return NextResponse.json({
        region,
        trend: regionTrend,
        meta: {
          generatedAt: new Date().toISOString(),
          days,
        },
      });
    }

    if (view === 'history') {
      const daysParam = Math.min(Math.max(1, days), 30);

      // Try DB first
      const trend = await getActivityTrend('all' as WatchpointId, daysParam);

      let dataPoints: { timestamp: string; total: number; regions: Record<string, number> }[] = trend
        .filter(r => r.region_breakdown)
        .map(r => {
          const regions: Record<string, number> = {};
          for (const [key, value] of Object.entries(r.region_breakdown!)) {
            if (DISPLAY_REGIONS.has(key)) regions[key] = value;
          }
          return {
            timestamp: typeof r.bucket_timestamp === 'string' ? r.bucket_timestamp : new Date(r.bucket_timestamp).toISOString(),
            total: r.post_count,
            regions,
          };
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Fallback: if DB has too few points, compute from cached news items
      if (dataPoints.length < MIN_DB_POINTS) {
        const cachePoints = computeHistoryFromCache(daysParam);
        if (cachePoints.length > dataPoints.length) {
          dataPoints = cachePoints;
        }
      }

      // Use static measured baselines
      const baselines: Record<string, number> = {};
      for (const region of DISPLAY_REGIONS) {
        baselines[region] = REGION_BASELINES[region] || 20;
      }

      return NextResponse.json({
        dataPoints,
        baselines,
        meta: {
          generatedAt: new Date().toISOString(),
          days: daysParam,
          bucketSizeHours: 6,
          source: dataPoints.length >= MIN_DB_POINTS ? 'database' : 'cache-fallback',
        },
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}

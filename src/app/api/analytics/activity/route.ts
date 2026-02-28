import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  getRecentActivityLogs,
  getRollingAverages,
  getActivityTrend,
  getRegionBaselineAverages,
} from '@/lib/activityLogging';
import { WatchpointId } from '@/types';

export const dynamic = 'force-dynamic';

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
      // Get rolling averages and recent logs
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
      // Extract per-region counts from the 'all' rows' region_breakdown JSONB
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

      const [trend, baselineAverages] = await Promise.all([
        getActivityTrend('all' as WatchpointId, daysParam),
        getRegionBaselineAverages(),
      ]);

      // Known display regions — filter out 'all' and other non-display keys from region_breakdown
      const DISPLAY_REGIONS = new Set(['us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa']);

      const dataPoints = trend
        .filter(r => r.region_breakdown)
        .map(r => {
          const regions: Record<string, number> = {};
          for (const [key, value] of Object.entries(r.region_breakdown!)) {
            if (DISPLAY_REGIONS.has(key)) regions[key] = value;
          }
          return {
            timestamp: r.bucket_timestamp,
            total: r.post_count,
            regions,
          };
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const baselines: Record<string, number> = {};
      for (const avg of baselineAverages) {
        if (DISPLAY_REGIONS.has(avg.region)) {
          baselines[avg.region] = Math.round(avg.avg_posts_6h);
        }
      }

      return NextResponse.json({
        dataPoints,
        baselines,
        meta: {
          generatedAt: new Date().toISOString(),
          days: daysParam,
          bucketSizeHours: 6,
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

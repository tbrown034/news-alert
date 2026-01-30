import { NextResponse } from 'next/server';
import {
  getRecentActivityLogs,
  getRollingAverages,
  getActivityTrend,
} from '@/lib/activityLogging';
import { WatchpointId } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
      return NextResponse.json({
        region,
        trend,
        meta: {
          generatedAt: new Date().toISOString(),
          days,
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

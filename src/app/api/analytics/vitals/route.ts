import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getRecentWebVitals, getWebVitalsSummary, getWebVitalsTimeline } from '@/lib/webVitalsLogging';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`analytics-vitals:${clientIp}`, { maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview';
  const days = Math.min(Math.max(1, parseInt(searchParams.get('days') || '7', 10)), 30);

  try {
    if (view === 'overview') {
      const [summary, recentLogs] = await Promise.all([
        getWebVitalsSummary(days),
        getRecentWebVitals(50),
      ]);

      return NextResponse.json({
        summary,
        recentLogs,
        meta: { generatedAt: new Date().toISOString(), days },
      });
    }

    if (view === 'timeline') {
      const timeline = await getWebVitalsTimeline(days);

      return NextResponse.json({
        timeline,
        meta: { generatedAt: new Date().toISOString(), days },
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
  } catch (error) {
    console.error('[Analytics/Vitals] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch vitals data' }, { status: 500 });
  }
}

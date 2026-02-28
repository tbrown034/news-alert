import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logWebVital, ensureWebVitalsTable } from '@/lib/webVitalsLogging';

export const dynamic = 'force-dynamic';

// Track whether table has been ensured this process
let tableEnsured = false;

const VALID_METRICS = new Set(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']);

export async function POST(request: Request) {
  // Rate limit: 30 req/min (vitals come in batches)
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`vitals:${clientIp}`, { maxRequests: 30 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const metrics = Array.isArray(body) ? body : [body];

    // Ensure table exists (once per process)
    if (!tableEnsured) {
      await ensureWebVitalsTable();
      tableEnsured = true;
    }

    // Fallback page path from Referer header
    const referer = request.headers.get('referer');
    let refererPath: string | undefined;
    if (referer) {
      try {
        refererPath = new URL(referer).pathname;
      } catch { /* ignore */ }
    }

    // Log each metric (fire-and-forget style, but await for the POST response)
    const promises = metrics
      .filter((m: Record<string, unknown>) => m.name && VALID_METRICS.has(m.name as string))
      .slice(0, 20) // Cap at 20 metrics per request
      .map((m: Record<string, unknown>) =>
        logWebVital(
          m.name as string,
          m.value as number,
          m.delta as number,
          m.rating as string,
          m.id as string,
          (typeof m.pagePath === 'string' ? m.pagePath : refererPath),
          m.navigationType as string,
        )
      );

    await Promise.all(promises);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[Vitals API] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to log vitals' }, { status: 500 });
  }
}

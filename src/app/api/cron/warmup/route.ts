import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Guard: CRON_SECRET must be configured
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const start = Date.now();
  const results: Record<string, { status: number; duration: number; items?: number }> = {};

  // Fetch both feeds in parallel — each route handles its own live fetch + DB write
  const [osintResult, mainstreamResult] = await Promise.allSettled([
    (async () => {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/news?region=all&hours=6`, {
        headers: { 'User-Agent': 'PulseWarmup/1.0 (internal cron)' },
        signal: AbortSignal.timeout(55000),
      });
      const data = await res.json();
      return { status: res.status, duration: Date.now() - t0, items: data.totalItems as number };
    })(),
    (async () => {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/mainstream?region=all`, {
        headers: { 'User-Agent': 'PulseWarmup/1.0 (internal cron)' },
        signal: AbortSignal.timeout(55000),
      });
      const data = await res.json();
      return { status: res.status, duration: Date.now() - t0, items: data.totalArticles as number };
    })(),
  ]);

  if (osintResult.status === 'fulfilled') {
    results.osint = osintResult.value;
  } else {
    console.error('[Warmup] OSINT fetch failed:', osintResult.reason);
    results.osint = { status: 0, duration: Date.now() - start };
  }

  if (mainstreamResult.status === 'fulfilled') {
    results.mainstream = mainstreamResult.value;
  } else {
    console.error('[Warmup] Mainstream fetch failed:', mainstreamResult.reason);
    results.mainstream = { status: 0, duration: Date.now() - start };
  }

  const totalDuration = Date.now() - start;
  console.log(`[Warmup] Done in ${totalDuration}ms — osint: ${results.osint?.status}, mainstream: ${results.mainstream?.status}`);

  return NextResponse.json({
    success: true,
    duration: totalDuration,
    results,
  });
}

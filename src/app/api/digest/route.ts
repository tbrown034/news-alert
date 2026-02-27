import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getLatestDigest, getRecentDigests } from '@/lib/digestGeneration';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`digest:${clientIp}`, { maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get('count');
  const count = Math.min(Math.max(0, countParam ? parseInt(countParam, 10) || 0 : 0), 50);

  try {
    if (count > 1) {
      const digests = await getRecentDigests(count);
      return NextResponse.json(
        { digests, fetchedAt: new Date().toISOString() },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    const digest = await getLatestDigest();
    return NextResponse.json(
      { digest, fetchedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[Digest API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load digest' },
      { status: 500 }
    );
  }
}

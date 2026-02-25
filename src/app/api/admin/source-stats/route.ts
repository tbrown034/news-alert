import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getStats } from '@/lib/sourceStats';
import { ADMIN_EMAILS } from '@/lib/admin';

async function getAdminSession(): Promise<{ email: string } | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.email) return null;
    if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return null;
    return { email: session.user.email };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`admin-source-stats:${clientIp}`, { maxRequests: 30 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { handle, platform } = body;

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json({ error: 'handle is required' }, { status: 400 });
    }
    if (!platform || !['bluesky', 'mastodon', 'telegram'].includes(platform)) {
      return NextResponse.json({ error: 'platform must be bluesky, mastodon, or telegram' }, { status: 400 });
    }

    const stats = await getStats(handle.trim(), platform);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Source Stats API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch source stats' }, { status: 500 });
  }
}

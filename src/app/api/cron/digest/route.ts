import { NextResponse } from 'next/server';
import { generateDigest } from '@/lib/digestGeneration';

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

  try {
    const digest = await generateDigest();
    if (!digest) {
      return NextResponse.json({ success: false, reason: 'Not enough articles' });
    }
    return NextResponse.json({
      success: true,
      digestId: digest.id,
      headline: digest.headline,
      storiesCount: digest.stories.length,
      articlesAnalyzed: digest.articlesAnalyzed,
    });
  } catch (error) {
    console.error('[Cron Digest] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { cleanupOldVitals } from '@/lib/webVitalsLogging';
import { cleanupOldActivityLogs } from '@/lib/activityLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RETENTION_DAYS = 90;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, { deleted: number; error?: string }> = {};

  const [vitalsResult, activityResult] = await Promise.allSettled([
    cleanupOldVitals(RETENTION_DAYS),
    cleanupOldActivityLogs(RETENTION_DAYS),
  ]);

  if (vitalsResult.status === 'fulfilled') {
    results.web_vitals = { deleted: vitalsResult.value };
  } else {
    console.error('[Cleanup] web_vitals failed:', vitalsResult.reason);
    results.web_vitals = { deleted: 0, error: String(vitalsResult.reason) };
  }

  if (activityResult.status === 'fulfilled') {
    results.post_activity_logs = { deleted: activityResult.value };
  } else {
    console.error('[Cleanup] post_activity_logs failed:', activityResult.reason);
    results.post_activity_logs = { deleted: 0, error: String(activityResult.reason) };
  }

  const totalDeleted = (results.web_vitals?.deleted || 0) + (results.post_activity_logs?.deleted || 0);
  console.log(`[Cleanup] Done — ${totalDeleted} rows deleted (vitals: ${results.web_vitals?.deleted}, activity: ${results.post_activity_logs?.deleted})`);

  return NextResponse.json({
    success: true,
    retentionDays: RETENTION_DAYS,
    results,
  });
}

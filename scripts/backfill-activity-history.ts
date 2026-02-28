/**
 * BACKFILL ACTIVITY HISTORY
 * =========================
 * Fetches all sources, buckets posts into 6h windows, and inserts them into
 * the post_activity_logs table. This gives the activity chart immediate
 * historical data instead of waiting days for it to accumulate.
 *
 * Safe to run multiple times — uses UPSERT with GREATEST for post_count.
 *
 * Usage:
 *   npx tsx scripts/backfill-activity-history.ts
 *   npx tsx scripts/backfill-activity-history.ts --dry-run
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const isDryRun = process.argv.includes('--dry-run');
const BUCKET_MS = 6 * 60 * 60 * 1000;
const DISPLAY_REGIONS = ['us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa'];

function getBucketKey(ts: Date): number {
  const ms = ts.getTime();
  return ms - (ms % BUCKET_MS);
}

async function main() {
  console.log('Backfilling activity history...');
  if (isDryRun) console.log('DRY RUN — will not write to DB\n');

  const { fetchAllSources, getSourcesForRegion } = await import('../src/lib/fetchSources');
  const { query } = await import('../src/lib/db');

  const sources = getSourcesForRegion('all' as any);
  console.log(`Fetching ${sources.length} sources...`);

  const fetchStart = Date.now();
  const items = await fetchAllSources(sources);
  const fetchDuration = ((Date.now() - fetchStart) / 1000).toFixed(1);

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const posts: { timestamp: Date; region: string; platform?: string }[] = [];
  for (const item of items) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    posts.push({
      timestamp: item.timestamp,
      region: item.region,
      platform: item.source?.platform || (item as any).platform,
    });
  }

  console.log(`Fetched ${posts.length} unique posts (${fetchDuration}s)\n`);

  // Bucket posts into 6h windows
  const now = Date.now();
  const currentBucketStart = now - (now % BUCKET_MS);

  const buckets = new Map<number, {
    regionBreakdown: Record<string, number>;
    platformBreakdown: Record<string, number>;
    total: number;
  }>();

  for (const post of posts) {
    const bucketStart = getBucketKey(post.timestamp);
    // Skip current incomplete bucket
    if (bucketStart >= currentBucketStart) continue;

    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, { regionBreakdown: {}, platformBreakdown: {}, total: 0 });
    }
    const bucket = buckets.get(bucketStart)!;
    bucket.regionBreakdown[post.region] = (bucket.regionBreakdown[post.region] || 0) + 1;
    if (post.platform) {
      bucket.platformBreakdown[post.platform] = (bucket.platformBreakdown[post.platform] || 0) + 1;
    }
    bucket.total++;
  }

  // Sort and display
  const sortedBuckets = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  console.log(`Found ${sortedBuckets.length} complete 6h buckets\n`);

  for (const [bucketStart, data] of sortedBuckets) {
    const ts = new Date(bucketStart).toISOString();
    const regionParts = DISPLAY_REGIONS.map(r => `${r}=${data.regionBreakdown[r] || 0}`).join(', ');
    console.log(`  ${ts}: total=${data.total} (${regionParts})`);
  }

  if (isDryRun) {
    console.log('\nDry run — no DB writes');
    process.exit(0);
  }

  // Insert into DB
  console.log(`\nInserting ${sortedBuckets.length} rows into post_activity_logs...`);

  let inserted = 0;
  for (const [bucketStart, data] of sortedBuckets) {
    const bucketTimestamp = new Date(bucketStart).toISOString();
    try {
      await query(
        `INSERT INTO post_activity_logs
          (bucket_timestamp, region, post_count, source_count, region_breakdown, platform_breakdown)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (bucket_timestamp, region)
         DO UPDATE SET
           post_count = GREATEST(post_activity_logs.post_count, EXCLUDED.post_count),
           region_breakdown = EXCLUDED.region_breakdown,
           platform_breakdown = EXCLUDED.platform_breakdown,
           recorded_at = NOW()`,
        [
          bucketTimestamp,
          'all',
          data.total,
          sources.length,
          JSON.stringify(data.regionBreakdown),
          JSON.stringify(data.platformBreakdown),
        ]
      );
      inserted++;
    } catch (err) {
      console.error(`  Failed for ${bucketTimestamp}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done! Inserted/updated ${inserted} rows.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

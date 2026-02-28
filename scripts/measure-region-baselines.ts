/**
 * MEASURE REGION BASELINES
 * ========================
 * Fetches all OSINT sources (same pipeline as the API), buckets posts into 6h
 * windows, averages the complete buckets, and writes the results to
 * src/lib/regionBaselines.ts.
 *
 * This replaces the DB-derived and PPD-sum baseline systems with a simple,
 * direct measurement.
 *
 * Usage:
 *   npx tsx scripts/measure-region-baselines.ts
 *   npx tsx scripts/measure-region-baselines.ts --dry-run   # Preview without writing
 *   npm run measure:baselines
 *
 * When to re-run:
 *   - After adding/removing sources in sources-clean.ts
 *   - After changing region classification logic
 *   - Monthly drift check
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const isDryRun = process.argv.includes('--dry-run');

// 6-hour bucket size in ms
const BUCKET_MS = 6 * 60 * 60 * 1000;

// Minimum baseline per region — prevents zero baselines
const MIN_BASELINE = 20;

// Known display regions
const DISPLAY_REGIONS = ['us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa'];

interface PostRecord {
  timestamp: Date;
  region: string;
}

/**
 * Bucket a timestamp into a 6h window (aligned to 00:00/06:00/12:00/18:00 UTC)
 */
function getBucketKey(ts: Date): string {
  const ms = ts.getTime();
  const bucketStart = ms - (ms % BUCKET_MS);
  return new Date(bucketStart).toISOString();
}

/**
 * Get the current incomplete bucket key (so we can exclude it)
 */
function getCurrentBucketKey(): string {
  return getBucketKey(new Date());
}

async function main() {
  console.log('Measuring region baselines...');
  if (isDryRun) console.log('DRY RUN — will not write regionBaselines.ts\n');

  // Import shared fetch pipeline
  const { fetchAllSources, getSourcesForRegion } = await import('../src/lib/fetchSources');

  const sources = getSourcesForRegion('all' as any);
  console.log(`Fetching ${sources.length} sources...`);

  const fetchStart = Date.now();
  const items = await fetchAllSources(sources);
  const fetchDuration = ((Date.now() - fetchStart) / 1000).toFixed(1);

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const posts: PostRecord[] = [];
  for (const item of items) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    posts.push({ timestamp: item.timestamp, region: item.region });
  }

  console.log(`Fetched ${posts.length} unique posts (${fetchDuration}s)\n`);

  // Bucket posts into 6h windows
  const buckets = new Map<string, Map<string, number>>();

  for (const post of posts) {
    const bucketKey = getBucketKey(post.timestamp);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, new Map());
    }
    const regionCounts = buckets.get(bucketKey)!;
    regionCounts.set(post.region, (regionCounts.get(post.region) || 0) + 1);
    regionCounts.set('all', (regionCounts.get('all') || 0) + 1);
  }

  // Discard current incomplete bucket
  const currentBucket = getCurrentBucketKey();
  buckets.delete(currentBucket);

  // Sort buckets by time
  const allBucketKeys = [...buckets.keys()].sort();
  console.log(`Found ${allBucketKeys.length} total buckets`);

  if (allBucketKeys.length === 0) {
    console.error('No complete buckets found. Posts may be too recent.');
    process.exit(1);
  }

  // Only use recent buckets for averaging — APIs return limited history per source,
  // so older buckets have artificially low counts (posts fell off the feed).
  // Use the last 3 days (12 buckets) which represent actual current activity.
  const RECENT_BUCKETS = 12; // 3 days × 4 buckets/day
  const sortedKeys = allBucketKeys.slice(-RECENT_BUCKETS);

  const oldestBucket = sortedKeys[0];
  const newestBucket = sortedKeys[sortedKeys.length - 1];
  console.log(`Using ${sortedKeys.length} recent buckets for averaging`);
  console.log(`  Range: ${oldestBucket} → ${newestBucket}\n`);

  // Average counts per region across recent complete buckets
  const regionSums: Record<string, number> = {};
  const allRegions = [...DISPLAY_REGIONS, 'all'];

  for (const region of allRegions) {
    regionSums[region] = 0;
  }

  for (const bucketKey of sortedKeys) {
    const regionCounts = buckets.get(bucketKey)!;
    for (const region of allRegions) {
      regionSums[region] += regionCounts.get(region) || 0;
    }
  }

  const baselines: Record<string, number> = {};
  console.log('Averages per 6h bucket:');
  for (const region of allRegions) {
    const avg = regionSums[region] / sortedKeys.length;
    baselines[region] = Math.max(MIN_BASELINE, Math.round(avg));
    const padded = region.padEnd(16);
    console.log(`  ${padded} ${Math.round(avg)} posts (raw avg: ${avg.toFixed(1)})`);
  }

  // Show per-bucket detail for debugging
  console.log('\nPer-bucket breakdown (last 8):');
  const recentKeys = sortedKeys.slice(-8);
  for (const bucketKey of recentKeys) {
    const regionCounts = buckets.get(bucketKey)!;
    const total = regionCounts.get('all') || 0;
    const parts = DISPLAY_REGIONS.map(r => `${r}=${regionCounts.get(r) || 0}`).join(', ');
    console.log(`  ${bucketKey}: total=${total} (${parts})`);
  }

  // Generate the file content
  const measuredAt = new Date().toISOString();
  const fileContent = `// AUTO-GENERATED by: npx tsx scripts/measure-region-baselines.ts
// Run \`npm run measure:baselines\` to update after adding/removing sources.
// Last measured: ${measuredAt}
// Based on ${sortedKeys.length} complete 6h buckets (${oldestBucket} → ${newestBucket})
export const REGION_BASELINES: Record<string, number> = {
${allRegions.map(r => `  '${r}': ${baselines[r]},`).join('\n')}
};
export const BASELINES_MEASURED_AT = '${measuredAt}';
`;

  if (isDryRun) {
    console.log('\nWould write to src/lib/regionBaselines.ts:');
    console.log(fileContent);
  } else {
    const outPath = path.resolve(__dirname, '../src/lib/regionBaselines.ts');
    fs.writeFileSync(outPath, fileContent, 'utf-8');
    console.log(`\nWritten to ${outPath}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

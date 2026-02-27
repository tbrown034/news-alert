/**
 * PPD Validation Script
 * =====================
 * Empirically compares stored baselinePPD values against actual API post counts
 * to find where the 5-7x inflation between PPD-derived baselines and live activity comes from.
 *
 * Tests:
 * 1. Per-source: fetch via sourceStats (100 posts) vs live API (10 posts), count in 6h window
 * 2. Region-level: sum PPD baselines vs actual counts from live fetch
 * 3. Region:all double-counting: check if "all" sources inflate specific region counts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// We need to use direct imports since this is a standalone script
const BLUESKY_API = 'https://public.api.bsky.app/xrpc';

// ── Types ────────────────────────────────────────────────────────────────────

interface SourceSample {
  id: string;
  name: string;
  handle: string;
  platform: string;
  region: string;
  baselinePPD: number;
  effectivePPD: number;
  expected6h: number;
}

interface ValidationResult {
  source: SourceSample;
  statsApiPosts: number;        // Posts from sourceStats-style fetch (100 limit, no reposts)
  statsApiPostsIn6h: number;    // Of those, how many are within 6h
  liveApiPosts: number;         // Posts from live fetch (10 limit, includes reposts)
  liveApiPostsIn6h: number;     // Of those, how many are within 6h
  liveApiReposts: number;       // How many of live 10 are reposts
  regionReassigned: number;     // Posts whose region would change via classifyRegion
  error?: string;
}

// ── Source samples ───────────────────────────────────────────────────────────

const SAMPLE_SOURCES: SourceSample[] = [
  // High-activity Bluesky
  { id: 'noelreports', name: 'NOELREPORTS', handle: 'noelreports.com', platform: 'bluesky', region: 'europe-russia', baselinePPD: 36.7, effectivePPD: 36.7, expected6h: 36.7 / 4 },
  { id: 'ap-news', name: 'AP News', handle: 'apnews.com', platform: 'bluesky', region: 'all', baselinePPD: 37, effectivePPD: 37, expected6h: 37 / 4 },
  { id: 'war-monitor', name: 'War Monitor', handle: 'warmonitor.net', platform: 'bluesky', region: 'all', baselinePPD: 8.7, effectivePPD: 8.7, expected6h: 8.7 / 4 },
  { id: 'factal', name: 'Factal', handle: 'factal.com', platform: 'bluesky', region: 'all', baselinePPD: 4.1, effectivePPD: 4.1, expected6h: 4.1 / 4 },
  { id: 'bno-news', name: 'BNO News', handle: 'bnonews.com', platform: 'bluesky', region: 'all', baselinePPD: 1.4, effectivePPD: 1.4, expected6h: 1.4 / 4 },

  // Medium-activity Bluesky
  { id: 'christopher-miller-ft', name: 'Chris Miller (FT)', handle: 'christopherjm.ft.com', platform: 'bluesky', region: 'europe-russia', baselinePPD: 1.1, effectivePPD: 1.1, expected6h: 1.1 / 4 },
  { id: 'malcontent-news', name: 'Malcontent News', handle: 'malcontentnews.bsky.social', platform: 'bluesky', region: 'all', baselinePPD: 2.2, effectivePPD: 2.2, expected6h: 2.2 / 4 },

  // Telegram
  { id: 'telegram-deepstateua', name: 'DeepState UA', handle: 'DeepStateUA', platform: 'telegram', region: 'europe-russia', baselinePPD: 0, effectivePPD: 3, expected6h: 3 / 4 },
  { id: 'telegram-wartranslated', name: 'WarTranslated', handle: 'wartranslated', platform: 'telegram', region: 'europe-russia', baselinePPD: 0, effectivePPD: 3, expected6h: 3 / 4 },

  // Mastodon
  { id: 'mastodon-briankrebs', name: 'Brian Krebs', handle: 'briankrebs@infosec.exchange', platform: 'mastodon', region: 'all', baselinePPD: 0, effectivePPD: 3, expected6h: 3 / 4 },
  { id: 'mastodon-gossithedog', name: 'Kevin Beaumont', handle: 'GossiTheDog@cyberplace.social', platform: 'mastodon', region: 'all', baselinePPD: 0, effectivePPD: 3, expected6h: 3 / 4 },
];

// ── Fetchers ─────────────────────────────────────────────────────────────────

/** Fetch Bluesky via sourceStats-style (100 posts, no reposts) */
async function fetchBlueskyStats(handle: string): Promise<{ total: number; in6h: number; timestamps: Date[] }> {
  const url = `${BLUESKY_API}/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=100&filter=posts_no_replies`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Bluesky stats ${res.status}`);
  const data = await res.json();
  const posts = (data.feed || []).filter((item: any) => !item.reason); // exclude reposts
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const timestamps = posts.map((item: any) => new Date(item.post.record.createdAt));
  const in6h = timestamps.filter((t: Date) => t.getTime() > cutoff).length;
  return { total: posts.length, in6h, timestamps };
}

/** Fetch Bluesky via live-api-style (10 posts, includes reposts) */
async function fetchBlueskyLive(handle: string): Promise<{ total: number; in6h: number; reposts: number }> {
  const url = `${BLUESKY_API}/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=10&filter=posts_no_replies`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Bluesky live ${res.status}`);
  const data = await res.json();
  const feed = data.feed || [];
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  let reposts = 0;
  let in6h = 0;
  for (const item of feed) {
    if (item.reason) reposts++;
    const ts = new Date(item.post.record.createdAt).getTime();
    if (ts > cutoff) in6h++;
  }
  return { total: feed.length, in6h, reposts };
}

/** Fetch Telegram via web scraper */
async function fetchTelegramPosts(channel: string): Promise<{ total: number; in6h: number }> {
  const url = `https://t.me/s/${channel}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}`);
  const html = await res.text();

  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const timeRegex = /<time[^>]*datetime="([^"]+)"[^>]*>/g;
  let match;
  const timestamps: number[] = [];
  while ((match = timeRegex.exec(html)) !== null) {
    timestamps.push(new Date(match[1]).getTime());
  }
  const in6h = timestamps.filter(t => t > cutoff).length;
  return { total: timestamps.length, in6h };
}

/** Fetch Mastodon posts */
async function fetchMastodonPosts(handle: string): Promise<{ total: number; in6h: number }> {
  const [user, instance] = handle.split('@');
  const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${user}`;
  const lookupRes = await fetch(lookupUrl, { signal: AbortSignal.timeout(8000) });
  if (!lookupRes.ok) throw new Error(`Mastodon lookup ${lookupRes.status}`);
  const account = await lookupRes.json();

  const statusUrl = `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=40&exclude_replies=true&exclude_reblogs=true`;
  const statusRes = await fetch(statusUrl, { signal: AbortSignal.timeout(8000) });
  if (!statusRes.ok) throw new Error(`Mastodon statuses ${statusRes.status}`);
  const statuses = await statusRes.json();

  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const in6h = statuses.filter((s: any) => new Date(s.created_at).getTime() > cutoff).length;
  return { total: statuses.length, in6h };
}

// ── Main validation ──────────────────────────────────────────────────────────

async function validateSource(source: SourceSample): Promise<ValidationResult> {
  try {
    if (source.platform === 'bluesky') {
      const [stats, live] = await Promise.all([
        fetchBlueskyStats(source.handle),
        fetchBlueskyLive(source.handle),
      ]);
      return {
        source,
        statsApiPosts: stats.total,
        statsApiPostsIn6h: stats.in6h,
        liveApiPosts: live.total,
        liveApiPostsIn6h: live.in6h,
        liveApiReposts: live.reposts,
        regionReassigned: 0, // Would need full classifyRegion to check
      };
    } else if (source.platform === 'telegram') {
      const tg = await fetchTelegramPosts(source.handle);
      return {
        source,
        statsApiPosts: tg.total,
        statsApiPostsIn6h: tg.in6h,
        liveApiPosts: tg.total, // Telegram doesn't have a separate "live" mode
        liveApiPostsIn6h: tg.in6h,
        liveApiReposts: 0,
        regionReassigned: 0,
      };
    } else if (source.platform === 'mastodon') {
      const masto = await fetchMastodonPosts(source.handle);
      return {
        source,
        statsApiPosts: masto.total,
        statsApiPostsIn6h: masto.in6h,
        liveApiPosts: masto.total,
        liveApiPostsIn6h: masto.in6h,
        liveApiReposts: 0,
        regionReassigned: 0,
      };
    }
    throw new Error(`Unsupported platform: ${source.platform}`);
  } catch (err: any) {
    return {
      source,
      statsApiPosts: 0,
      statsApiPostsIn6h: 0,
      liveApiPosts: 0,
      liveApiPostsIn6h: 0,
      liveApiReposts: 0,
      regionReassigned: 0,
      error: err.message,
    };
  }
}

/** Check if region:all sources are double-counted in baselines */
function analyzeRegionAllDoubleCounting() {
  // Import dynamically since we need TS resolution
  // Instead, we'll just manually analyze based on what we know
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  REGION:ALL DOUBLE-COUNTING ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log('From code analysis (activityDetection.ts lines 51-63):');
  console.log('  - Sources with region "all" contribute ONLY to regionTotals["all"]');
  console.log('  - They do NOT get added to specific region baselines');
  console.log('  - getSourcesByRegion("all") returns ALL sources');
  console.log('  - getSourcesByRegion("europe-russia") returns region=europe-russia AND region=all');
  console.log();
  console.log('KEY FINDING: Baseline calculation and actual fetch use DIFFERENT grouping!');
  console.log();
  console.log('  BASELINE (activityDetection.ts):');
  console.log('    region "europe-russia" baseline = SUM(PPD for sources with region=europe-russia) / 4');
  console.log('    region "all" baseline = SUM(PPD for ALL sources) / 4');
  console.log();
  console.log('  ACTUAL COUNT (route.ts):');
  console.log('    region="all" fetch → gets ALL sources → items counted per-region by classifyRegion');
  console.log('    region="europe-russia" fetch → gets (region=europe-russia + region=all) sources');
  console.log('    → BUT items then re-classified by classifyRegion, may land in any region');
  console.log();
  console.log('  ACTIVITY CALC (route.ts line 383):');
  console.log('    calculateRegionActivity(fullWindowItems) counts items by item.region');
  console.log('    item.region = classifyRegion output (not source.region!)');
  console.log();
  console.log('  IMPLICATION:');
  console.log('    A source with region=all and PPD=37 (like AP News):');
  console.log('    - Its PPD contributes ONLY to the "all" baseline (not to middle-east, europe-russia, etc.)');
  console.log('    - But its POSTS get classified into specific regions by classifyRegion');
  console.log('    - So region-specific counts include posts from region=all sources');
  console.log('    - But region-specific baselines do NOT include region=all source PPDs');
  console.log('    - This INFLATES the apparent activity ratio for specific regions!');
}

/** Check Bluesky repost behavior in live feed */
async function analyzeRepostBehavior() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  BLUESKY REPOST ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  // Fetch a high-activity source with limit=10 to see repost proportion
  const highActivity = ['noelreports.com', 'apnews.com', 'warmonitor.net'];
  for (const handle of highActivity) {
    try {
      const url = `${BLUESKY_API}/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=30&filter=posts_no_replies`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const feed = data.feed || [];
      let originals = 0, reposts = 0;
      for (const item of feed) {
        if (item.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
          reposts++;
        } else {
          originals++;
        }
      }
      console.log(`  ${handle}: ${feed.length} items = ${originals} originals + ${reposts} reposts (${Math.round(reposts/feed.length*100)}% reposts)`);
    } catch (e: any) {
      console.log(`  ${handle}: ERROR - ${e.message}`);
    }
  }

  console.log();
  console.log('  NOTE: Live API uses filter=posts_no_replies but this does NOT filter reposts.');
  console.log('  sourceStats.ts additionally filters .filter(item => !item.reason) to remove reposts.');
  console.log('  The live feed includes reposts in the count — this inflates per-source item count.');
}

async function main() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const slot = Math.floor(utcHour / 6);
  const multipliers = [0.4, 0.8, 1.5, 1.3];
  const todMultiplier = multipliers[slot];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PPD VALIDATION: Stored Baselines vs Actual Post Counts');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Time: ${now.toISOString()} (UTC hour ${utcHour}, slot ${slot})`);
  console.log(`  ToD Multiplier: ${todMultiplier}`);
  console.log(`  Testing ${SAMPLE_SOURCES.length} sources across 3 platforms`);
  console.log();

  // Run all validations
  const results: ValidationResult[] = [];
  for (const source of SAMPLE_SOURCES) {
    process.stdout.write(`  Fetching ${source.name}...`);
    const result = await validateSource(source);
    results.push(result);
    if (result.error) {
      console.log(` ERROR: ${result.error}`);
    } else {
      console.log(` done (${result.statsApiPostsIn6h} in 6h)`);
    }
    // Small delay between sources
    await new Promise(r => setTimeout(r, 200));
  }

  // Print comparison table
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PER-SOURCE COMPARISON TABLE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  const header = [
    'Source'.padEnd(22),
    'Platform'.padEnd(10),
    'Region'.padEnd(15),
    'BasePPD'.padStart(8),
    'Exp6h'.padStart(6),
    'Adj6h'.padStart(6),
    'Stats100'.padStart(9),
    'In6h'.padStart(6),
    'Live10'.padStart(7),
    'Reposts'.padStart(8),
    'Ratio'.padStart(7),
  ].join(' │ ');

  console.log(header);
  console.log('─'.repeat(header.length));

  for (const r of results) {
    const adjExpected = r.source.expected6h * todMultiplier;
    const ratio = adjExpected > 0 ? (r.statsApiPostsIn6h / adjExpected).toFixed(1) : 'N/A';
    const row = [
      r.source.name.padEnd(22),
      r.source.platform.padEnd(10),
      r.source.region.padEnd(15),
      r.source.effectivePPD.toFixed(1).padStart(8),
      r.source.expected6h.toFixed(1).padStart(6),
      adjExpected.toFixed(1).padStart(6),
      r.error ? 'ERR'.padStart(9) : String(r.statsApiPosts).padStart(9),
      r.error ? 'ERR'.padStart(6) : String(r.statsApiPostsIn6h).padStart(6),
      r.error ? 'ERR'.padStart(7) : String(r.liveApiPosts).padStart(7),
      r.error ? 'ERR'.padStart(8) : String(r.liveApiReposts).padStart(8),
      String(ratio).padStart(7),
    ].join(' │ ');
    console.log(row);
  }

  // Summary stats
  console.log();
  const blueskyResults = results.filter(r => r.source.platform === 'bluesky' && !r.error);
  if (blueskyResults.length > 0) {
    const totalExpected6h = blueskyResults.reduce((sum, r) => sum + r.source.expected6h * todMultiplier, 0);
    const totalActual6h = blueskyResults.reduce((sum, r) => sum + r.statsApiPostsIn6h, 0);
    const totalReposts = blueskyResults.reduce((sum, r) => sum + r.liveApiReposts, 0);
    const totalLive = blueskyResults.reduce((sum, r) => sum + r.liveApiPosts, 0);
    const overallRatio = totalExpected6h > 0 ? (totalActual6h / totalExpected6h).toFixed(2) : 'N/A';
    const repostPct = totalLive > 0 ? (totalReposts / totalLive * 100).toFixed(1) : '0';

    console.log(`  Bluesky summary (${blueskyResults.length} sources):`);
    console.log(`    Total expected in 6h (adj): ${totalExpected6h.toFixed(1)}`);
    console.log(`    Total actual in 6h (stats): ${totalActual6h}`);
    console.log(`    Overall ratio (actual/expected): ${overallRatio}x`);
    console.log(`    Repost percentage in live feed: ${repostPct}%`);
  }

  // Repost analysis
  await analyzeRepostBehavior();

  // Region:all double-counting analysis
  analyzeRegionAllDoubleCounting();

  // Key findings
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  KEY FINDINGS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  // Count how many sources have reposts
  const repostSources = results.filter(r => r.liveApiReposts > 0);
  if (repostSources.length > 0) {
    console.log(`  1. REPOSTS: ${repostSources.length}/${results.length} sources have reposts in live feed`);
    console.log('     Live API includes reposts; sourceStats excludes them.');
    console.log('     This means items attributed to source X may actually be');
    console.log('     reposts from other authors — inflating per-source activity.');
  }

  console.log();
  console.log('  2. REGION REASSIGNMENT:');
  console.log('     classifyRegion() can move items from source.region to a different');
  console.log('     item.region based on content keywords. This means:');
  console.log('     - A "region=all" source with PPD=37 posts about 8 different regions');
  console.log('     - Its PPD is in the "all" baseline only');
  console.log('     - But its posts are scattered across specific region counts');
  console.log('     - Specific regions get the posts but not the baseline allocation');

  console.log();
  console.log('  3. BASELINE vs FETCH MISMATCH:');
  console.log('     Baseline: flat PPD/4 per 6h slot, adjusted by ToD multiplier');
  console.log('     Fetch: capped at 10 posts per Bluesky source (limit=10 in rss.ts:985)');
  console.log('     For a source with PPD=37 (like AP News or NOELREPORTS):');
  console.log('       - Expected 6h = 37/4 = 9.25 posts');
  console.log('       - But API only fetches 10 posts max, some may be older than 6h');
  console.log('       - Actual 6h count depends on posting recency, not PPD accuracy');
}

main().catch(console.error);

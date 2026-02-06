/**
 * MEASURE SOURCE BASELINES
 * ========================
 * Paginate through 30 days of post history for each Bluesky/Telegram/Mastodon source
 * and calculate actual postsPerDay values. Updates sources-clean.ts with measured
 * decimal values (which activityDetection.ts trusts over round-number guesses).
 *
 * Usage:
 *   npx tsx scripts/measure-source-baselines.ts
 *   npx tsx scripts/measure-source-baselines.ts --dry-run   # Print results without updating
 *   npx tsx scripts/measure-source-baselines.ts --platform bluesky  # Only measure one platform
 */

import * as fs from 'fs';
import * as path from 'path';

// Load env for Telegram credentials
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const LOOKBACK_DAYS = 30;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
const cutoffDate = new Date(Date.now() - LOOKBACK_MS);

const isDryRun = process.argv.includes('--dry-run');
const platformFilter = process.argv.find(a => a.startsWith('--platform='))?.split('=')[1]
  || (process.argv.includes('--platform') ? process.argv[process.argv.indexOf('--platform') + 1] : null);

interface MeasuredBaseline {
  sourceId: string;
  name: string;
  platform: string;
  totalPosts: number;
  daysSpan: number;
  postsPerDay: number;
  oldPostsPerDay: number;
}

const results: MeasuredBaseline[] = [];
const errors: { sourceId: string; error: string }[] = [];

// =============================================================================
// BLUESKY MEASUREMENT
// =============================================================================

async function measureBlueskySource(source: any): Promise<MeasuredBaseline | null> {
  const handleMatch = source.feedUrl?.match(/bsky\.app\/profile\/([^\/]+)/);
  const handle = handleMatch?.[1];
  if (!handle) {
    errors.push({ sourceId: source.id, error: 'Could not extract handle from feedUrl' });
    return null;
  }

  let totalPosts = 0;
  let cursor: string | undefined;
  let oldestPostDate: Date | null = null;
  let reachedCutoff = false;

  try {
    while (!reachedCutoff) {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          errors.push({ sourceId: source.id, error: `Account not found (${response.status})` });
          return null;
        }
        // Rate limited or server error — stop and use what we have
        break;
      }

      const data = await response.json();
      const feed = data.feed || [];

      if (feed.length === 0) break;

      for (const entry of feed) {
        const postDate = new Date(entry.post?.record?.createdAt || entry.post?.indexedAt);
        if (postDate < cutoffDate) {
          reachedCutoff = true;
          break;
        }
        totalPosts++;
        oldestPostDate = postDate;
      }

      cursor = data.cursor;
      if (!cursor) break;

      // Rate limit: 100ms between requests
      await new Promise(r => setTimeout(r, 100));
    }
  } catch (err: any) {
    if (totalPosts === 0) {
      errors.push({ sourceId: source.id, error: err.message });
      return null;
    }
    // Use partial data if we got some posts
  }

  if (totalPosts === 0) return null;

  // Calculate days span — either full 30 days or from oldest post to now
  const now = new Date();
  const spanMs = oldestPostDate ? now.getTime() - oldestPostDate.getTime() : LOOKBACK_MS;
  const daysSpan = Math.max(1, spanMs / (24 * 60 * 60 * 1000));
  const postsPerDay = Math.round((totalPosts / daysSpan) * 10) / 10;

  return {
    sourceId: source.id,
    name: source.name,
    platform: 'bluesky',
    totalPosts,
    daysSpan: Math.round(daysSpan * 10) / 10,
    postsPerDay,
    oldPostsPerDay: source.postsPerDay,
  };
}

// =============================================================================
// MASTODON MEASUREMENT
// =============================================================================

async function measureMastodonSource(source: any): Promise<MeasuredBaseline | null> {
  const urlMatch = source.feedUrl?.match(/https?:\/\/([^\/]+)\/@([^\/\?]+)/);
  if (!urlMatch) {
    errors.push({ sourceId: source.id, error: 'Could not parse Mastodon feedUrl' });
    return null;
  }

  const instance = urlMatch[1];
  const handle = urlMatch[2];

  try {
    // First look up account ID
    const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${handle}`;
    const lookupResp = await fetch(lookupUrl);
    if (!lookupResp.ok) {
      errors.push({ sourceId: source.id, error: `Account lookup failed (${lookupResp.status})` });
      return null;
    }
    const account = await lookupResp.json();
    const accountId = account.id;

    let totalPosts = 0;
    let maxId: string | undefined;
    let oldestPostDate: Date | null = null;
    let reachedCutoff = false;

    while (!reachedCutoff) {
      const statusesUrl = `https://${instance}/api/v1/accounts/${accountId}/statuses?limit=40&exclude_replies=true${maxId ? `&max_id=${maxId}` : ''}`;
      const resp = await fetch(statusesUrl);
      if (!resp.ok) break;

      const statuses = await resp.json();
      if (!statuses.length) break;

      for (const status of statuses) {
        const postDate = new Date(status.created_at);
        if (postDate < cutoffDate) {
          reachedCutoff = true;
          break;
        }
        totalPosts++;
        oldestPostDate = postDate;
        maxId = status.id;
      }

      // Rate limit: 100ms between requests
      await new Promise(r => setTimeout(r, 100));
    }

    if (totalPosts === 0) return null;

    const now = new Date();
    const spanMs = oldestPostDate ? now.getTime() - oldestPostDate.getTime() : LOOKBACK_MS;
    const daysSpan = Math.max(1, spanMs / (24 * 60 * 60 * 1000));
    const postsPerDay = Math.round((totalPosts / daysSpan) * 10) / 10;

    return {
      sourceId: source.id,
      name: source.name,
      platform: 'mastodon',
      totalPosts,
      daysSpan: Math.round(daysSpan * 10) / 10,
      postsPerDay,
      oldPostsPerDay: source.postsPerDay,
    };
  } catch (err: any) {
    errors.push({ sourceId: source.id, error: err.message });
    return null;
  }
}

// =============================================================================
// TELEGRAM MEASUREMENT
// =============================================================================

async function measureTelegramSource(source: any): Promise<MeasuredBaseline | null> {
  const handleMatch = source.feedUrl?.match(/t\.me\/s\/([^\/\?]+)/);
  const handle = handleMatch?.[1];
  if (!handle) {
    errors.push({ sourceId: source.id, error: 'Could not extract Telegram handle' });
    return null;
  }

  // Try MTProto first, fall back to scraping
  try {
    const result = await measureTelegramMTProto(source, handle);
    if (result) return result;
  } catch {
    // Fall through to scraper
  }

  // Fallback: scrape the public web page (only gets recent ~20 posts)
  try {
    return await measureTelegramScrape(source, handle);
  } catch (err: any) {
    errors.push({ sourceId: source.id, error: `Scrape failed: ${err.message}` });
    return null;
  }
}

async function measureTelegramMTProto(source: any, handle: string): Promise<MeasuredBaseline | null> {
  // Dynamically import to avoid issues if telegram deps aren't available
  const { getTelegramClient, isTelegramApiAvailable } = await import('../src/lib/telegramClient');

  if (!isTelegramApiAvailable()) return null;

  const client = await getTelegramClient();
  if (!client) return null;

  let totalPosts = 0;
  let oldestPostDate: Date | null = null;
  let offsetId = 0;
  let reachedCutoff = false;
  let pages = 0;
  const MAX_PAGES = 10; // Cap at 1000 messages to avoid FloodWait hell

  while (!reachedCutoff && pages < MAX_PAGES) {
    const messages = await client.getMessages(handle, {
      limit: 100,
      offsetId,
    });
    pages++;

    if (!messages || messages.length === 0) break;

    for (const msg of messages) {
      if (!msg.message?.trim()) continue; // Skip media-only

      const postDate = msg.date ? new Date(msg.date * 1000) : null;
      if (!postDate) continue;

      if (postDate < cutoffDate) {
        reachedCutoff = true;
        break;
      }

      totalPosts++;
      oldestPostDate = postDate;
      offsetId = msg.id;
    }

    // Rate limit: 500ms between requests (more conservative to reduce FloodWait)
    await new Promise(r => setTimeout(r, 500));
  }

  if (totalPosts === 0) return null;

  const now = new Date();
  const spanMs = oldestPostDate ? now.getTime() - oldestPostDate.getTime() : LOOKBACK_MS;
  const daysSpan = Math.max(1, spanMs / (24 * 60 * 60 * 1000));
  const postsPerDay = Math.round((totalPosts / daysSpan) * 10) / 10;

  return {
    sourceId: source.id,
    name: source.name,
    platform: 'telegram',
    totalPosts,
    daysSpan: Math.round(daysSpan * 10) / 10,
    postsPerDay,
    oldPostsPerDay: source.postsPerDay,
  };
}

async function measureTelegramScrape(source: any, handle: string): Promise<MeasuredBaseline | null> {
  // Scrape t.me/s/HANDLE — only gets recent ~20 posts, but better than nothing
  const url = `https://t.me/s/${handle}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulseBot/1.0)' },
  });
  if (!resp.ok) return null;

  const html = await resp.text();
  const dateMatches = [...html.matchAll(/datetime="([^"]+)"/g)];

  if (dateMatches.length === 0) return null;

  let totalPosts = 0;
  let oldestPostDate: Date | null = null;

  for (const match of dateMatches) {
    const postDate = new Date(match[1]);
    if (postDate < cutoffDate) break;
    totalPosts++;
    oldestPostDate = postDate;
  }

  if (totalPosts === 0) return null;

  const now = new Date();
  const spanMs = oldestPostDate ? now.getTime() - oldestPostDate.getTime() : LOOKBACK_MS;
  const daysSpan = Math.max(1, spanMs / (24 * 60 * 60 * 1000));
  const postsPerDay = Math.round((totalPosts / daysSpan) * 10) / 10;

  return {
    sourceId: source.id,
    name: source.name,
    platform: 'telegram (scraped)',
    totalPosts,
    daysSpan: Math.round(daysSpan * 10) / 10,
    postsPerDay,
    oldPostsPerDay: source.postsPerDay,
  };
}

// =============================================================================
// UPDATE SOURCES FILE
// =============================================================================

function updateSourcesFile(baselines: MeasuredBaseline[]) {
  const sourcesPath = path.resolve(__dirname, '../src/lib/sources-clean.ts');
  let content = fs.readFileSync(sourcesPath, 'utf-8');

  let updated = 0;
  for (const baseline of baselines) {
    // Match postsPerDay value for this source by finding the source block
    // Look for the id line, then find postsPerDay within the next few lines
    const idPattern = `id: '${baseline.sourceId}'`;
    const idIdx = content.indexOf(idPattern);
    if (idIdx === -1) {
      console.warn(`  Could not find source ${baseline.sourceId} in file`);
      continue;
    }

    // Find the postsPerDay line within the next 300 chars (should be in the same source block)
    const searchRegion = content.slice(idIdx, idIdx + 400);
    const ppdMatch = searchRegion.match(/postsPerDay:\s*[\d.]+/);
    if (!ppdMatch) {
      console.warn(`  Could not find postsPerDay for ${baseline.sourceId}`);
      continue;
    }

    const oldValue = ppdMatch[0];
    const newValue = `postsPerDay: ${baseline.postsPerDay}`;

    if (oldValue === newValue) continue;

    // Replace in the actual content at the right position
    const ppdIdx = idIdx + searchRegion.indexOf(oldValue);
    content = content.slice(0, ppdIdx) + newValue + content.slice(ppdIdx + oldValue.length);
    updated++;
  }

  if (updated > 0) {
    fs.writeFileSync(sourcesPath, content, 'utf-8');
    console.log(`\nUpdated ${updated} postsPerDay values in sources-clean.ts`);
  } else {
    console.log('\nNo changes needed in sources-clean.ts');
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`Measuring source baselines (${LOOKBACK_DAYS}-day lookback)`);
  console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
  if (isDryRun) console.log('DRY RUN — will not update sources-clean.ts\n');
  if (platformFilter) console.log(`Platform filter: ${platformFilter}\n`);

  // Import sources
  const { tier1Sources, tier2Sources, tier3Sources } = await import('../src/lib/sources-clean');
  const allSources = [...tier1Sources, ...tier2Sources, ...tier3Sources];

  const blueskySources = allSources.filter(s => s.platform === 'bluesky');
  const telegramSources = allSources.filter(s => s.platform === 'telegram');
  const mastodonSources = allSources.filter(s => s.platform === 'mastodon');

  // Measure Bluesky
  if (!platformFilter || platformFilter === 'bluesky') {
    console.log(`\n=== BLUESKY (${blueskySources.length} sources) ===`);
    for (let i = 0; i < blueskySources.length; i++) {
      const source = blueskySources[i];
      process.stdout.write(`  [${i + 1}/${blueskySources.length}] ${source.name}...`);
      const result = await measureBlueskySource(source);
      if (result) {
        results.push(result);
        const change = result.postsPerDay !== result.oldPostsPerDay
          ? ` (was ${result.oldPostsPerDay})`
          : '';
        console.log(` ${result.postsPerDay}/day (${result.totalPosts} posts over ${result.daysSpan}d)${change}`);
      } else {
        console.log(' FAILED');
      }
    }
  }

  // Measure Telegram
  if (!platformFilter || platformFilter === 'telegram') {
    console.log(`\n=== TELEGRAM (${telegramSources.length} sources) ===`);
    for (let i = 0; i < telegramSources.length; i++) {
      const source = telegramSources[i];
      process.stdout.write(`  [${i + 1}/${telegramSources.length}] ${source.name}...`);
      const result = await measureTelegramSource(source);
      if (result) {
        results.push(result);
        const change = result.postsPerDay !== result.oldPostsPerDay
          ? ` (was ${result.oldPostsPerDay})`
          : '';
        console.log(` ${result.postsPerDay}/day (${result.totalPosts} posts over ${result.daysSpan}d)${change}`);
      } else {
        console.log(' FAILED');
      }
    }
  }

  // Measure Mastodon
  if (!platformFilter || platformFilter === 'mastodon') {
    console.log(`\n=== MASTODON (${mastodonSources.length} sources) ===`);
    for (let i = 0; i < mastodonSources.length; i++) {
      const source = mastodonSources[i];
      process.stdout.write(`  [${i + 1}/${mastodonSources.length}] ${source.name}...`);
      const result = await measureMastodonSource(source);
      if (result) {
        results.push(result);
        const change = result.postsPerDay !== result.oldPostsPerDay
          ? ` (was ${result.oldPostsPerDay})`
          : '';
        console.log(` ${result.postsPerDay}/day (${result.totalPosts} posts over ${result.daysSpan}d)${change}`);
      } else {
        console.log(' FAILED');
      }
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Measured: ${results.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const err of errors) {
      console.log(`  ${err.sourceId}: ${err.error}`);
    }
  }

  // Show biggest changes
  const changes = results
    .filter(r => r.postsPerDay !== r.oldPostsPerDay)
    .sort((a, b) => Math.abs(b.postsPerDay - b.oldPostsPerDay) - Math.abs(a.postsPerDay - a.oldPostsPerDay));

  if (changes.length > 0) {
    console.log(`\nBiggest changes (${changes.length} sources):`);
    for (const c of changes.slice(0, 20)) {
      const direction = c.postsPerDay > c.oldPostsPerDay ? '+' : '';
      const diff = c.postsPerDay - c.oldPostsPerDay;
      console.log(`  ${c.name}: ${c.oldPostsPerDay} → ${c.postsPerDay} (${direction}${diff.toFixed(1)}/day)`);
    }
  }

  // Update file
  if (!isDryRun && results.length > 0) {
    updateSourcesFile(results);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

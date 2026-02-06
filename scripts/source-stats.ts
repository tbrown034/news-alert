#!/usr/bin/env npx tsx
/**
 * Source Stats — Query any Bluesky/Mastodon/Telegram handle for posting activity.
 *
 * Usage:
 *   npx tsx scripts/source-stats.ts <handle>                     # Single Bluesky handle
 *   npx tsx scripts/source-stats.ts <handle> --platform mastodon  # Single Mastodon handle
 *   npx tsx scripts/source-stats.ts <handle> --platform telegram  # Single Telegram channel
 *   npx tsx scripts/source-stats.ts --all                         # All OSINT sources
 *   npx tsx scripts/source-stats.ts --all --platform bluesky      # All Bluesky sources
 *   npx tsx scripts/source-stats.ts --inactive 48                 # No posts in 48h
 *   npx tsx scripts/source-stats.ts --spammy 50                   # >50 posts/day
 *   npx tsx scripts/source-stats.ts --update                      # Measure all & write back to sources-clean.ts
 *   npx tsx scripts/source-stats.ts --update --dry-run            # Preview changes without writing
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://public.api.bsky.app/xrpc';
const SOURCES_FILE = path.join(__dirname, '..', 'src', 'lib', 'sources-clean.ts');

interface PostTimestamp {
  timestamp: Date;
  text?: string;
}

// ── Bluesky ──────────────────────────────────────────────────────────────────

async function fetchBlueskyPosts(handle: string, limit = 100): Promise<PostTimestamp[]> {
  // Strip leading @ if present
  const cleanHandle = handle.replace(/^@/, '');
  const url = `${API_BASE}/app.bsky.feed.getAuthorFeed?actor=${cleanHandle}&limit=${limit}&filter=posts_no_replies`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Bluesky ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.feed || [])
    .filter((item: any) => !item.reason) // skip reposts
    .map((item: any) => ({
      timestamp: new Date(item.post.record.createdAt),
      text: item.post.record.text?.slice(0, 120),
    }));
}

// ── Mastodon ─────────────────────────────────────────────────────────────────

async function fetchMastodonPosts(handle: string, limit = 100): Promise<PostTimestamp[]> {
  // handle format: @user@instance or user@instance
  const clean = handle.replace(/^@/, '');
  const parts = clean.split('@');
  if (parts.length !== 2) throw new Error(`Mastodon handle must be user@instance, got: ${handle}`);
  const [user, instance] = parts;

  const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${user}`;
  const lookupRes = await fetch(lookupUrl, { signal: AbortSignal.timeout(8000) });
  if (!lookupRes.ok) throw new Error(`Mastodon lookup ${lookupRes.status} for ${handle}`);
  const account = await lookupRes.json();

  const statusUrl = `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`;
  const statusRes = await fetch(statusUrl, { signal: AbortSignal.timeout(8000) });
  if (!statusRes.ok) throw new Error(`Mastodon statuses ${statusRes.status} for ${handle}`);
  const statuses = await statusRes.json();

  return statuses.map((s: any) => ({
    timestamp: new Date(s.created_at),
    text: (s.content || '').replace(/<[^>]*>/g, '').slice(0, 120),
  }));
}

// ── Telegram ─────────────────────────────────────────────────────────────────

async function fetchTelegramPosts(channel: string, limit = 40): Promise<PostTimestamp[]> {
  const clean = channel.replace(/^@/, '');
  const url = `https://t.me/s/${clean}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Telegram ${res.status} for ${channel}`);
  const html = await res.text();

  const posts: PostTimestamp[] = [];
  const timeRegex = /<time[^>]*datetime="([^"]+)"[^>]*>/g;
  let match;
  while ((match = timeRegex.exec(html)) !== null) {
    posts.push({ timestamp: new Date(match[1]) });
  }
  return posts.slice(-limit);
}

// ── Stats calculation ────────────────────────────────────────────────────────

interface SourceStats {
  id?: string;        // source id from sources-clean.ts
  handle: string;
  platform: string;
  totalPosts: number;
  lastPosted: string;
  lastPostedAgo: string;
  spanDays: number;
  postsPerDay: number;
  postsLast6h: number;
  postsLast12h: number;
  postsLast24h: number;
  postsLast48h: number;
  gapHoursAvg: number;
  gapHoursMax: number;
  oldPostsPerDay?: number; // previous value from file
  error?: string;
}

function calculateStats(handle: string, platform: string, posts: PostTimestamp[]): SourceStats {
  const now = new Date();

  if (posts.length === 0) {
    return {
      handle, platform, totalPosts: 0,
      lastPosted: 'never', lastPostedAgo: 'n/a', spanDays: 0,
      postsPerDay: 0, postsLast6h: 0, postsLast12h: 0,
      postsLast24h: 0, postsLast48h: 0, gapHoursAvg: 0, gapHoursMax: 0,
    };
  }

  posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const newest = posts[0].timestamp;
  const oldest = posts[posts.length - 1].timestamp;
  const spanMs = newest.getTime() - oldest.getTime();
  const spanDays = spanMs / (1000 * 60 * 60 * 24);

  const agoMs = now.getTime() - newest.getTime();
  const agoHours = agoMs / (1000 * 60 * 60);

  let lastPostedAgo: string;
  if (agoHours < 1) lastPostedAgo = `${Math.round(agoHours * 60)}m ago`;
  else if (agoHours < 24) lastPostedAgo = `${agoHours.toFixed(1)}h ago`;
  else lastPostedAgo = `${(agoHours / 24).toFixed(1)}d ago`;

  const cutoff = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const postsLast6h = posts.filter(p => p.timestamp >= cutoff(6)).length;
  const postsLast12h = posts.filter(p => p.timestamp >= cutoff(12)).length;
  const postsLast24h = posts.filter(p => p.timestamp >= cutoff(24)).length;
  const postsLast48h = posts.filter(p => p.timestamp >= cutoff(48)).length;

  const postsPerDay = spanDays > 0 ? posts.length / spanDays : posts.length;

  const gaps: number[] = [];
  for (let i = 0; i < posts.length - 1; i++) {
    const gapMs = posts[i].timestamp.getTime() - posts[i + 1].timestamp.getTime();
    gaps.push(gapMs / (1000 * 60 * 60));
  }
  const gapHoursAvg = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const gapHoursMax = gaps.length > 0 ? Math.max(...gaps) : 0;

  return {
    handle, platform, totalPosts: posts.length,
    lastPosted: newest.toISOString(),
    lastPostedAgo,
    spanDays: Math.round(spanDays * 10) / 10,
    postsPerDay: Math.round(postsPerDay * 10) / 10,
    postsLast6h, postsLast12h, postsLast24h, postsLast48h,
    gapHoursAvg: Math.round(gapHoursAvg * 10) / 10,
    gapHoursMax: Math.round(gapHoursMax * 10) / 10,
  };
}

// ── Display ──────────────────────────────────────────────────────────────────

function printStats(stats: SourceStats) {
  if (stats.error) {
    console.log(`\n❌ ${stats.handle} (${stats.platform}): ${stats.error}`);
    return;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 ${stats.handle} (${stats.platform})`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Last posted:     ${stats.lastPostedAgo} (${stats.lastPosted})`);
  console.log(`  Posts sampled:   ${stats.totalPosts} over ${stats.spanDays} days`);
  console.log(`  Avg posts/day:   ${stats.postsPerDay}`);
  console.log(`  ┌─ Last 6h:      ${stats.postsLast6h}`);
  console.log(`  ├─ Last 12h:     ${stats.postsLast12h}`);
  console.log(`  ├─ Last 24h:     ${stats.postsLast24h}`);
  console.log(`  └─ Last 48h:     ${stats.postsLast48h}`);
  console.log(`  Avg gap:         ${stats.gapHoursAvg}h between posts`);
  console.log(`  Max gap:         ${stats.gapHoursMax}h (longest silence)`);
}

function printTable(allStats: SourceStats[]) {
  allStats.sort((a, b) => b.postsPerDay - a.postsPerDay);

  console.log(`\n${'═'.repeat(100)}`);
  console.log(`  ${'Handle'.padEnd(35)} ${'Plat'.padEnd(10)} ${'Last'.padEnd(10)} ${'PPD'.padStart(6)} ${'6h'.padStart(4)} ${'24h'.padStart(5)} ${'48h'.padStart(5)} ${'Gap'.padStart(6)}`);
  console.log(`${'─'.repeat(100)}`);

  for (const s of allStats) {
    if (s.error) {
      console.log(`  ${s.handle.padEnd(35)} ${s.platform.padEnd(10)} ❌ ${s.error.slice(0, 50)}`);
      continue;
    }
    console.log(
      `  ${s.handle.slice(0, 34).padEnd(35)} ${s.platform.padEnd(10)} ${s.lastPostedAgo.padEnd(10)} ${String(s.postsPerDay).padStart(6)} ${String(s.postsLast6h).padStart(4)} ${String(s.postsLast24h).padStart(5)} ${String(s.postsLast48h).padStart(5)} ${(s.gapHoursAvg + 'h').padStart(6)}`
    );
  }
  console.log(`${'═'.repeat(100)}`);
  console.log(`  Total: ${allStats.length} sources | Errors: ${allStats.filter(s => s.error).length}`);
}

// ── Fetch dispatcher ─────────────────────────────────────────────────────────

async function getStats(handle: string, platform: string): Promise<SourceStats> {
  try {
    let posts: PostTimestamp[];
    switch (platform) {
      case 'bluesky':
        posts = await fetchBlueskyPosts(handle);
        break;
      case 'mastodon':
        posts = await fetchMastodonPosts(handle);
        break;
      case 'telegram':
        posts = await fetchTelegramPosts(handle);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    return calculateStats(handle, platform, posts);
  } catch (err: any) {
    return {
      handle, platform, totalPosts: 0, lastPosted: '', lastPostedAgo: '',
      spanDays: 0, postsPerDay: 0, postsLast6h: 0, postsLast12h: 0,
      postsLast24h: 0, postsLast48h: 0, gapHoursAvg: 0, gapHoursMax: 0,
      error: err.message?.slice(0, 200),
    };
  }
}

// ── File update logic ────────────────────────────────────────────────────────

function updateSourcesFile(statsMap: Map<string, SourceStats>, dryRun: boolean): { updated: number; skipped: number; notFound: number } {
  let content = fs.readFileSync(SOURCES_FILE, 'utf-8');
  const today = new Date().toISOString().split('T')[0]; // e.g. '2026-02-06'

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [sourceId, stats] of statsMap) {
    if (stats.error || stats.totalPosts === 0) {
      skipped++;
      continue;
    }

    // Require at least 1 day of data span for reliable daily averages.
    // With API limits (100 posts max), high-volume sources may only span
    // a few hours, giving wildly inflated extrapolations.
    if (stats.spanDays < 1) {
      skipped++;
      continue;
    }

    // Find the source block by its id
    const idPattern = new RegExp(`id:\\s*'${escapeRegex(sourceId)}'`);
    const idMatch = idPattern.exec(content);
    if (!idMatch) {
      notFound++;
      continue;
    }

    // Find the postsPerDay line within the next ~15 lines after the id
    const searchStart = idMatch.index;
    const searchEnd = content.indexOf('},', searchStart);
    if (searchEnd === -1) {
      notFound++;
      continue;
    }

    const block = content.substring(searchStart, searchEnd);

    // Replace postsPerDay value
    const ppdRegex = /postsPerDay:\s*[\d.]+/;
    const ppdMatch = ppdRegex.exec(block);
    if (!ppdMatch) {
      notFound++;
      continue;
    }

    const newPpd = `postsPerDay: ${stats.postsPerDay}`;
    const newBlock = block.replace(ppdRegex, newPpd);

    // Add or update baselineMeasuredAt
    let finalBlock: string;
    const bmaRegex = /baselineMeasuredAt:\s*'[^']*'/;
    const newBma = `baselineMeasuredAt: '${today}'`;

    if (bmaRegex.test(newBlock)) {
      // Update existing
      finalBlock = newBlock.replace(bmaRegex, newBma);
    } else {
      // Add after postsPerDay line
      finalBlock = newBlock.replace(
        /postsPerDay:\s*[\d.]+,/,
        `postsPerDay: ${stats.postsPerDay},\n    ${newBma},`
      );
    }

    content = content.substring(0, searchStart) + finalBlock + content.substring(searchEnd);
    updated++;
  }

  if (!dryRun && updated > 0) {
    fs.writeFileSync(SOURCES_FILE, content, 'utf-8');
  }

  return { updated, skipped, notFound };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Batch fetcher (shared by --all and --update) ─────────────────────────────

async function fetchAllStats(sources: any[], platformFilter?: string): Promise<SourceStats[]> {
  let filtered = sources.filter((s: any) =>
    ['bluesky', 'mastodon', 'telegram'].includes(s.platform)
  );
  if (platformFilter) {
    filtered = filtered.filter((s: any) => s.platform === platformFilter);
  }

  console.log(`\nFetching stats for ${filtered.length} sources...\n`);

  const allStats: SourceStats[] = [];

  // Group by platform for appropriate rate limiting
  const byPlatform = new Map<string, any[]>();
  for (const s of filtered) {
    const list = byPlatform.get(s.platform) || [];
    list.push(s);
    byPlatform.set(s.platform, list);
  }

  const platformConfig: Record<string, { batchSize: number; delayMs: number }> = {
    bluesky: { batchSize: 20, delayMs: 100 },
    mastodon: { batchSize: 5, delayMs: 200 },
    telegram: { batchSize: 5, delayMs: 500 },
  };

  let completed = 0;

  for (const [platform, sources] of byPlatform) {
    const config = platformConfig[platform] || { batchSize: 10, delayMs: 200 };
    console.log(`  ${platform}: ${sources.length} sources (batch ${config.batchSize}, ${config.delayMs}ms delay)`);

    for (let i = 0; i < sources.length; i += config.batchSize) {
      const batch = sources.slice(i, i + config.batchSize);
      const results = await Promise.all(
        batch.map((s: any) => {
          return getStats(s.handle, s.platform).then(stats => {
            stats.id = s.id;
            stats.oldPostsPerDay = s.postsPerDay;
            return stats;
          });
        })
      );
      allStats.push(...results);
      completed += batch.length;
      process.stdout.write(`\r  Progress: ${completed}/${filtered.length}`);
      if (i + config.batchSize < sources.length) {
        await new Promise(r => setTimeout(r, config.delayMs));
      }
    }
    console.log(''); // newline after platform
  }

  return allStats;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  const platformFlag = args.indexOf('--platform');
  const platformFilter = platformFlag !== -1 ? args[platformFlag + 1] : undefined;

  const inactiveFlag = args.indexOf('--inactive');
  const inactiveHours = inactiveFlag !== -1 ? parseInt(args[inactiveFlag + 1]) || 48 : 0;

  const spammyFlag = args.indexOf('--spammy');
  const spammyThreshold = spammyFlag !== -1 ? parseInt(args[spammyFlag + 1]) || 50 : 0;

  const isAll = args.includes('--all');
  const isUpdate = args.includes('--update');
  const isDryRun = args.includes('--dry-run');

  if (isUpdate) {
    // ── Update mode: measure all sources and write back to file ──
    const { allTieredSources } = await import('../src/lib/sources-clean');
    const allStats = await fetchAllStats(allTieredSources, platformFilter);

    // Build map of sourceId → stats
    const statsMap = new Map<string, SourceStats>();
    for (const stats of allStats) {
      if (stats.id) statsMap.set(stats.id, stats);
    }

    // Show what would change (applying same filters as the file write)
    const changes: { id: string; old: number; new_: number; handle: string }[] = [];
    const shortSpan: { handle: string; spanDays: number; postsPerDay: number }[] = [];
    for (const [id, stats] of statsMap) {
      if (stats.error || stats.totalPosts === 0) continue;
      if (stats.spanDays < 1) {
        shortSpan.push({ handle: stats.handle, spanDays: stats.spanDays, postsPerDay: stats.postsPerDay });
        continue;
      }
      if (stats.oldPostsPerDay !== undefined && stats.oldPostsPerDay !== stats.postsPerDay) {
        changes.push({ id, old: stats.oldPostsPerDay, new_: stats.postsPerDay, handle: stats.handle });
      }
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`  BASELINE UPDATE SUMMARY`);
    console.log(`${'─'.repeat(80)}`);

    const successful = allStats.filter(s => !s.error && s.totalPosts > 0);
    const errors = allStats.filter(s => s.error);

    console.log(`  Measured:    ${successful.length} sources`);
    console.log(`  Errors:      ${errors.length} sources`);
    console.log(`  Changes:     ${changes.length} sources with new postsPerDay values`);

    if (changes.length > 0) {
      console.log(`\n  ${'Source'.padEnd(40)} ${'Old PPD'.padStart(8)} ${'New PPD'.padStart(8)} ${'Change'.padStart(10)}`);
      console.log(`  ${'─'.repeat(70)}`);
      for (const c of changes.sort((a, b) => Math.abs(b.new_ - b.old) - Math.abs(a.new_ - a.old))) {
        const diff = c.new_ - c.old;
        const pct = c.old > 0 ? ((diff / c.old) * 100).toFixed(0) : 'new';
        const sign = diff > 0 ? '+' : '';
        console.log(`  ${c.handle.slice(0, 39).padEnd(40)} ${String(c.old).padStart(8)} ${String(c.new_).padStart(8)} ${(sign + pct + '%').padStart(10)}`);
      }
    }

    if (shortSpan.length > 0) {
      console.log(`\n  ⏭️  Skipped (< 1 day span, unreliable average):`);
      for (const s of shortSpan) {
        console.log(`     ${s.handle.padEnd(35)} ${s.spanDays}d span, ${s.postsPerDay} ppd measured`);
      }
    }

    if (errors.length > 0) {
      console.log(`\n  ⚠️  Errored sources (not updated):`);
      for (const s of errors) {
        console.log(`     ${s.handle.padEnd(35)} ${s.error?.slice(0, 50)}`);
      }
    }

    console.log(`${'═'.repeat(80)}`);

    if (isDryRun) {
      console.log(`\n  🔍 DRY RUN — no changes written. Remove --dry-run to apply.`);
    } else {
      const { updated, skipped, notFound } = updateSourcesFile(statsMap, false);
      console.log(`\n  ✅ Updated ${updated} sources in sources-clean.ts`);
      console.log(`     Skipped: ${skipped} (errors or insufficient data)`);
      if (notFound > 0) console.log(`     Not found in file: ${notFound}`);
    }

  } else if (isAll || inactiveHours || spammyThreshold) {
    // ── Batch display mode ──
    const { allTieredSources } = await import('../src/lib/sources-clean');
    const allStats = await fetchAllStats(allTieredSources, platformFilter);

    let filtered = allStats;

    if (inactiveHours) {
      const cutoff = new Date(Date.now() - inactiveHours * 60 * 60 * 1000);
      filtered = allStats.filter(s => !s.lastPosted || s.lastPosted === 'never' || new Date(s.lastPosted) < cutoff);
      console.log(`\n🔇 Sources with no posts in ${inactiveHours}h:`);
    }

    if (spammyThreshold) {
      filtered = allStats.filter(s => s.postsPerDay > spammyThreshold);
      console.log(`\n🔊 Sources averaging >${spammyThreshold} posts/day:`);
    }

    printTable(filtered);

  } else {
    // ── Single handle mode ──
    const handle = args.find(a => !a.startsWith('--'));
    if (!handle) {
      console.log(`
Usage:
  npx tsx scripts/source-stats.ts <handle>                       # Single Bluesky handle
  npx tsx scripts/source-stats.ts <handle> --platform mastodon   # Single Mastodon handle
  npx tsx scripts/source-stats.ts <handle> --platform telegram   # Single Telegram channel
  npx tsx scripts/source-stats.ts --all                          # All OSINT sources
  npx tsx scripts/source-stats.ts --all --platform bluesky       # All Bluesky sources
  npx tsx scripts/source-stats.ts --inactive 48                  # No posts in 48h
  npx tsx scripts/source-stats.ts --spammy 50                    # >50 posts/day
  npx tsx scripts/source-stats.ts --update                       # Measure all & update sources-clean.ts
  npx tsx scripts/source-stats.ts --update --dry-run             # Preview without writing
  npx tsx scripts/source-stats.ts --update --platform bluesky    # Update only Bluesky sources
      `);
      process.exit(1);
    }

    const platform = platformFilter || 'bluesky';
    const stats = await getStats(handle, platform);
    printStats(stats);
  }
}

main().catch(console.error);

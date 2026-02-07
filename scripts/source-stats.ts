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
import { getStats, type SourceStats } from '../src/lib/sourceStats';

const SOURCES_FILE = path.join(__dirname, '..', 'src', 'lib', 'sources-clean.ts');

// Extended stats with CLI-only fields
interface CLISourceStats extends SourceStats {
  id?: string;
  oldPostsPerDay?: number;
}

// ── Display ──────────────────────────────────────────────────────────────────

function printStats(stats: CLISourceStats) {
  if (stats.error) {
    console.log(`\n❌ ${stats.handle} (${stats.platform}): ${stats.error}`);
    return;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 ${stats.handle} (${stats.platform})`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Last posted:     ${stats.lastPostedAgo} (${stats.lastPosted})`);
  console.log(`  Posts sampled:   ${stats.totalPosts} over ${stats.spanDays} days`);
  console.log(`  Avg posts/day:   ${stats.postsPerDay}${stats.spanDays >= 7 ? ' (7d window)' : ` (${stats.spanDays}d span)`}`);
  console.log(`  ┌─ Last 6h:      ${stats.postsLast6h}`);
  console.log(`  ├─ Last 12h:     ${stats.postsLast12h}`);
  console.log(`  ├─ Last 24h:     ${stats.postsLast24h}`);
  console.log(`  ├─ Last 48h:     ${stats.postsLast48h}`);
  console.log(`  └─ Last 7d:      ${stats.postsLast7d}`);
  console.log(`  Avg gap:         ${stats.gapHoursAvg}h between posts`);
  console.log(`  Max gap:         ${stats.gapHoursMax}h (longest silence)`);
}

function printTable(allStats: CLISourceStats[]) {
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

// ── File update logic ────────────────────────────────────────────────────────

function updateSourcesFile(statsMap: Map<string, CLISourceStats>, dryRun: boolean): { updated: number; skipped: number; notFound: number } {
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

async function fetchAllStats(sources: any[], platformFilter?: string): Promise<CLISourceStats[]> {
  let filtered = sources.filter((s: any) =>
    ['bluesky', 'mastodon', 'telegram'].includes(s.platform)
  );
  if (platformFilter) {
    filtered = filtered.filter((s: any) => s.platform === platformFilter);
  }

  console.log(`\nFetching stats for ${filtered.length} sources...\n`);

  const allStats: CLISourceStats[] = [];

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
            const cliStats: CLISourceStats = { ...stats, id: s.id, oldPostsPerDay: s.postsPerDay };
            return cliStats;
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
    const statsMap = new Map<string, CLISourceStats>();
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

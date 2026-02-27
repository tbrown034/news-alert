#!/usr/bin/env npx tsx
/**
 * ESTIMATE PPD
 * ============
 * Quick PPD estimation using ~100 recent API posts per source.
 * Writes estimatedPPD + estimatedAt to sources-clean.ts.
 *
 * Usage:
 *   npx tsx scripts/estimate-ppd.ts                          # All feed sources
 *   npx tsx scripts/estimate-ppd.ts --region middle-east     # One region
 *   npx tsx scripts/estimate-ppd.ts --platform bluesky       # One platform
 *   npx tsx scripts/estimate-ppd.ts --dry-run                # Preview without writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { getStats, type SourceStats } from '../src/lib/sourceStats';

const SOURCES_FILE = path.join(__dirname, '..', 'src', 'lib', 'sources-clean.ts');
const FEED_PLATFORMS = new Set(['bluesky', 'telegram', 'mastodon']);

interface EstimateResult {
  sourceId: string;
  name: string;
  handle: string;
  platform: string;
  estimatedPPD: number;
  currentBaselinePPD?: number;
  currentEstimatedPPD?: number;
  error?: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function writeEstimates(estimates: EstimateResult[], dryRun: boolean): { updated: number; skipped: number; notFound: number } {
  let content = fs.readFileSync(SOURCES_FILE, 'utf-8');
  const today = new Date().toISOString().split('T')[0];

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const est of estimates) {
    if (est.error || est.estimatedPPD <= 0) {
      skipped++;
      continue;
    }

    const idPattern = new RegExp(`id:\\s*'${escapeRegex(est.sourceId)}'`);
    const idMatch = idPattern.exec(content);
    if (!idMatch) {
      notFound++;
      continue;
    }

    const searchStart = idMatch.index;
    const searchEnd = content.indexOf('},', searchStart);
    if (searchEnd === -1) {
      notFound++;
      continue;
    }

    let block = content.substring(searchStart, searchEnd);

    // Update or insert estimatedPPD
    const estPpdRegex = /estimatedPPD:\s*[\d.]+/;
    if (estPpdRegex.test(block)) {
      block = block.replace(estPpdRegex, `estimatedPPD: ${est.estimatedPPD}`);
    } else {
      // Insert after baselineMeasuredAt, or after baselinePPD, or before end
      const afterBma = /baselineMeasuredAt:\s*'[^']*',/;
      const afterPpd = /baselinePPD:\s*[\d.]+,/;
      if (afterBma.test(block)) {
        block = block.replace(afterBma, (m) => `${m}\n    estimatedPPD: ${est.estimatedPPD},`);
      } else if (afterPpd.test(block)) {
        block = block.replace(afterPpd, (m) => `${m}\n    estimatedPPD: ${est.estimatedPPD},`);
      } else {
        block = block.trimEnd() + `\n    estimatedPPD: ${est.estimatedPPD},`;
      }
    }

    // Update or insert estimatedAt
    const estAtRegex = /estimatedAt:\s*'[^']*'/;
    if (estAtRegex.test(block)) {
      block = block.replace(estAtRegex, `estimatedAt: '${today}'`);
    } else {
      block = block.replace(
        /estimatedPPD:\s*[\d.]+,/,
        (m) => `${m}\n    estimatedAt: '${today}',`
      );
    }

    content = content.substring(0, searchStart) + block + content.substring(searchEnd);
    updated++;
  }

  if (!dryRun && updated > 0) {
    fs.writeFileSync(SOURCES_FILE, content, 'utf-8');
  }

  return { updated, skipped, notFound };
}

async function main() {
  const args = process.argv.slice(2);

  const regionFlag = args.indexOf('--region');
  const regionFilter = regionFlag !== -1 ? args[regionFlag + 1] : undefined;

  const platformFlag = args.indexOf('--platform');
  const platformFilter = platformFlag !== -1 ? args[platformFlag + 1] : undefined;

  const isDryRun = args.includes('--dry-run');

  // Import sources
  const { allTieredSources } = await import('../src/lib/sources-clean');

  // Filter to feed sources
  let sources = allTieredSources.filter((s: any) => FEED_PLATFORMS.has(s.platform));
  if (regionFilter) sources = sources.filter((s: any) => s.region === regionFilter);
  if (platformFilter) sources = sources.filter((s: any) => s.platform === platformFilter);

  const label = [regionFilter, platformFilter].filter(Boolean).join(' ') || 'all feed';
  console.log(`\nEstimating PPD for ${sources.length} ${label} sources...`);
  if (isDryRun) console.log('DRY RUN — no changes will be written.\n');

  const results: EstimateResult[] = [];

  // Platform-specific batching
  const platformConfig: Record<string, { batchSize: number; delayMs: number }> = {
    bluesky: { batchSize: 20, delayMs: 100 },
    mastodon: { batchSize: 5, delayMs: 200 },
    telegram: { batchSize: 5, delayMs: 500 },
  };

  // Group by platform
  const byPlatform = new Map<string, any[]>();
  for (const s of sources) {
    const list = byPlatform.get(s.platform) || [];
    list.push(s);
    byPlatform.set(s.platform, list);
  }

  let completed = 0;

  for (const [platform, platformSources] of byPlatform) {
    const config = platformConfig[platform] || { batchSize: 10, delayMs: 200 };
    console.log(`\n${platform}: ${platformSources.length} sources (batch ${config.batchSize})`);

    for (let i = 0; i < platformSources.length; i += config.batchSize) {
      const batch = platformSources.slice(i, i + config.batchSize);
      const batchResults = await Promise.all(
        batch.map(async (s: any) => {
          try {
            const stats: SourceStats = await getStats(s.handle || s.id, s.platform);
            if (stats.error) {
              return {
                sourceId: s.id,
                name: s.name,
                handle: s.handle || s.id,
                platform: s.platform,
                estimatedPPD: 0,
                currentBaselinePPD: s.baselinePPD,
                currentEstimatedPPD: s.estimatedPPD,
                error: stats.error,
              };
            }
            return {
              sourceId: s.id,
              name: s.name,
              handle: s.handle || s.id,
              platform: s.platform,
              estimatedPPD: stats.recentPPD,
              currentBaselinePPD: s.baselinePPD,
              currentEstimatedPPD: s.estimatedPPD,
            };
          } catch (err: any) {
            return {
              sourceId: s.id,
              name: s.name,
              handle: s.handle || s.id,
              platform: s.platform,
              estimatedPPD: 0,
              error: err.message?.slice(0, 200),
            };
          }
        })
      );
      results.push(...batchResults);
      completed += batch.length;
      process.stdout.write(`\r  Progress: ${completed}/${sources.length}`);
      if (i + config.batchSize < platformSources.length) {
        await new Promise(r => setTimeout(r, config.delayMs));
      }
    }
    console.log('');
  }

  // Summary
  const successful = results.filter(r => !r.error && r.estimatedPPD > 0);
  const errors = results.filter(r => r.error);
  const driftWarnings: EstimateResult[] = [];

  for (const r of successful) {
    if (r.currentBaselinePPD && r.currentBaselinePPD > 0) {
      const ratio = r.estimatedPPD / r.currentBaselinePPD;
      if (ratio < 0.33 || ratio > 3) {
        driftWarnings.push(r);
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`  ESTIMATE SUMMARY`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`  Estimated:   ${successful.length} sources`);
  console.log(`  Errors:      ${errors.length} sources`);

  if (driftWarnings.length > 0) {
    console.log(`\n  DRIFT WARNINGS (estimate differs >3x from baseline):`);
    console.log(`  ${'Source'.padEnd(40)} ${'Baseline'.padStart(10)} ${'Estimate'.padStart(10)}`);
    console.log(`  ${'─'.repeat(62)}`);
    for (const w of driftWarnings) {
      console.log(`  ${w.name.slice(0, 39).padEnd(40)} ${String(w.currentBaselinePPD || '–').padStart(10)} ${String(w.estimatedPPD).padStart(10)}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n  ERRORS:`);
    for (const e of errors.slice(0, 20)) {
      console.log(`    ${e.handle.padEnd(35)} ${e.error?.slice(0, 50)}`);
    }
    if (errors.length > 20) console.log(`    ... and ${errors.length - 20} more`);
  }

  console.log(`${'='.repeat(80)}`);

  if (isDryRun) {
    console.log(`\n  DRY RUN — no changes written. Remove --dry-run to apply.\n`);

    // Show what would be written
    if (successful.length > 0) {
      console.log(`  Would update ${successful.length} sources:`);
      console.log(`  ${'Source'.padEnd(40)} ${'Est PPD'.padStart(8)}`);
      console.log(`  ${'─'.repeat(50)}`);
      for (const r of successful.sort((a, b) => b.estimatedPPD - a.estimatedPPD).slice(0, 30)) {
        console.log(`  ${r.name.slice(0, 39).padEnd(40)} ${String(r.estimatedPPD).padStart(8)}`);
      }
      if (successful.length > 30) console.log(`  ... and ${successful.length - 30} more`);
    }
  } else {
    const { updated, skipped, notFound } = writeEstimates(results, false);
    console.log(`\n  Updated ${updated} sources in sources-clean.ts`);
    console.log(`  Skipped: ${skipped} (errors or zero PPD)`);
    if (notFound > 0) console.log(`  Not found in file: ${notFound}`);
  }

  console.log('');
}

main().catch(console.error);

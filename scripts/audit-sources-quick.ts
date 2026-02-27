/**
 * Quick Source Audit
 * ==================
 * Fast alive-check for sources. Fetches 30 posts per source and reports
 * status, last post date, and measured PPD vs stored baseline.
 *
 * Reads sources from sources-clean.ts (no hardcoded lists).
 *
 * Usage:
 *   npx tsx scripts/audit-sources-quick.ts                        # All feed sources
 *   npx tsx scripts/audit-sources-quick.ts --region middle-east   # One region
 *   npx tsx scripts/audit-sources-quick.ts --platform bluesky     # One platform
 */

import { allTieredSources, TieredSource } from '../src/lib/sources-clean';

const FEED_PLATFORMS = new Set(['bluesky', 'telegram', 'mastodon']);

interface AuditResult {
  id: string;
  name: string;
  handle: string;
  platform: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  reason: string;
  lastPostDate: string;
  daysAgo: number;
  postCount: number;
  measuredPPD: number;
  storedPPD: number;
  ppdAccuracy: string;
}

async function fetchBlueskyQuick(handle: string): Promise<any[]> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=30&filter=posts_no_replies`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.feed || [];
}

async function fetchTelegramQuick(channel: string): Promise<{ timestamp: Date }[]> {
  const clean = channel.replace(/^@/, '');
  const res = await fetch(`https://t.me/s/${clean}`, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const posts: { timestamp: Date }[] = [];
  const timeRegex = /<time[^>]*datetime="([^"]+)"[^>]*>/g;
  let match;
  while ((match = timeRegex.exec(html)) !== null) {
    posts.push({ timestamp: new Date(match[1]) });
  }
  return posts.slice(-30);
}

async function fetchMastodonQuick(handle: string): Promise<{ timestamp: Date }[]> {
  const clean = handle.replace(/^@/, '');
  const parts = clean.split('@');
  if (parts.length !== 2) throw new Error(`Invalid handle: ${handle}`);
  const [user, instance] = parts;
  const lookupRes = await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${user}`, { signal: AbortSignal.timeout(8000) });
  if (!lookupRes.ok) throw new Error(`Lookup ${lookupRes.status}`);
  const account = await lookupRes.json();
  const statusRes = await fetch(`https://${instance}/api/v1/accounts/${account.id}/statuses?limit=30&exclude_replies=true&exclude_reblogs=true`, { signal: AbortSignal.timeout(8000) });
  if (!statusRes.ok) throw new Error(`Statuses ${statusRes.status}`);
  const statuses = await statusRes.json();
  return statuses.map((s: any) => ({ timestamp: new Date(s.created_at) }));
}

function measurePPD(timestamps: Date[]): { measuredPPD: number; lastPostDate: string; daysAgo: number } {
  if (timestamps.length === 0) return { measuredPPD: 0, lastPostDate: '', daysAgo: -1 };
  timestamps.sort((a, b) => b.getTime() - a.getTime());
  const newest = timestamps[0];
  const lastPostDate = newest.toISOString().split('T')[0];
  const daysAgo = Math.round((Date.now() - newest.getTime()) / (1000 * 60 * 60 * 24));
  let measuredPPD = 0;
  if (timestamps.length >= 2) {
    const oldest = timestamps[timestamps.length - 1];
    const spanDays = Math.max(1, (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    measuredPPD = Math.round((timestamps.length / spanDays) * 10) / 10;
  }
  return { measuredPPD, lastPostDate, daysAgo };
}

async function auditSource(source: TieredSource): Promise<AuditResult> {
  const result: AuditResult = {
    id: source.id,
    name: source.name,
    handle: source.handle || source.id,
    platform: source.platform,
    status: 'PASS',
    reason: '',
    lastPostDate: '',
    daysAgo: -1,
    postCount: 0,
    measuredPPD: 0,
    storedPPD: source.baselinePPD,
    ppdAccuracy: '',
  };

  try {
    let timestamps: Date[];

    if (source.platform === 'bluesky') {
      const posts = await fetchBlueskyQuick(source.handle || source.id);
      result.postCount = posts.length;
      timestamps = posts.map((p: any) => new Date(p.post?.record?.createdAt));
    } else if (source.platform === 'telegram') {
      const posts = await fetchTelegramQuick(source.handle || source.id);
      result.postCount = posts.length;
      timestamps = posts.map(p => p.timestamp);
    } else if (source.platform === 'mastodon') {
      const posts = await fetchMastodonQuick(source.handle || source.id);
      result.postCount = posts.length;
      timestamps = posts.map(p => p.timestamp);
    } else {
      result.status = 'FAIL';
      result.reason = `Unsupported platform: ${source.platform}`;
      return result;
    }

    if (result.postCount === 0) {
      result.status = 'FAIL';
      result.reason = 'Zero posts returned';
      return result;
    }

    const measured = measurePPD(timestamps);
    result.measuredPPD = measured.measuredPPD;
    result.lastPostDate = measured.lastPostDate;
    result.daysAgo = measured.daysAgo;

    // PPD accuracy
    if (result.measuredPPD > 0 && source.baselinePPD > 0) {
      const ratio = result.measuredPPD / source.baselinePPD;
      if (ratio < 0.25) result.ppdAccuracy = `OVER-STORED (stored ${source.baselinePPD}, actual ${result.measuredPPD})`;
      else if (ratio < 0.5) result.ppdAccuracy = `HIGH (stored ${source.baselinePPD}, actual ${result.measuredPPD})`;
      else if (ratio > 3) result.ppdAccuracy = `UNDER-STORED (stored ${source.baselinePPD}, actual ${result.measuredPPD})`;
      else result.ppdAccuracy = 'OK';
    }

    // Status
    if (result.daysAgo > 30) {
      result.status = 'FAIL';
      result.reason = `Dormant ${result.daysAgo} days`;
    } else if (result.daysAgo > 14) {
      result.status = 'WARN';
      result.reason = `Stale ${result.daysAgo} days`;
    } else if (result.measuredPPD < 0.1 && result.postCount < 3) {
      result.status = 'WARN';
      result.reason = 'Very low activity';
    } else {
      result.reason = 'Active';
    }
  } catch (e: any) {
    result.status = 'FAIL';
    result.reason = `Error: ${e.message}`;
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  const regionFlag = args.indexOf('--region');
  const regionFilter = regionFlag !== -1 ? args[regionFlag + 1] : undefined;

  const platformFlag = args.indexOf('--platform');
  const platformFilter = platformFlag !== -1 ? args[platformFlag + 1] : undefined;

  // Filter to feed sources (bluesky, telegram, mastodon)
  let sources = allTieredSources.filter(s => FEED_PLATFORMS.has(s.platform));
  if (regionFilter) sources = sources.filter(s => s.region === regionFilter);
  if (platformFilter) sources = sources.filter(s => s.platform === platformFilter);

  const label = [regionFilter, platformFilter].filter(Boolean).join(' ') || 'all feed';
  console.log(`\nAuditing ${sources.length} ${label} sources...\n`);

  const results: AuditResult[] = [];

  // Process in batches of 5
  for (let i = 0; i < sources.length; i += 5) {
    const batch = sources.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(auditSource));
    results.push(...batchResults);

    for (const r of batchResults) {
      const icon = r.status === 'PASS' ? 'OK' : r.status === 'WARN' ? '!!' : 'XX';
      const ppd = r.measuredPPD > 0 ? `${r.measuredPPD} ppd` : 'n/a';
      const lastPost = r.lastPostDate ? `last: ${r.lastPostDate}` : '';
      console.log(`  [${icon}] ${r.name.padEnd(40)} ${r.platform.padEnd(10)} ${ppd.padEnd(10)} ${lastPost.padEnd(16)} ${r.reason}`);
    }

    if (i + 5 < sources.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Summary
  const pass = results.filter(r => r.status === 'PASS');
  const warn = results.filter(r => r.status === 'WARN');
  const fail = results.filter(r => r.status === 'FAIL');

  console.log('\n' + '='.repeat(80));
  console.log(`\nAUDIT SUMMARY`);
  console.log(`   Total:  ${results.length}`);
  console.log(`   PASS:   ${pass.length}`);
  console.log(`   WARN:   ${warn.length}`);
  console.log(`   FAIL:   ${fail.length}`);

  if (fail.length > 0) {
    console.log(`\nFAILURES (consider removing from sources-clean.ts):`);
    for (const r of fail) {
      console.log(`   ${r.id} (${r.handle}) - ${r.reason}`);
    }
  }

  if (warn.length > 0) {
    console.log(`\nWARNINGS (monitor closely):`);
    for (const r of warn) {
      console.log(`   ${r.id} (${r.handle}) - ${r.reason}`);
    }
  }

  // PPD accuracy report
  const overclaimed = results.filter(r => r.ppdAccuracy.startsWith('OVER') || r.ppdAccuracy.startsWith('HIGH'));
  if (overclaimed.length > 0) {
    console.log(`\nPPD OVER-STORED (stored baseline too high):`);
    for (const r of overclaimed) {
      console.log(`   ${r.id}: ${r.ppdAccuracy}`);
    }
  }

  const underclaimed = results.filter(r => r.ppdAccuracy.startsWith('UNDER'));
  if (underclaimed.length > 0) {
    console.log(`\nPPD UNDER-STORED (stored baseline too low):`);
    for (const r of underclaimed) {
      console.log(`   ${r.id}: ${r.ppdAccuracy}`);
    }
  }

  console.log('');
}

main().catch(console.error);

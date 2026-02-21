/**
 * Source Audit Script
 * ===================
 * Checks all sources across all platforms for:
 * - Account exists / responds
 * - Last post date
 * - Post frequency
 * - Generates tier recommendations
 *
 * Usage: npx tsx --env-file=.env.local scripts/audit-sources.ts
 *        npx tsx --env-file=.env.local scripts/audit-sources.ts --platform bluesky
 *        npx tsx --env-file=.env.local scripts/audit-sources.ts --platform mastodon
 *        npx tsx --env-file=.env.local scripts/audit-sources.ts --platform telegram
 */

import { allTieredSources, TieredSource } from '../src/lib/sources-clean';

interface AuditResult {
  id: string;
  name: string;
  handle: string;
  platform: string;
  region: string;
  currentTier: string;

  // API results
  exists: boolean;
  error?: string;

  // Activity metrics
  lastPostDate?: Date;
  daysSinceLastPost?: number;
  postsInLast24h: number;
  postsInLast7d: number;
  postsInLast30d: number;

  // Recommendation
  recommendedTier: 'T1' | 'T2' | 'T3' | 'DELETE';
  reason: string;
}

// =============================================================================
// BLUESKY AUDIT
// =============================================================================

async function fetchBlueskyActivity(handle: string): Promise<{
  exists: boolean;
  error?: string;
  posts: { createdAt: Date }[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let cleanHandle = handle;
    const match = handle.match(/bsky\.app\/profile\/([^\/]+)/);
    if (match) cleanHandle = match[1];

    const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${cleanHandle}&limit=30`;
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        return { exists: false, error: 'Account not found', posts: [] };
      }
      if (response.status === 429) {
        return { exists: true, error: 'Rate limited', posts: [] };
      }
      return { exists: false, error: `API error ${response.status}`, posts: [] };
    }

    const data = await response.json();
    const feed = data.feed || [];
    const posts = feed.map((item: any) => ({
      createdAt: new Date(item.post?.record?.createdAt || item.post?.indexedAt || 0),
    }));

    return { exists: true, posts };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { exists: false, error: 'Timeout (10s)', posts: [] };
    return { exists: false, error: err.message, posts: [] };
  }
}

// =============================================================================
// MASTODON AUDIT
// =============================================================================

async function fetchMastodonActivity(source: TieredSource): Promise<{
  exists: boolean;
  error?: string;
  posts: { createdAt: Date }[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const handle = source.handle || '';
    // Parse handle format: @user@instance.social
    const mastoMatch = handle.match(/@?([^@]+)@(.+)/);
    if (!mastoMatch) return { exists: false, error: 'Invalid Mastodon handle format', posts: [] };

    const [, username, instance] = mastoMatch;

    // Look up account ID
    const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${username}`;
    const lookupResp = await fetch(lookupUrl, { signal: controller.signal });

    if (!lookupResp.ok) {
      clearTimeout(timeoutId);
      if (lookupResp.status === 404) return { exists: false, error: 'Account not found', posts: [] };
      return { exists: false, error: `Lookup error ${lookupResp.status}`, posts: [] };
    }

    const account = await lookupResp.json();

    // Fetch recent statuses
    const statusUrl = `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=40&exclude_replies=true&exclude_reblogs=true`;
    const statusResp = await fetch(statusUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!statusResp.ok) return { exists: true, error: `Status fetch error ${statusResp.status}`, posts: [] };

    const statuses = await statusResp.json();
    const posts = statuses.map((s: any) => ({ createdAt: new Date(s.created_at) }));

    return { exists: true, posts };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { exists: false, error: 'Timeout (10s)', posts: [] };
    return { exists: false, error: err.message, posts: [] };
  }
}

// =============================================================================
// TELEGRAM AUDIT
// =============================================================================

async function fetchTelegramActivity(source: TieredSource): Promise<{
  exists: boolean;
  error?: string;
  posts: { createdAt: Date }[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const handle = (source.handle || '').replace('@', '');
    const url = `https://t.me/s/${handle}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) return { exists: false, error: 'Channel not found', posts: [] };
      return { exists: false, error: `HTTP ${response.status}`, posts: [] };
    }

    const html = await response.text();

    // Check if it's a valid channel page
    if (html.includes('tgme_page_description') && !html.includes('tgme_widget_message')) {
      return { exists: true, posts: [] }; // Channel exists but no public messages
    }

    // Extract post dates from the HTML
    const dateMatches = html.matchAll(/datetime="([^"]+)"/g);
    const posts: { createdAt: Date }[] = [];
    for (const match of dateMatches) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) posts.push({ createdAt: date });
    }

    return { exists: true, posts };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { exists: false, error: 'Timeout (10s)', posts: [] };
    return { exists: false, error: err.message, posts: [] };
  }
}

// =============================================================================
// RSS AUDIT
// =============================================================================

async function fetchRssActivity(source: TieredSource): Promise<{
  exists: boolean;
  error?: string;
  posts: { createdAt: Date }[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { exists: false, error: `HTTP ${response.status}`, posts: [] };
    }

    const text = await response.text();

    // Quick date extraction from RSS/Atom
    const posts: { createdAt: Date }[] = [];
    const datePatterns = [
      /<pubDate>([^<]+)<\/pubDate>/g,
      /<published>([^<]+)<\/published>/g,
      /<updated>([^<]+)<\/updated>/g,
      /<dc:date>([^<]+)<\/dc:date>/g,
    ];

    for (const pattern of datePatterns) {
      for (const match of text.matchAll(pattern)) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) posts.push({ createdAt: date });
      }
    }

    return { exists: true, posts };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { exists: false, error: 'Timeout (10s)', posts: [] };
    return { exists: false, error: err.message, posts: [] };
  }
}

// =============================================================================
// SHARED LOGIC
// =============================================================================

function calculateTier(result: AuditResult): { tier: 'T1' | 'T2' | 'T3' | 'DELETE'; reason: string } {
  if (!result.exists) {
    return { tier: 'DELETE', reason: result.error || 'Account not found' };
  }

  if (!result.lastPostDate) {
    return { tier: 'DELETE', reason: 'No posts found' };
  }

  const days = result.daysSinceLastPost ?? 999;

  if (days > 90) return { tier: 'DELETE', reason: `Dormant ${days} days` };
  if (days > 30) return { tier: 'T3', reason: `Inactive ${days} days` };
  if (days > 7 || result.postsInLast7d < 3) return { tier: 'T2', reason: `Semi-active: ${result.postsInLast7d} posts/7d` };
  if (result.postsInLast7d >= 10 || result.postsInLast24h >= 2) {
    return { tier: 'T1', reason: `Active: ${result.postsInLast24h}/day, ${result.postsInLast7d}/week` };
  }

  return { tier: 'T2', reason: `Moderate: ${result.postsInLast7d} posts/7d` };
}

async function auditSource(source: TieredSource): Promise<AuditResult> {
  const handle = source.handle || source.feedUrl || source.id;

  let activity: { exists: boolean; error?: string; posts: { createdAt: Date }[] };

  switch (source.platform) {
    case 'bluesky':
      activity = await fetchBlueskyActivity(source.feedUrl || handle);
      break;
    case 'mastodon':
      activity = await fetchMastodonActivity(source);
      break;
    case 'telegram':
      activity = await fetchTelegramActivity(source);
      break;
    case 'rss':
    case 'reddit':
    case 'youtube':
      activity = await fetchRssActivity(source);
      break;
    default:
      activity = { exists: false, error: `Unsupported platform: ${source.platform}`, posts: [] };
  }

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const postsInLast24h = activity.posts.filter(p => p.createdAt.getTime() > oneDayAgo).length;
  const postsInLast7d = activity.posts.filter(p => p.createdAt.getTime() > sevenDaysAgo).length;
  const postsInLast30d = activity.posts.filter(p => p.createdAt.getTime() > thirtyDaysAgo).length;

  const lastPostDate = activity.posts.length > 0
    ? activity.posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
    : undefined;
  const daysSinceLastPost = lastPostDate
    ? Math.floor((now - lastPostDate.getTime()) / (24 * 60 * 60 * 1000))
    : undefined;

  const result: AuditResult = {
    id: source.id,
    name: source.name,
    handle,
    platform: source.platform,
    region: source.region,
    currentTier: source.fetchTier,
    exists: activity.exists,
    error: activity.error,
    lastPostDate,
    daysSinceLastPost,
    postsInLast24h,
    postsInLast7d,
    postsInLast30d,
    recommendedTier: 'T2',
    reason: '',
  };

  const { tier, reason } = calculateTier(result);
  result.recommendedTier = tier;
  result.reason = reason;

  return result;
}

async function main() {
  // Parse CLI args
  const platformFilter = process.argv.includes('--platform')
    ? process.argv[process.argv.indexOf('--platform') + 1]
    : null;

  let sources = allTieredSources;
  if (platformFilter) {
    sources = sources.filter(s => s.platform === platformFilter);
  }

  console.log(`\n  SOURCE AUDIT`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Sources to audit: ${sources.length}${platformFilter ? ` (${platformFilter} only)` : ' (all platforms)'}\n`);

  // Group by platform for display
  const byPlatform = new Map<string, TieredSource[]>();
  for (const s of sources) {
    const list = byPlatform.get(s.platform) || [];
    list.push(s);
    byPlatform.set(s.platform, list);
  }
  for (const [platform, list] of byPlatform) {
    console.log(`  ${platform}: ${list.length} sources`);
  }
  console.log('');

  const results: AuditResult[] = [];
  // Smaller batches + longer delays to avoid rate limits
  const batchSize = 5;
  const batchDelay = 1000;

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sources.length / batchSize);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}... `);

    const batchResults = await Promise.all(batch.map(auditSource));
    results.push(...batchResults);

    const ok = batchResults.filter(r => r.exists).length;
    const fail = batchResults.filter(r => !r.exists).length;
    const withPosts = batchResults.filter(r => r.postsInLast30d > 0).length;
    console.log(`${ok} ok, ${fail} failed, ${withPosts} with recent posts`);

    if (i + batchSize < sources.length) {
      await new Promise(r => setTimeout(r, batchDelay));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n  AUDIT SUMMARY\n`);

  const healthy = results.filter(r => r.exists);
  const broken = results.filter(r => !r.exists);
  const t1 = results.filter(r => r.recommendedTier === 'T1');
  const t2 = results.filter(r => r.recommendedTier === 'T2');
  const t3 = results.filter(r => r.recommendedTier === 'T3');
  const toDelete = results.filter(r => r.recommendedTier === 'DELETE');

  console.log(`  Healthy: ${healthy.length}/${results.length}`);
  console.log(`  T1 (very active):  ${t1.length}`);
  console.log(`  T2 (moderate):     ${t2.length}`);
  console.log(`  T3 (low activity): ${t3.length}`);
  console.log(`  DELETE (broken/dormant): ${toDelete.length}`);

  // Broken/deleted accounts
  if (toDelete.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`\n  RECOMMENDED FOR REMOVAL (${toDelete.length})\n`);

    for (const r of toDelete) {
      console.log(`  ${r.platform.padEnd(10)} ${r.name.padEnd(30)} ${r.reason}`);
    }
  }

  // T3 (inactive but may return)
  if (t3.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`\n  LOW ACTIVITY - WATCH LIST (${t3.length})\n`);

    for (const r of t3) {
      console.log(`  ${r.platform.padEnd(10)} ${r.name.padEnd(30)} Last post: ${r.daysSinceLastPost}d ago`);
    }
  }

  // Platform breakdown
  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n  BY PLATFORM\n`);
  for (const [platform, list] of byPlatform) {
    const platformResults = results.filter(r => r.platform === platform);
    const ok = platformResults.filter(r => r.exists).length;
    const del = platformResults.filter(r => r.recommendedTier === 'DELETE').length;
    console.log(`  ${platform.padEnd(10)} ${ok}/${platformResults.length} healthy, ${del} to remove`);
  }

  // Save results
  const fs = await import('fs');
  const outputPath = '/tmp/source-audit-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n  Full results: ${outputPath}`);
}

main().catch(console.error);

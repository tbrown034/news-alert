/**
 * VALIDATE MASTER ACCOUNTS
 * ========================
 * Tests candidate accounts from MASTER_ACCOUNTS.json against live APIs.
 * Checks: profile exists, is active, measures posts/day, last post date.
 *
 * Usage:
 *   npx tsx scripts/validate-master-accounts.ts                          # All platforms
 *   npx tsx scripts/validate-master-accounts.ts --platform bluesky       # One platform
 *   npx tsx scripts/validate-master-accounts.ts --platform telegram
 *   npx tsx scripts/validate-master-accounts.ts --platform mastodon
 *   npx tsx scripts/validate-master-accounts.ts --skip-existing          # Skip accounts already in sources-clean.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const MASTER_PATH = process.argv.find(a => a.startsWith('--file='))?.split('=')[1]
  || path.resolve(process.env.HOME || '/Users/trevorbrown', 'Downloads/MASTER_ACCOUNTS.json');

const platformFilter = process.argv.find(a => a.startsWith('--platform='))?.split('=')[1]
  || (process.argv.includes('--platform') ? process.argv[process.argv.indexOf('--platform') + 1] : null);

const skipExisting = process.argv.includes('--skip-existing');

interface MasterAccount {
  platform: string;
  handle: string;
  display_name: string;
  category: string;
  region_focus: string;
  language: string;
  description: string;
  followers: string;
  bias_indicator: string;
  verification_status: string;
  source_file: string;
}

interface ValidationResult {
  handle: string;
  displayName: string;
  platform: string;
  category: string;
  regionFocus: string;
  // Validation results
  exists: boolean;
  error?: string;
  // Activity metrics
  recentPostCount: number;
  daysSpan: number;
  postsPerDay: number;
  lastPostDate: string | null;
  lastPostDaysAgo: number | null;
  // Profile info (where available)
  followerCount?: number;
  statusCount?: number;
}

// =============================================================================
// LOAD & FILTER
// =============================================================================

function loadMasterAccounts(): MasterAccount[] {
  const raw = fs.readFileSync(MASTER_PATH, 'utf-8');
  const accounts: MasterAccount[] = JSON.parse(raw);
  return accounts.filter(a => {
    if (a.handle === '--' || !a.handle || a.handle.includes('(unconfirmed)') || a.handle.includes('(Not confirmed)')) return false;
    if (platformFilter && a.platform !== platformFilter) return false;
    return true;
  });
}

function loadExistingHandles(): Set<string> {
  const sourcesPath = path.resolve(__dirname, '../src/lib/sources-clean.ts');
  const content = fs.readFileSync(sourcesPath, 'utf-8');
  const handles = new Set<string>();

  // Extract handle values from sources-clean.ts
  const handleMatches = content.matchAll(/handle:\s*'([^']+)'/g);
  for (const match of handleMatches) {
    handles.add(match[1].toLowerCase().replace(/^@/, ''));
  }
  return handles;
}

// De-duplicate by handle (master JSON has duplicates)
function deduplicateAccounts(accounts: MasterAccount[]): MasterAccount[] {
  const seen = new Set<string>();
  return accounts.filter(a => {
    const key = `${a.platform}:${a.handle.toLowerCase().replace(/^@/, '')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// =============================================================================
// BLUESKY VALIDATION
// =============================================================================

async function validateBluesky(account: MasterAccount): Promise<ValidationResult> {
  const handle = account.handle.replace(/^@/, '');
  const result: ValidationResult = {
    handle: account.handle,
    displayName: account.display_name,
    platform: 'bluesky',
    category: account.category,
    regionFocus: account.region_focus,
    exists: false,
    recentPostCount: 0,
    daysSpan: 0,
    postsPerDay: 0,
    lastPostDate: null,
    lastPostDaysAgo: null,
  };

  try {
    // Get recent posts (limit=30 for a quick check)
    const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=30`;
    const res = await fetch(url);

    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }

    const data = await res.json();
    const posts = data.feed || [];
    result.exists = true;

    if (posts.length === 0) {
      result.error = 'No posts found';
      return result;
    }

    // Calculate activity from the returned posts
    const now = new Date();
    const dates: Date[] = [];
    for (const entry of posts) {
      const d = new Date(entry.post?.record?.createdAt || entry.post?.indexedAt);
      if (!isNaN(d.getTime())) dates.push(d);
    }

    if (dates.length > 0) {
      result.recentPostCount = dates.length;
      result.lastPostDate = dates[0].toISOString().split('T')[0];
      result.lastPostDaysAgo = Math.round((now.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));

      const oldest = dates[dates.length - 1];
      const spanMs = now.getTime() - oldest.getTime();
      result.daysSpan = Math.round(Math.max(1, spanMs / (1000 * 60 * 60 * 24)) * 10) / 10;
      result.postsPerDay = Math.round((dates.length / result.daysSpan) * 10) / 10;
    }
  } catch (err: any) {
    result.error = err.message;
  }

  return result;
}

// =============================================================================
// TELEGRAM VALIDATION
// =============================================================================

async function validateTelegram(account: MasterAccount): Promise<ValidationResult> {
  const handle = account.handle.replace(/^@/, '');
  const result: ValidationResult = {
    handle: account.handle,
    displayName: account.display_name,
    platform: 'telegram',
    category: account.category,
    regionFocus: account.region_focus,
    exists: false,
    recentPostCount: 0,
    daysSpan: 0,
    postsPerDay: 0,
    lastPostDate: null,
    lastPostDaysAgo: null,
  };

  try {
    const url = `https://t.me/s/${handle}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }

    const html = await res.text();

    // Check if channel exists (look for error indicators)
    if (html.includes('tgme_page_icon') && html.includes('not found')) {
      result.error = 'Channel not found';
      return result;
    }

    // Check for preview disabled
    if (html.includes('tgme_page_description') && !html.includes('tgme_widget_message_wrap')) {
      // Channel exists but preview may be disabled
      const hasTitle = html.match(/<div class="tgme_page_title"><span[^>]*>([^<]+)<\/span>/);
      if (hasTitle) {
        result.exists = true;
        result.error = 'Preview disabled (channel exists but no public messages)';
        return result;
      }
    }

    const messageCount = (html.match(/tgme_widget_message_wrap/g) || []).length;
    if (messageCount === 0) {
      result.error = 'No messages found (may not exist or preview disabled)';
      return result;
    }

    result.exists = true;
    result.recentPostCount = messageCount;

    // Extract dates from messages
    const dateMatches = [...html.matchAll(/datetime="([^"]+)"/g)];
    const now = new Date();

    if (dateMatches.length > 0) {
      const dates = dateMatches.map(m => new Date(m[1])).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        result.lastPostDate = dates[0].toISOString().split('T')[0];
        result.lastPostDaysAgo = Math.round((now.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));

        const oldest = dates[dates.length - 1];
        const spanMs = now.getTime() - oldest.getTime();
        result.daysSpan = Math.round(Math.max(1, spanMs / (1000 * 60 * 60 * 24)) * 10) / 10;
        result.postsPerDay = Math.round((dates.length / result.daysSpan) * 10) / 10;
      }
    }
  } catch (err: any) {
    result.error = err.message;
  }

  return result;
}

// =============================================================================
// MASTODON VALIDATION
// =============================================================================

async function validateMastodon(account: MasterAccount): Promise<ValidationResult> {
  // Parse handle: @username@instance.tld or username@instance.tld
  const handleClean = account.handle.replace(/^@/, '');
  const parts = handleClean.split('@');
  const username = parts[0];
  const instance = parts[1];

  const result: ValidationResult = {
    handle: account.handle,
    displayName: account.display_name,
    platform: 'mastodon',
    category: account.category,
    regionFocus: account.region_focus,
    exists: false,
    recentPostCount: 0,
    daysSpan: 0,
    postsPerDay: 0,
    lastPostDate: null,
    lastPostDaysAgo: null,
  };

  if (!username || !instance) {
    result.error = `Invalid handle format: ${account.handle}`;
    return result;
  }

  try {
    // Look up account
    const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${username}`;
    const lookupRes = await fetch(lookupUrl, { signal: AbortSignal.timeout(8000) });

    if (!lookupRes.ok) {
      result.error = `Account lookup failed: HTTP ${lookupRes.status}`;
      return result;
    }

    const accountData = await lookupRes.json();
    result.exists = true;
    result.followerCount = accountData.followers_count;
    result.statusCount = accountData.statuses_count;

    // Get recent statuses
    const statusesUrl = `https://${instance}/api/v1/accounts/${accountData.id}/statuses?limit=30&exclude_replies=true`;
    const statusesRes = await fetch(statusesUrl, { signal: AbortSignal.timeout(8000) });

    if (!statusesRes.ok) {
      result.error = `Could not fetch statuses: HTTP ${statusesRes.status}`;
      return result;
    }

    const statuses = await statusesRes.json();
    if (!Array.isArray(statuses) || statuses.length === 0) {
      result.error = 'No statuses returned';
      return result;
    }

    const now = new Date();
    const dates = statuses.map((s: any) => new Date(s.created_at)).filter((d: Date) => !isNaN(d.getTime()));

    if (dates.length > 0) {
      result.recentPostCount = dates.length;
      result.lastPostDate = dates[0].toISOString().split('T')[0];
      result.lastPostDaysAgo = Math.round((now.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));

      const oldest = dates[dates.length - 1];
      const spanMs = now.getTime() - oldest.getTime();
      result.daysSpan = Math.round(Math.max(1, spanMs / (1000 * 60 * 60 * 24)) * 10) / 10;
      result.postsPerDay = Math.round((dates.length / result.daysSpan) * 10) / 10;
    }
  } catch (err: any) {
    result.error = err.message?.includes('AbortError') ? 'Timeout' : err.message;
  }

  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('MASTER ACCOUNTS VALIDATION');
  console.log('='.repeat(70));
  console.log(`Source: ${MASTER_PATH}`);
  if (platformFilter) console.log(`Platform: ${platformFilter}`);
  if (skipExisting) console.log('Skipping accounts already in sources-clean.ts');
  console.log('');

  let accounts = loadMasterAccounts();
  accounts = deduplicateAccounts(accounts);

  const existingHandles = skipExisting ? loadExistingHandles() : new Set<string>();
  if (skipExisting) {
    const before = accounts.length;
    accounts = accounts.filter(a => {
      const normalized = a.handle.toLowerCase().replace(/^@/, '');
      return !existingHandles.has(normalized);
    });
    console.log(`Filtered: ${before} → ${accounts.length} (${before - accounts.length} already in sources-clean.ts)\n`);
  }

  console.log(`Validating ${accounts.length} accounts...\n`);

  const bluesky = accounts.filter(a => a.platform === 'bluesky');
  const telegram = accounts.filter(a => a.platform === 'telegram');
  const mastodon = accounts.filter(a => a.platform === 'mastodon');

  const results: ValidationResult[] = [];

  // Bluesky
  if (bluesky.length > 0) {
    console.log(`\n--- BLUESKY (${bluesky.length}) ---\n`);
    for (let i = 0; i < bluesky.length; i++) {
      const a = bluesky[i];
      process.stdout.write(`  [${i + 1}/${bluesky.length}] ${a.display_name}...`);
      const r = await validateBluesky(a);
      results.push(r);

      if (r.exists) {
        console.log(` OK  ${r.postsPerDay}/day  last: ${r.lastPostDaysAgo}d ago  (${r.recentPostCount} posts over ${r.daysSpan}d)`);
      } else {
        console.log(` FAIL  ${r.error}`);
      }

      // Rate limit: 100ms between Bluesky requests
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Telegram
  if (telegram.length > 0) {
    console.log(`\n--- TELEGRAM (${telegram.length}) ---\n`);
    for (let i = 0; i < telegram.length; i++) {
      const a = telegram[i];
      process.stdout.write(`  [${i + 1}/${telegram.length}] ${a.display_name}...`);
      const r = await validateTelegram(a);
      results.push(r);

      if (r.exists) {
        console.log(` OK  ${r.postsPerDay}/day  last: ${r.lastPostDaysAgo}d ago  (${r.recentPostCount} msgs over ${r.daysSpan}d)`);
      } else {
        console.log(` FAIL  ${r.error}`);
      }

      // Rate limit: 200ms between Telegram requests
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Mastodon
  if (mastodon.length > 0) {
    console.log(`\n--- MASTODON (${mastodon.length}) ---\n`);
    for (let i = 0; i < mastodon.length; i++) {
      const a = mastodon[i];
      process.stdout.write(`  [${i + 1}/${mastodon.length}] ${a.display_name}...`);
      const r = await validateMastodon(a);
      results.push(r);

      if (r.exists) {
        const followers = r.followerCount ? ` ${r.followerCount} followers` : '';
        console.log(` OK  ${r.postsPerDay}/day  last: ${r.lastPostDaysAgo}d ago${followers}`);
      } else {
        console.log(` FAIL  ${r.error}`);
      }

      // Rate limit: 150ms between Mastodon requests
      await new Promise(r => setTimeout(r, 150));
    }
  }

  // ==========================================================================
  // REPORT
  // ==========================================================================

  const valid = results.filter(r => r.exists);
  const failed = results.filter(r => !r.exists);
  const active = valid.filter(r => r.lastPostDaysAgo !== null && r.lastPostDaysAgo <= 7);
  const stale = valid.filter(r => r.lastPostDaysAgo !== null && r.lastPostDaysAgo > 30);
  const inactive = valid.filter(r => r.lastPostDaysAgo !== null && r.lastPostDaysAgo > 90);

  console.log('\n' + '='.repeat(70));
  console.log('VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total tested:   ${results.length}`);
  console.log(`  Exists:       ${valid.length}`);
  console.log(`  Failed:       ${failed.length}`);
  console.log(`  Active (<7d): ${active.length}`);
  console.log(`  Stale (>30d): ${stale.length}`);
  console.log(`  Inactive (>90d): ${inactive.length}`);

  // Top by posts/day
  const topActive = [...valid].sort((a, b) => b.postsPerDay - a.postsPerDay).slice(0, 20);
  console.log('\nTop 20 by posts/day:');
  for (const r of topActive) {
    console.log(`  ${r.postsPerDay.toString().padStart(6)}/day  ${r.displayName.padEnd(35)}  ${r.platform.padEnd(10)}  last: ${r.lastPostDaysAgo}d ago`);
  }

  // Failed accounts
  if (failed.length > 0) {
    console.log(`\nFailed accounts (${failed.length}):`);
    for (const r of failed) {
      console.log(`  ${r.platform.padEnd(10)} ${r.handle.padEnd(40)} ${r.error}`);
    }
  }

  // Inactive/stale
  if (stale.length > 0) {
    console.log(`\nStale accounts (>30 days since last post):`);
    for (const r of stale) {
      console.log(`  ${r.platform.padEnd(10)} ${r.displayName.padEnd(35)} last post: ${r.lastPostDaysAgo}d ago`);
    }
  }

  // Write full results to JSON for further processing
  const outputPath = path.resolve(__dirname, '../scripts/validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results written to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

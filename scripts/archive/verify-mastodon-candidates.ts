/**
 * Verify Mastodon candidate accounts:
 * 1. Check if they've posted at least 2 times in the past week
 * 2. Check if they have a Bluesky account (skip if so)
 * 3. Output verified candidates ready to add
 */

interface Candidate {
  name: string;
  handle: string;      // e.g., "ProPublica"
  instance: string;    // e.g., "newsie.social"
  category: string;    // e.g., "news-org", "journalist", "osint"
  followers?: number;
}

// ADD CANDIDATES HERE after scanning
const CANDIDATES: Candidate[] = [
  // Will be populated after agent scanning completes
];

async function checkMastodonActivity(handle: string, instance: string): Promise<{
  active: boolean;
  recentPosts: number;
  lastPostDate: string | null;
  error?: string;
}> {
  try {
    // Lookup account ID
    const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${handle}`;
    const lookupRes = await fetch(lookupUrl, { signal: AbortSignal.timeout(8000) });
    if (!lookupRes.ok) {
      return { active: false, recentPosts: 0, lastPostDate: null, error: `Lookup failed: ${lookupRes.status}` };
    }
    const account = await lookupRes.json();

    // Get recent statuses
    const statusesUrl = `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=10&exclude_replies=true&exclude_reblogs=true`;
    const statusesRes = await fetch(statusesUrl, { signal: AbortSignal.timeout(8000) });
    if (!statusesRes.ok) {
      return { active: false, recentPosts: 0, lastPostDate: null, error: `Statuses failed: ${statusesRes.status}` };
    }
    const statuses = await statusesRes.json();

    if (!statuses.length) {
      return { active: false, recentPosts: 0, lastPostDate: null };
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentPosts = statuses.filter((s: any) => new Date(s.created_at).getTime() > oneWeekAgo).length;
    const lastPostDate = statuses[0]?.created_at || null;

    return {
      active: recentPosts >= 2,
      recentPosts,
      lastPostDate,
    };
  } catch (e: any) {
    return { active: false, recentPosts: 0, lastPostDate: null, error: e.message };
  }
}

async function checkBlueskyExists(name: string): Promise<{
  exists: boolean;
  handle?: string;
}> {
  try {
    // Search Bluesky for the account name
    const searchUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors?q=${encodeURIComponent(name)}&limit=5`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { exists: false };

    const data = await res.json();
    const actors = data.actors || [];

    // Check if any result closely matches the name
    const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const actor of actors) {
      const displayLower = (actor.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const handleLower = (actor.handle || '').toLowerCase().replace(/[^a-z0-9.]/g, '');

      if (displayLower === nameLower || handleLower.startsWith(nameLower)) {
        // Verify they're actually active on Bluesky (have posts)
        const feedUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${actor.handle}&limit=1`;
        const feedRes = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) });
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          if (feedData.feed?.length > 0) {
            return { exists: true, handle: actor.handle };
          }
        }
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function main() {
  if (CANDIDATES.length === 0) {
    console.log('No candidates to verify. Add candidates to the CANDIDATES array first.');
    return;
  }

  console.log(`\n🐘 Verifying ${CANDIDATES.length} Mastodon candidates\n`);
  console.log('='.repeat(70));

  const verified: Candidate[] = [];
  const skippedBluesky: { candidate: Candidate; bskyHandle: string }[] = [];
  const skippedInactive: Candidate[] = [];
  const errors: { candidate: Candidate; error: string }[] = [];

  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    const progress = `[${i + 1}/${CANDIDATES.length}]`;

    // Check Mastodon activity
    const activity = await checkMastodonActivity(c.handle, c.instance);
    if (activity.error) {
      console.log(`  ${progress} ❌ ${c.name}: ${activity.error}`);
      errors.push({ candidate: c, error: activity.error });
      continue;
    }
    if (!activity.active) {
      const daysAgo = activity.lastPostDate
        ? Math.round((Date.now() - new Date(activity.lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
        : '?';
      console.log(`  ${progress} ⏸️  ${c.name}: ${activity.recentPosts} posts this week (last post: ${daysAgo} days ago)`);
      skippedInactive.push(c);
      continue;
    }

    // Check Bluesky presence
    const bsky = await checkBlueskyExists(c.name);
    if (bsky.exists) {
      console.log(`  ${progress} 🔵 ${c.name}: Also on Bluesky as ${bsky.handle} — skipping`);
      skippedBluesky.push({ candidate: c, bskyHandle: bsky.handle! });
      continue;
    }

    console.log(`  ${progress} ✅ ${c.name}: ${activity.recentPosts} posts this week, Mastodon-only`);
    verified.push(c);

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Results Summary\n');
  console.log(`  ✅ Verified (active, Mastodon-only): ${verified.length}`);
  console.log(`  🔵 Skipped (also on Bluesky): ${skippedBluesky.length}`);
  console.log(`  ⏸️  Skipped (inactive): ${skippedInactive.length}`);
  console.log(`  ❌ Errors: ${errors.length}`);

  if (verified.length > 0) {
    console.log('\n\n✅ VERIFIED CANDIDATES — Ready to add to sources-clean.ts:\n');
    for (const c of verified) {
      console.log(`  ${c.name}`);
      console.log(`    Handle: @${c.handle}@${c.instance}`);
      console.log(`    Category: ${c.category}`);
      console.log(`    Followers: ${c.followers || 'unknown'}`);
      console.log('');
    }

    console.log('\n📝 Source entries to add:\n');
    for (const c of verified) {
      const id = `mastodon-${c.handle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const sourceType = c.category === 'news-org' ? 'news-org'
        : c.category === 'journalist' ? 'reporter'
        : c.category === 'government' ? 'official'
        : c.category === 'think-tank' ? 'analyst'
        : c.category === 'human-rights' ? 'osint'
        : c.category;

      console.log(`  {`);
      console.log(`    id: '${id}',`);
      console.log(`    name: '${c.name}',`);
      console.log(`    handle: '${c.handle}@${c.instance}',`);
      console.log(`    platform: 'mastodon',`);
      console.log(`    sourceType: '${sourceType}',`);
      console.log(`    confidence: 80,`);
      console.log(`    region: 'all',`);
      console.log(`    fetchTier: 'T2',`);
      console.log(`    postsPerDay: 3,`);
      console.log(`    feedUrl: 'https://${c.instance}/@${c.handle}',`);
      console.log(`  },`);
    }
  }

  if (skippedBluesky.length > 0) {
    console.log('\n\n🔵 SKIPPED (already on Bluesky):\n');
    for (const { candidate, bskyHandle } of skippedBluesky) {
      console.log(`  ${candidate.name} → ${bskyHandle}`);
    }
  }
}

main().catch(console.error);

/**
 * Shared source stats measurement functions.
 * Used by both scripts/source-stats.ts (CLI) and /api/admin/source-stats (API).
 */

const BLUESKY_API = 'https://public.api.bsky.app/xrpc';

export interface PostTimestamp {
  timestamp: Date;
  text?: string;
}

export interface SourceStats {
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
  postsLast7d: number;
  gapHoursAvg: number;
  gapHoursMax: number;
  error?: string;
}

// ── Bluesky ──────────────────────────────────────────────────────────────────

export async function fetchBlueskyPosts(handle: string, limit = 100): Promise<PostTimestamp[]> {
  const cleanHandle = handle.replace(/^@/, '');
  const url = `${BLUESKY_API}/app.bsky.feed.getAuthorFeed?actor=${cleanHandle}&limit=${limit}&filter=posts_no_replies`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Bluesky ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.feed || [])
    .filter((item: any) => !item.reason)
    .map((item: any) => ({
      timestamp: new Date(item.post.record.createdAt),
      text: item.post.record.text?.slice(0, 120),
    }));
}

// ── Mastodon ─────────────────────────────────────────────────────────────────

export async function fetchMastodonPosts(handle: string, limit = 100): Promise<PostTimestamp[]> {
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

export async function fetchTelegramPosts(channel: string, limit = 40): Promise<PostTimestamp[]> {
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

export function calculateStats(handle: string, platform: string, posts: PostTimestamp[]): SourceStats {
  const now = new Date();

  if (posts.length === 0) {
    return {
      handle, platform, totalPosts: 0,
      lastPosted: 'never', lastPostedAgo: 'n/a', spanDays: 0,
      postsPerDay: 0, postsLast6h: 0, postsLast12h: 0,
      postsLast24h: 0, postsLast48h: 0, postsLast7d: 0, gapHoursAvg: 0, gapHoursMax: 0,
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
  const postsLast7d = posts.filter(p => p.timestamp >= cutoff(7 * 24)).length;

  // Fixed 7-day window when we have enough data, otherwise use actual span
  const WINDOW_DAYS = 7;
  let postsPerDay: number;
  if (spanDays >= WINDOW_DAYS) {
    postsPerDay = postsLast7d / WINDOW_DAYS;
  } else if (spanDays > 0) {
    postsPerDay = posts.length / spanDays;
  } else {
    postsPerDay = posts.length;
  }

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
    postsLast6h, postsLast12h, postsLast24h, postsLast48h, postsLast7d,
    gapHoursAvg: Math.round(gapHoursAvg * 10) / 10,
    gapHoursMax: Math.round(gapHoursMax * 10) / 10,
  };
}

// ── Fetch dispatcher ─────────────────────────────────────────────────────────

export async function getStats(handle: string, platform: string): Promise<SourceStats> {
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
      postsLast24h: 0, postsLast48h: 0, postsLast7d: 0, gapHoursAvg: 0, gapHoursMax: 0,
      error: err.message?.slice(0, 200),
    };
  }
}

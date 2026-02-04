import { NextResponse } from 'next/server';
import { fetchRssFeed } from '@/lib/rss';
import {
  allTieredSources,
  getSourcesByRegion,
  TieredSource,
} from '@/lib/sources-clean';
import { processAlertStatuses, sortByCascadePriority } from '@/lib/alertStatus';
import { calculateRegionActivity } from '@/lib/activityDetection';
import {
  getCachedNews,
  setCachedNews,
  isCacheFresh,
} from '@/lib/newsCache';
import { WatchpointId, NewsItem, Source } from '@/types';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rateLimit';
import { getActiveEditorialPosts } from '@/lib/editorial';
import { EditorialPost } from '@/types/editorial';
import { shouldFilterPost } from '@/lib/blocklist';
import { logActivitySnapshot } from '@/lib/activityLogging';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

// Valid regions
const VALID_REGIONS: WatchpointId[] = ['all', 'us', 'latam', 'middle-east', 'europe-russia', 'asia', 'seismic'];

// =============================================================================
// MVP PLATFORM FILTER
// Toggle platforms on/off here. Set to false to disable fetching.
// Source definitions are preserved - just not fetched until re-enabled.
// =============================================================================
const ENABLED_PLATFORMS = {
  bluesky: true,    // 229 sources - API-based, fast
  telegram: true,   // 11 sources - web scraping
  mastodon: true,   // 6 sources - API-based
  rss: false,       // 214 sources - TODO: re-enable after MVP
  reddit: false,    // 8 sources - TODO: re-enable after MVP
  youtube: false,   // 7 sources - TODO: re-enable after MVP
};
// =============================================================================

// Time window defaults (in hours)
const DEFAULT_TIME_WINDOW = 6; // 6 hours - optimized for "what's happening NOW"
const MAX_TIME_WINDOW = 72; // Max 3 days

// Limits (for safety)
const MAX_LIMIT = 5000;
const DEFAULT_LIMIT = 2000;

// Track in-flight fetches to prevent duplicate requests
const inFlightFetches = new Map<string, Promise<NewsItem[]>>();


// Check if source is Bluesky
function isBlueskySource(source: TieredSource): boolean {
  return source.platform === 'bluesky' || source.feedUrl.includes('bsky.app');
}

// Check if source is Telegram
function isTelegramSource(source: TieredSource): boolean {
  return source.platform === 'telegram' || source.feedUrl.includes('t.me/');
}

// Check if source is Mastodon
function isMastodonSource(source: TieredSource): boolean {
  return source.platform === 'mastodon';
}

// Check if source is Reddit
function isRedditSource(source: TieredSource): boolean {
  return source.platform === 'reddit' || source.feedUrl.includes('reddit.com/r/');
}

// Check if source is YouTube
function isYouTubeSource(source: TieredSource): boolean {
  return source.platform === 'youtube' || source.feedUrl.includes('youtube.com/feeds/');
}

// Check if source platform is enabled
function isPlatformEnabled(source: TieredSource): boolean {
  if (isBlueskySource(source)) return ENABLED_PLATFORMS.bluesky;
  if (isTelegramSource(source)) return ENABLED_PLATFORMS.telegram;
  if (isMastodonSource(source)) return ENABLED_PLATFORMS.mastodon;
  if (isRedditSource(source)) return ENABLED_PLATFORMS.reddit;
  if (isYouTubeSource(source)) return ENABLED_PLATFORMS.youtube;
  // Default to RSS for anything else
  return ENABLED_PLATFORMS.rss;
}

// Get sources filtered by region AND enabled platforms
function getSourcesForRegion(region: WatchpointId): TieredSource[] {
  const regionSources = getSourcesByRegion(region);
  return regionSources.filter(isPlatformEnabled);
}

// Filter items by time window
function filterByTimeWindow(items: NewsItem[], hours: number): NewsItem[] {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return items.filter(item => item.timestamp.getTime() > cutoff);
}

// Convert editorial post to NewsItem format for rendering
function editorialToNewsItem(post: EditorialPost): NewsItem & { isEditorial: true; editorialType: string } {
  const editorSource: Source = {
    id: 'editorial',
    name: 'Editor',
    platform: 'rss', // Use RSS as base platform for editorial
    sourceType: 'official',
    confidence: 100,
    region: post.region || 'all',
  };

  return {
    id: `editorial-${post.id}`,
    title: post.title,
    content: post.content || post.title,
    source: editorSource,
    timestamp: post.createdAt,
    region: post.region || 'all',
    verificationStatus: 'confirmed',
    url: post.url,
    media: post.mediaUrl ? [{ type: 'image', url: post.mediaUrl }] : undefined,
    // Custom fields for editorial posts
    isEditorial: true as const,
    editorialType: post.postType,
  };
}

/**
 * Fetch sources in batches for a single platform
 */
async function fetchPlatformSources(
  sources: TieredSource[],
  batchSize: number,
  batchDelay: number
): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);

    const batchPromises = batch.map(async (source) => {
      try {
        return await fetchRssFeed(source);
      } catch {
        return [];
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    }

    if (i + batchSize < sources.length) {
      await new Promise(r => setTimeout(r, batchDelay));
    }
  }

  return items;
}

/**
 * Fetch sources - grouped by platform with appropriate batching
 * Platforms are fetched IN PARALLEL for speed
 */
async function fetchAllSources(
  sources: TieredSource[]
): Promise<NewsItem[]> {
  // Separate sources by platform
  const blueskySources = sources.filter(isBlueskySource);
  const telegramSources = sources.filter(isTelegramSource);
  const mastodonSources = sources.filter(isMastodonSource);
  const redditSources = sources.filter(isRedditSource);
  const youtubeSources = sources.filter(isYouTubeSource);

  // RSS = everything else
  const rssSources = sources.filter(s =>
    !isBlueskySource(s) &&
    !isTelegramSource(s) &&
    !isMastodonSource(s) &&
    !isRedditSource(s) &&
    !isYouTubeSource(s)
  );

  // Fetch ALL platforms in parallel (each platform still batches internally)
  const [rssItems, bskyItems, tgItems, mastoItems, redditItems, ytItems] = await Promise.all([
    fetchPlatformSources(rssSources, 30, 100),      // RSS: 30 at a time
    fetchPlatformSources(blueskySources, 30, 100),  // Bluesky: 30 at a time
    fetchPlatformSources(telegramSources, 10, 200), // Telegram: 10 at a time (slow scraping)
    fetchPlatformSources(mastodonSources, 20, 100), // Mastodon: 20 at a time
    fetchPlatformSources(redditSources, 5, 500),    // Reddit: 5 at a time (tight rate limit)
    fetchPlatformSources(youtubeSources, 10, 100),  // YouTube: 10 at a time
  ]);

  return [...rssItems, ...bskyItems, ...tgItems, ...mastoItems, ...redditItems, ...ytItems];
}

/**
 * Fetch news with caching
 * Simplified: fetches all sources (no tier separation)
 */
async function fetchNewsWithCache(region: WatchpointId): Promise<NewsItem[]> {
  const cacheKey = region;

  // For specific regions, try to use "all" cache first
  if (region !== 'all') {
    const allCached = getCachedNews('all');
    if (allCached && isCacheFresh('all')) {
      const filtered = allCached.items.filter(
        item => item.region === region
      );
      setCachedNews(cacheKey, filtered, true);
      return filtered;
    }
  }

  // Check for in-flight fetch
  const inFlight = inFlightFetches.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const sources = getSourcesForRegion(region);

  const fetchPromise = (async () => {
    const fetchStart = Date.now();
    try {
      console.log(`[News API] Fetching ${region} (${sources.length} sources)`);
      const items = await fetchAllSources(sources);

      // Deduplicate by ID only (exact same post appearing twice)
      const seenIds = new Set<string>();
      const dedupedById = items.filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });

      // Sort by timestamp (newest first) — no content dedup, no per-source limits
      // We want to see EVERYTHING in chronological order
      dedupedById.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Log activity for rolling averages (await to ensure it completes on Vercel)
      const fetchEnd = Date.now();
      await logActivitySnapshot(region, dedupedById, sources.length, fetchEnd - fetchStart);

      // Update cache
      setCachedNews(cacheKey, dedupedById, true);

      return dedupedById;
    } finally {
      inFlightFetches.delete(cacheKey);
    }
  })();

  inFlightFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export async function GET(request: Request) {
  // Rate limiting: 120 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(`news:${clientIp}`, {
    windowMs: 60000,
    maxRequests: 120,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const regionParam = searchParams.get('region') || 'all';
  const hoursParam = parseInt(searchParams.get('hours') || String(DEFAULT_TIME_WINDOW), 10);
  const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const sinceParam = searchParams.get('since'); // ISO timestamp for incremental updates

  // Validate region
  if (!VALID_REGIONS.includes(regionParam as WatchpointId)) {
    return NextResponse.json(
      { error: 'Invalid region parameter', validRegions: VALID_REGIONS },
      { status: 400 }
    );
  }

  const region = regionParam as WatchpointId;
  const hours = Math.min(Math.max(1, isNaN(hoursParam) ? DEFAULT_TIME_WINDOW : hoursParam), MAX_TIME_WINDOW);
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? DEFAULT_LIMIT : limitParam), MAX_LIMIT);

  // Cache key is just the region (no more tier separation)
  const cacheKey = region;

  try {
    let newsItems: NewsItem[];
    let fromCache = false;

    const cached = getCachedNews(cacheKey);

    if (!forceRefresh && cached && isCacheFresh(cacheKey)) {
      newsItems = cached.items;
      fromCache = true;
    } else if (!forceRefresh && cached) {
      // Stale cache - return immediately, refresh in background
      newsItems = cached.items;
      fromCache = true;
      console.log(`[News API] Stale cache for ${cacheKey}, refreshing in background`);
      fetchNewsWithCache(region).catch(err => {
        console.error('[News API] Background refresh error:', err);
      });
    } else {
      console.log(`[News API] Fetching fresh data for ${cacheKey}...`);
      newsItems = await fetchNewsWithCache(region);
    }

    // Filter by region if needed
    let filtered = region === 'all'
      ? newsItems
      : newsItems.filter((item) => item.region === region);

    // Apply time window filter
    filtered = filterByTimeWindow(filtered, hours);

    // Filter out posts with blocked keywords (sports, entertainment, etc.)
    filtered = filtered.filter(item => !shouldFilterPost(`${item.title} ${item.content || ''}`));

    // If 'since' param provided, only return items newer than that timestamp
    // This enables incremental updates - client fetches only new items
    let sinceCutoff: Date | null = null;
    if (sinceParam) {
      sinceCutoff = new Date(sinceParam);
      if (!isNaN(sinceCutoff.getTime())) {
        filtered = filtered.filter(item => item.timestamp.getTime() > sinceCutoff!.getTime());
      }
    }

    // Fetch editorial posts and merge with feed
    let editorialPosts: EditorialPost[] = [];
    let editorialCount = 0;
    try {
      editorialPosts = await getActiveEditorialPosts(region);
      editorialCount = editorialPosts.length;
    } catch (err) {
      console.error('[News API] Failed to fetch editorial posts:', err);
      // Continue without editorial posts
    }

    // Convert editorial posts to NewsItem format
    const editorialItems = editorialPosts.map(editorialToNewsItem);

    // Separate editorial posts by type for priority ordering
    const breakingPosts = editorialItems.filter(p => p.editorialType === 'breaking');
    const pinnedPosts = editorialItems.filter(p => p.editorialType === 'pinned');
    const contextPosts = editorialItems.filter(p => p.editorialType === 'context');
    const eventPosts = editorialItems.filter(p => p.editorialType === 'event');

    // Process alert statuses - O(n)
    const withAlertStatus = processAlertStatuses(filtered);

    // Sort by published timestamp (pure chronological)
    const sorted = sortByCascadePriority(withAlertStatus);

    // Merge with editorial posts:
    // 1. BREAKING posts at the very top
    // 2. PINNED posts next
    // 3. Context and event posts mixed chronologically with regular feed
    const contextAndEvents = [...contextPosts, ...eventPosts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Merge context/events into sorted feed chronologically
    const mergedFeed: NewsItem[] = [];
    let feedIdx = 0;
    let editIdx = 0;

    while (feedIdx < sorted.length || editIdx < contextAndEvents.length) {
      if (editIdx >= contextAndEvents.length) {
        mergedFeed.push(sorted[feedIdx++]);
      } else if (feedIdx >= sorted.length) {
        mergedFeed.push(contextAndEvents[editIdx++]);
      } else if (contextAndEvents[editIdx].timestamp >= sorted[feedIdx].timestamp) {
        mergedFeed.push(contextAndEvents[editIdx++]);
      } else {
        mergedFeed.push(sorted[feedIdx++]);
      }
    }

    // Final order: breaking -> pinned -> merged feed
    const finalFeed = [...breakingPosts, ...pinnedPosts, ...mergedFeed];

    // Simple limit - no rebalancing, preserve chronological order
    const limited = finalFeed.slice(0, limit);

    // Calculate activity levels - O(n)
    const activity = calculateRegionActivity(filtered);

    return NextResponse.json({
      items: limited,
      activity,
      fetchedAt: new Date().toISOString(),
      totalItems: filtered.length,
      editorialCount,
      fromCache,
      hoursWindow: hours,
      sourcesCount: getSourcesForRegion(region).length,
      // Incremental update flag - client knows to prepend, not replace
      isIncremental: !!sinceCutoff,
    });
  } catch (error) {
    console.error('News API error:', error);

    // Try to return cached data on error
    const cached = getCachedNews(cacheKey);
    if (cached) {
      console.log('[News API] Returning stale cache due to error');
      const filtered = filterByTimeWindow(cached.items, hours);
      return NextResponse.json({
        items: filtered.slice(0, limit),
        activity: calculateRegionActivity(filtered),
        fetchedAt: new Date().toISOString(),
        totalItems: filtered.length,
        fromCache: true,
        hoursWindow: hours,
        error: 'Partial data - refresh failed',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch news', items: [], activity: {} },
      { status: 500 }
    );
  }
}

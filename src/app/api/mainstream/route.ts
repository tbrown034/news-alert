import { NextResponse } from 'next/server';
import { fetchRssFeed } from '@/lib/rss';
import { allTieredSources, TieredSource } from '@/lib/sources-clean';
import { WatchpointId, NewsItem } from '@/types';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rateLimit';
import { getDbCache, isDbCacheFresh, setDbCache } from '@/lib/dbCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

// Valid regions
const VALID_REGIONS: WatchpointId[] = ['all', 'us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa'];

// =============================================================================
// MAINSTREAM NEWS CACHE
// =============================================================================
// Cache key = region only. topN/hours filtering applied after cache read.
// Longer TTL (15 minutes) - mainstream news updates slower than OSINT feeds.

interface MainstreamCacheEntry {
  data: MainstreamSourceGroup[];
  timestamp: number;
}

interface MainstreamSourceGroup {
  sourceId: string;
  sourceName: string;
  sourceRegion: WatchpointId;
  articles: NewsItem[];
  mostRecentTimestamp: string;
  articleCountInWindow: number;
}

// Global cache for mainstream news
const globalForCache = globalThis as unknown as {
  mainstreamCache: Map<string, MainstreamCacheEntry> | undefined;
};

function getCache(): Map<string, MainstreamCacheEntry> {
  if (!globalForCache.mainstreamCache) {
    globalForCache.mainstreamCache = new Map();
  }
  return globalForCache.mainstreamCache;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const STALE_WHILE_REVALIDATE_MS = 30 * 60 * 1000; // 30 minutes

function getCachedMainstream(cacheKey: string): MainstreamCacheEntry | null {
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > STALE_WHILE_REVALIDATE_MS) {
    cache.delete(cacheKey);
    return null;
  }

  return cached;
}

function isCacheFresh(cacheKey: string): boolean {
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

function setCachedMainstream(cacheKey: string, data: MainstreamSourceGroup[]): void {
  const cache = getCache();
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

// Track in-flight fetches to prevent duplicate requests
const inFlightFetches = new Map<string, Promise<MainstreamSourceGroup[]>>();

// =============================================================================
// FILTERING & FETCHING
// =============================================================================

/**
 * Get mainstream news sources (news-org RSS/Bluesky + Reddit subreddits)
 */
function getMainstreamSources(region: WatchpointId): TieredSource[] {
  return allTieredSources.filter(source => {
    const isNewsOrg = source.sourceType === 'news-org' &&
      (source.platform === 'rss' || source.platform === 'bluesky');
    const isReddit = source.platform === 'reddit';

    if (!isNewsOrg && !isReddit) return false;

    // Filter by region
    if (region === 'all') return true;
    return source.region === region || source.region === 'all';
  });
}

/**
 * Filter articles by time window
 */
function filterByTimeWindow(items: NewsItem[], hours: number): NewsItem[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return items.filter(item => item.timestamp.getTime() > cutoff);
}

// Platform type helpers (used for batching)
function isBlueskySource(source: TieredSource): boolean {
  return source.platform === 'bluesky';
}

function isRedditSource(source: TieredSource): boolean {
  return source.platform === 'reddit';
}

/**
 * Fetch sources in batches for a single platform
 */
async function fetchPlatformSources(
  sources: TieredSource[],
  batchSize: number,
  batchDelay: number
): Promise<{ source: TieredSource; items: NewsItem[] }[]> {
  const results: { source: TieredSource; items: NewsItem[] }[] = [];

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (source) => {
        try {
          const items = await fetchRssFeed(source);
          return { source, items };
        } catch {
          return { source, items: [] as NewsItem[] };
        }
      })
    );

    results.push(...batchResults);

    if (i + batchSize < sources.length) {
      await new Promise(r => setTimeout(r, batchDelay));
    }
  }

  return results;
}

/**
 * Fetch all mainstream sources — unfiltered (no topN/hours).
 * Groups results by source. Platforms fetched in parallel with appropriate batching.
 */
async function fetchMainstreamNews(
  sources: TieredSource[]
): Promise<MainstreamSourceGroup[]> {
  // Separate sources by platform for appropriate batching
  const blueskySources = sources.filter(isBlueskySource);
  const redditSources = sources.filter(isRedditSource);
  const rssSources = sources.filter(s => !isBlueskySource(s) && !isRedditSource(s));

  // Fetch all platforms in parallel (each platform batches internally)
  const [rssResults, bskyResults, redditResults] = await Promise.all([
    fetchPlatformSources(rssSources, 30, 50),      // RSS: tolerant of parallelism
    fetchPlatformSources(blueskySources, 30, 100),  // Bluesky: moderate limits
    fetchPlatformSources(redditSources, 3, 300),    // Reddit: strict rate limiting
  ]);

  const allResults = [...rssResults, ...bskyResults, ...redditResults];

  // Group by source
  const groups: MainstreamSourceGroup[] = [];

  for (const { source, items } of allResults) {
    if (items.length === 0) continue;

    // Sort by timestamp (newest first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    groups.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceRegion: source.region,
      articles: items,
      mostRecentTimestamp: items[0].timestamp.toISOString(),
      articleCountInWindow: items.length,
    });
  }

  // Sort groups by most recent article (sources with newest content first)
  groups.sort((a, b) =>
    new Date(b.mostRecentTimestamp).getTime() - new Date(a.mostRecentTimestamp).getTime()
  );

  return groups;
}

/**
 * Fetch mainstream news with caching and in-flight deduplication.
 * Cache key = region only. topN/hours applied after cache read.
 */
async function fetchMainstreamWithCache(region: WatchpointId): Promise<MainstreamSourceGroup[]> {
  const cacheKey = region;

  // Check for in-flight fetch
  const inFlight = inFlightFetches.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  // L2: Check Postgres cache (survives cold starts, shared across instances)
  if (region === 'all') {
    try {
      const dbCache = await getDbCache<MainstreamSourceGroup[]>('mainstream:all');
      if (dbCache && isDbCacheFresh(dbCache.fetchedAt)) {
        console.log(`[Mainstream API] L2 Postgres hit for mainstream:all (${dbCache.itemCount} groups, ${Math.round((Date.now() - dbCache.fetchedAt.getTime()) / 1000)}s old)`);
        setCachedMainstream(cacheKey, dbCache.items); // populate L1
        return dbCache.items;
      }
    } catch (err) {
      console.error('[Mainstream API] L2 cache read error:', err);
    }
  }

  const sources = getMainstreamSources(region);

  const fetchPromise = (async () => {
    try {
      console.log(`[Mainstream API] Fetching ${region} (${sources.length} sources)`);
      const groups = await fetchMainstreamNews(sources);
      setCachedMainstream(cacheKey, groups);

      // Update L2 Postgres cache (fire-and-forget)
      if (region === 'all') {
        setDbCache('mainstream:all', groups, groups.length).catch(err =>
          console.error('[Mainstream API] L2 cache write error:', err)
        );
      }

      return groups;
    } finally {
      inFlightFetches.delete(cacheKey);
    }
  })();

  inFlightFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Apply topN and hours filtering to cached source groups.
 * Returns new array with filtered/sliced articles per group.
 */
function applyFilters(
  groups: MainstreamSourceGroup[],
  topN: number,
  hours: number
): MainstreamSourceGroup[] {
  const filtered: MainstreamSourceGroup[] = [];

  for (const group of groups) {
    const timeFiltered = filterByTimeWindow(group.articles, hours);
    if (timeFiltered.length === 0) continue;

    filtered.push({
      ...group,
      articles: timeFiltered.slice(0, topN),
      articleCountInWindow: timeFiltered.length,
    });
  }

  return filtered;
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET(request: Request) {
  // Rate limiting: 60 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(`mainstream:${clientIp}`, {
    windowMs: 60000,
    maxRequests: 60,
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
  const topNParam = parseInt(searchParams.get('topN') || '3', 10);
  const hoursParam = parseInt(searchParams.get('hours') || '24', 10);
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Validate region
  if (!VALID_REGIONS.includes(regionParam as WatchpointId)) {
    return NextResponse.json(
      { error: 'Invalid region parameter', validRegions: VALID_REGIONS },
      { status: 400 }
    );
  }

  const region = regionParam as WatchpointId;
  const topN = Math.min(Math.max(1, isNaN(topNParam) ? 3 : topNParam), 10); // 1-10
  const hours = Math.min(Math.max(1, isNaN(hoursParam) ? 24 : hoursParam), 72); // 1-72

  // Cache key = region only (topN/hours are cheap post-processing)
  const cacheKey = region;

  try {
    let sourceGroups: MainstreamSourceGroup[];
    let fromCache = false;

    const cached = getCachedMainstream(cacheKey);

    if (!forceRefresh && cached && isCacheFresh(cacheKey)) {
      // Fresh cache hit
      sourceGroups = cached.data;
      fromCache = true;
    } else if (!forceRefresh && cached) {
      // Stale cache - return immediately, refresh in background (deduped)
      sourceGroups = cached.data;
      fromCache = true;
      console.log(`[Mainstream API] Stale cache for ${cacheKey}, refreshing in background`);
      fetchMainstreamWithCache(region).catch(err =>
        console.error('[Mainstream API] Background refresh error:', err)
      );
    } else {
      // Cache miss - fetch fresh data (deduped)
      console.log(`[Mainstream API] Fetching fresh data for ${cacheKey}...`);
      sourceGroups = await fetchMainstreamWithCache(region);
    }

    // Apply topN and hours filtering after cache read
    const filtered = applyFilters(sourceGroups, topN, hours);

    // Calculate totals
    const totalSources = filtered.length;
    const totalArticles = filtered.reduce((sum, g) => sum + g.articles.length, 0);

    return NextResponse.json({
      sources: filtered,
      totalSources,
      totalArticles,
      fetchedAt: new Date().toISOString(),
      fromCache,
      params: {
        region,
        topN,
        hours,
      },
    });
  } catch (error) {
    console.error('[Mainstream API] Error:', error);

    // Try to return cached data on error
    const cached = getCachedMainstream(cacheKey);
    if (cached) {
      console.log('[Mainstream API] Returning stale cache due to error');
      const filtered = applyFilters(cached.data, topN, hours);
      return NextResponse.json({
        sources: filtered,
        totalSources: filtered.length,
        totalArticles: filtered.reduce((sum, g) => sum + g.articles.length, 0),
        fetchedAt: new Date().toISOString(),
        fromCache: true,
        error: 'Partial data - refresh failed',
        params: {
          region,
          topN,
          hours,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch mainstream news', sources: [], totalSources: 0, totalArticles: 0 },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { fetchRssFeed } from '@/lib/rss';
import { allTieredSources, TieredSource } from '@/lib/sources-clean';
import { WatchpointId, NewsItem } from '@/types';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

// Valid regions
const VALID_REGIONS: WatchpointId[] = ['all', 'us', 'latam', 'middle-east', 'europe-russia', 'asia'];

// =============================================================================
// MAINSTREAM NEWS CACHE
// =============================================================================
// Longer cache TTL (15 minutes) - mainstream news updates slower than OSINT feeds

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
  articleCount24h: number;
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

// =============================================================================
// FILTERING & FETCHING
// =============================================================================

/**
 * Get mainstream news sources (news-org + RSS only)
 */
function getMainstreamSources(region: WatchpointId): TieredSource[] {
  return allTieredSources.filter(source => {
    // Filter: must be news-org on RSS or Bluesky
    if (source.sourceType !== 'news-org') return false;
    if (source.platform !== 'rss' && source.platform !== 'bluesky') return false;

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

/**
 * Fetch all mainstream sources and group by source
 */
async function fetchMainstreamNews(
  sources: TieredSource[],
  topN: number,
  hours: number
): Promise<MainstreamSourceGroup[]> {
  const groups: MainstreamSourceGroup[] = [];

  // Fetch all sources in parallel with batching
  const batchSize = 20;
  const batchDelay = 100;

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async (source) => {
        try {
          const items = await fetchRssFeed(source);
          return { source, items };
        } catch {
          return { source, items: [] };
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value.items.length > 0) {
        const { source, items } = result.value;

        // Filter by time window
        const filtered = filterByTimeWindow(items, hours);

        if (filtered.length === 0) continue;

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Take top N articles
        const topArticles = filtered.slice(0, topN);

        groups.push({
          sourceId: source.id,
          sourceName: source.name,
          sourceRegion: source.region,
          articles: topArticles,
          mostRecentTimestamp: topArticles[0].timestamp.toISOString(),
          articleCount24h: filtered.length,
        });
      }
    }

    // Delay between batches (but not after the last batch)
    if (i + batchSize < sources.length) {
      await new Promise(r => setTimeout(r, batchDelay));
    }
  }

  // Sort groups by most recent article (sources with newest content first)
  groups.sort((a, b) =>
    new Date(b.mostRecentTimestamp).getTime() - new Date(a.mostRecentTimestamp).getTime()
  );

  return groups;
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

  const cacheKey = `${region}:${topN}:${hours}`;

  try {
    let sourceGroups: MainstreamSourceGroup[];
    let fromCache = false;

    const cached = getCachedMainstream(cacheKey);

    if (!forceRefresh && cached && isCacheFresh(cacheKey)) {
      // Fresh cache hit
      sourceGroups = cached.data;
      fromCache = true;
    } else if (!forceRefresh && cached) {
      // Stale cache - return immediately, refresh in background
      sourceGroups = cached.data;
      fromCache = true;
      console.log(`[Mainstream API] Stale cache for ${cacheKey}, refreshing in background`);

      // Background refresh
      const sources = getMainstreamSources(region);
      fetchMainstreamNews(sources, topN, hours)
        .then(data => setCachedMainstream(cacheKey, data))
        .catch(err => console.error('[Mainstream API] Background refresh error:', err));
    } else {
      // Cache miss - fetch fresh data
      console.log(`[Mainstream API] Fetching fresh data for ${cacheKey}...`);
      const sources = getMainstreamSources(region);
      console.log(`[Mainstream API] Found ${sources.length} mainstream RSS sources for region: ${region}`);

      sourceGroups = await fetchMainstreamNews(sources, topN, hours);
      setCachedMainstream(cacheKey, sourceGroups);
    }

    // Calculate totals
    const totalSources = sourceGroups.length;
    const totalArticles = sourceGroups.reduce((sum, g) => sum + g.articles.length, 0);

    return NextResponse.json({
      sources: sourceGroups,
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
      return NextResponse.json({
        sources: cached.data,
        totalSources: cached.data.length,
        totalArticles: cached.data.reduce((sum, g) => sum + g.articles.length, 0),
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

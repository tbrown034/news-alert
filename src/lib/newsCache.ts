/**
 * SHARED NEWS CACHE
 * =================
 * Centralized cache for news items, shared between news and summary endpoints.
 * Uses global singleton pattern to persist across Next.js hot reloads.
 */

import { NewsItem } from '@/types';

interface CachedNewsData {
  items: NewsItem[];
  timestamp: number;
  isComplete: boolean;
}

interface NewsCache {
  data: Map<string, CachedNewsData>;
}

// Use global to persist cache across hot reloads in development
const globalForCache = globalThis as unknown as {
  newsCache: NewsCache | undefined;
};

// Initialize or get existing cache
function getCache(): Map<string, CachedNewsData> {
  if (!globalForCache.newsCache) {
    globalForCache.newsCache = {
      data: new Map<string, CachedNewsData>(),
    };
  }
  return globalForCache.newsCache.data;
}

// Cache TTL - how long before data is considered stale
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Stale-while-revalidate window
const STALE_WHILE_REVALIDATE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get cached news data for a cache key (region name)
 */
export function getCachedNews(cacheKey: string): CachedNewsData | null {
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;

  // Return null if data is too old
  if (age > STALE_WHILE_REVALIDATE_MS) {
    cache.delete(cacheKey);
    return null;
  }

  return cached;
}

/**
 * Check if cached data is fresh (within TTL)
 */
export function isCacheFresh(cacheKey: string): boolean {
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

/**
 * Check if cached data is stale but still usable
 */
export function isCacheStale(cacheKey: string): boolean {
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age >= CACHE_TTL_MS && age < STALE_WHILE_REVALIDATE_MS;
}

/**
 * Set cached news data
 */
export function setCachedNews(
  cacheKey: string,
  items: NewsItem[],
  isComplete: boolean = true
): void {
  const cache = getCache();
  cache.set(cacheKey, {
    items,
    timestamp: Date.now(),
    isComplete,
  });
}

/**
 * Get all cached items across all regions (for summary generation)
 */
export function getAllCachedNews(): NewsItem[] {
  const cache = getCache();

  // First try the 'all' region cache
  const allCached = cache.get('all');
  if (allCached && allCached.items.length > 0) {
    return allCached.items;
  }

  // Fallback: merge all regional caches
  const allItems = new Map<string, NewsItem>();

  for (const cached of cache.values()) {
    for (const item of cached.items) {
      allItems.set(item.id, item);
    }
  }

  return Array.from(allItems.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}


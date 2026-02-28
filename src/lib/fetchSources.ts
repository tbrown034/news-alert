import { fetchRssFeed } from '@/lib/rss';
import { getSourcesByRegion, TieredSource } from '@/lib/sources-clean';
import { WatchpointId, NewsItem } from '@/types';

// =============================================================================
// ENABLED PLATFORMS
// This module serves the OSINT/social feed (Bluesky, Telegram, Mastodon).
// RSS news agencies are served by /api/mainstream instead.
// =============================================================================
export const FEED_PLATFORMS = new Set(['bluesky', 'telegram', 'mastodon']);

function isPlatformEnabled(source: TieredSource): boolean {
  return FEED_PLATFORMS.has(source.platform);
}

function isBlueskySource(source: TieredSource): boolean {
  return source.platform === 'bluesky';
}

function isTelegramSource(source: TieredSource): boolean {
  return source.platform === 'telegram';
}

function isMastodonSource(source: TieredSource): boolean {
  return source.platform === 'mastodon';
}

/** Get sources filtered by region AND enabled platforms */
export function getSourcesForRegion(region: WatchpointId): TieredSource[] {
  const regionSources = getSourcesByRegion(region);
  return regionSources.filter(isPlatformEnabled);
}

/**
 * Fetch sources in batches for a single platform
 */
export async function fetchPlatformSources(
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
 * Fetch sources - grouped by platform with appropriate batching.
 * Platforms are fetched IN PARALLEL for speed.
 */
export async function fetchAllSources(
  sources: TieredSource[]
): Promise<NewsItem[]> {
  const blueskySources = sources.filter(isBlueskySource);
  const telegramSources = sources.filter(isTelegramSource);
  const mastodonSources = sources.filter(isMastodonSource);

  const [bskyItems, tgItems, mastoItems] = await Promise.all([
    fetchPlatformSources(blueskySources, 30, 100),
    fetchPlatformSources(telegramSources, 5, 300),
    fetchPlatformSources(mastodonSources, 20, 100),
  ]);

  return [...bskyItems, ...tgItems, ...mastoItems];
}

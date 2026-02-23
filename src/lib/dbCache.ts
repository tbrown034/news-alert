/**
 * POSTGRES L2 CACHE
 * =================
 * Read/write helpers for the news_cache table.
 * Sits between in-memory L1 (newsCache.ts) and live fetching (L3).
 *
 * The cron job keeps this warm every 5 minutes so cold starts
 * get ~30ms Postgres reads instead of 10-30s live fetches.
 */

import { query, queryOne } from './db';

interface DbCacheRow {
  cache_key: string;
  data: unknown; // JSONB — parsed automatically by pg
  item_count: number;
  fetched_at: Date;
}

export interface DbCacheResult<T> {
  items: T;
  itemCount: number;
  fetchedAt: Date;
}

// Max age before we consider DB cache too stale to serve (30 minutes)
const MAX_AGE_MS = 30 * 60 * 1000;

// "Fresh" threshold — cron runs every 5min, so <6min = fresh enough to skip live fetch
const FRESH_AGE_MS = 6 * 60 * 1000;

/**
 * Check if a fetched_at timestamp is fresh enough to serve without live-fetching.
 * Fresh = less than 6 minutes old (5min cron interval + 1min buffer).
 */
export function isDbCacheFresh(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() < FRESH_AGE_MS;
}

/**
 * Read from the news_cache table.
 * Returns null if missing or older than MAX_AGE_MS.
 */
export async function getDbCache<T>(key: string): Promise<DbCacheResult<T> | null> {
  try {
    const row = await queryOne<DbCacheRow>(
      `SELECT cache_key, data, item_count, fetched_at
       FROM news_cache
       WHERE cache_key = $1`,
      [key]
    );

    if (!row) return null;

    // Too old — treat as miss
    if (Date.now() - row.fetched_at.getTime() > MAX_AGE_MS) {
      return null;
    }

    // Re-hydrate Date objects from ISO strings in the JSONB data.
    // pg parses JSONB automatically but timestamps inside are still strings.
    const data = rehydrateDates(row.data) as T;

    return {
      items: data,
      itemCount: row.item_count,
      fetchedAt: row.fetched_at,
    };
  } catch (err) {
    console.error('[DB Cache] Read error:', err);
    return null;
  }
}

/**
 * Write to the news_cache table (upsert).
 * Fire-and-forget — callers should `.catch(console.error)`.
 */
export async function setDbCache(key: string, data: unknown, itemCount: number): Promise<void> {
  try {
    await query(
      `INSERT INTO news_cache (cache_key, data, item_count, fetched_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (cache_key) DO UPDATE SET
         data = EXCLUDED.data,
         item_count = EXCLUDED.item_count,
         fetched_at = EXCLUDED.fetched_at`,
      [key, JSON.stringify(data), itemCount]
    );
  } catch (err) {
    console.error('[DB Cache] Write error:', err);
  }
}

/**
 * Recursively walk parsed JSONB and convert `timestamp` fields
 * (ISO strings) back to Date objects so downstream code works.
 */
function rehydrateDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(rehydrateDates);
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
      if (
        key === 'timestamp' &&
        typeof value === 'string'
      ) {
        const d = new Date(value);
        result[key] = isNaN(d.getTime()) ? value : d;
      } else {
        result[key] = rehydrateDates(value);
      }
    }

    return result;
  }

  return obj;
}

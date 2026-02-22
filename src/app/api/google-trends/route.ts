/**
 * GOOGLE TRENDS API
 * =================
 * Fetches daily trending searches from Google Trends RSS feeds
 * Grouped by dashboard region (US, Middle East, Europe, Asia, LatAm)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cache
let cachedResponse: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Country codes mapped to our WatchpointId regions
const REGION_COUNTRIES: Record<string, string[]> = {
  'us': ['US'],
  'middle-east': ['IL', 'IR', 'EG'],
  'europe-russia': ['GB', 'DE', 'RU'],
  'asia': ['JP', 'IN'],
  'latam': ['BR', 'MX'],
};

interface TrendItem {
  term: string;
  traffic: string;
  url: string;
}

function buildFeedUrl(countryCode: string): string {
  return `https://trends.google.com/trending/rss?geo=${countryCode}`;
}

function buildExploreUrl(term: string, countryCode: string): string {
  return `https://trends.google.com/trends/explore?q=${encodeURIComponent(term)}&geo=${countryCode}`;
}

/**
 * Parse Google Trends RSS XML without an XML library.
 * The feed structure is simple and predictable:
 *   <item>
 *     <title>TERM</title>
 *     <ht:approx_traffic>200K+</ht:approx_traffic>
 *     <link>URL</link>
 *   </item>
 */
function parseItems(xml: string, countryCode: string): TrendItem[] {
  const items: TrendItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title>([^<]*)<\/title>/);
    const trafficMatch = block.match(/<ht:approx_traffic>([^<]*)<\/ht:approx_traffic>/);

    if (!titleMatch) continue;

    const term = decodeXmlEntities(titleMatch[1].trim());
    const traffic = trafficMatch ? trafficMatch[1].trim() : '';

    items.push({
      term,
      traffic,
      url: buildExploreUrl(term, countryCode),
    });
  }

  return items;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function fetchCountryTrends(countryCode: string): Promise<TrendItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(buildFeedUrl(countryCode), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Google Trends RSS error for ${countryCode}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseItems(xml, countryCode);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Google Trends RSS timeout for ${countryCode}`);
    } else {
      console.error(`Google Trends RSS error for ${countryCode}:`, error);
    }
    return [];
  }
}

/**
 * Merge trends from multiple countries, deduplicating by lowercased term.
 * Keeps the entry with the highest traffic when duplicates exist.
 */
function mergeAndDedup(allItems: TrendItem[]): TrendItem[] {
  const seen = new Map<string, TrendItem>();

  for (const item of allItems) {
    const key = item.term.toLowerCase();
    const existing = seen.get(key);

    if (!existing || parseTraffic(item.traffic) > parseTraffic(existing.traffic)) {
      seen.set(key, item);
    }
  }

  // Sort by traffic descending
  return Array.from(seen.values()).sort(
    (a, b) => parseTraffic(b.traffic) - parseTraffic(a.traffic)
  );
}

/** Parse traffic strings like "200K+", "2M+" into numbers for sorting */
function parseTraffic(traffic: string): number {
  if (!traffic) return 0;
  const cleaned = traffic.replace(/[+,]/g, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(K|M)?$/i);
  if (!match) return parseInt(cleaned, 10) || 0;

  const num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'M') return num * 1_000_000;
  if (suffix === 'K') return num * 1_000;
  return num;
}

export async function GET() {
  const now = Date.now();

  // Return cached response if fresh
  if (cachedResponse && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'HIT',
      },
    });
  }

  // Collect all unique country codes
  const countrySet: Record<string, boolean> = {};
  for (const countries of Object.values(REGION_COUNTRIES)) {
    for (const cc of countries) {
      countrySet[cc] = true;
    }
  }
  const allCountries = Object.keys(countrySet);

  // Fetch all countries in parallel
  const fetchPromises: Record<string, Promise<TrendItem[]>> = {};
  for (const cc of allCountries) {
    fetchPromises[cc] = fetchCountryTrends(cc);
  }

  const results = await Promise.allSettled(
    allCountries.map(async (cc) => ({
      cc,
      items: await fetchPromises[cc],
    }))
  );

  // Index results by country code
  const countryResults: Record<string, TrendItem[]> = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      countryResults[result.value.cc] = result.value.items;
    }
  }

  // Build per-region trends
  const trends: Record<string, { terms: TrendItem[] }> = {};

  for (const [region, countries] of Object.entries(REGION_COUNTRIES)) {
    const regionItems: TrendItem[] = [];
    for (const cc of countries) {
      const items = countryResults[cc];
      if (items) {
        regionItems.push(...items);
      }
    }

    const merged = mergeAndDedup(regionItems);
    trends[region] = { terms: merged.slice(0, 5) };
  }

  const response = {
    trends,
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  cachedResponse = response;
  cacheTimestamp = now;

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Cache': 'MISS',
    },
  });
}

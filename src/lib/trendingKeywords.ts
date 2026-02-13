/**
 * TRENDING KEYWORDS
 * =================
 * Extracts and counts keyword matches from news items to surface trending topics.
 *
 * Approach:
 * 1. Re-run region detection on each item to get matched keywords
 * 2. Count keyword frequency across all items
 * 3. Return top N keywords sorted by count
 *
 * Only counts explicit keyword matches (not source region fallbacks).
 */

import { NewsItem } from '@/types';
import { detectRegion } from './regionDetection';

export interface TrendingKeyword {
  keyword: string;
  count: number;
  // Which regions this keyword triggered
  regions: string[];
}

export interface TrendingKeywordsResult {
  keywords: TrendingKeyword[];
  totalItemsAnalyzed: number;
  itemsWithMatches: number;
}

/**
 * Normalize a keyword to its canonical form for counting and dedup.
 * Intentionally lossy — strips periods, lowercases, trims.
 * "U.S." and "US" both become "us". That's the point.
 */
function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().replace(/\./g, '').trim();
}

/**
 * Canonical display names for normalized keywords.
 * normalized form → display string
 *
 * This is the single source of truth for how a keyword looks in the UI.
 * normalizeKeyword() decides identity, this map decides presentation.
 */
const DISPLAY_NAMES: Record<string, string> = {
  'us': 'U.S.', 'eu': 'EU', 'uk': 'UK', 'un': 'UN',
  'nato': 'NATO', 'who': 'WHO', 'fbi': 'FBI', 'cia': 'CIA',
  'doj': 'DOJ', 'dhs': 'DHS', 'ice': 'ICE', 'nsa': 'NSA',
  'cdc': 'CDC', 'fda': 'FDA', 'epa': 'EPA', 'sec': 'SEC',
  'ftc': 'FTC', 'dod': 'DOD', 'nyc': 'NYC', 'la': 'LA',
  'dc': 'DC', 'uae': 'UAE', 'isis': 'ISIS', 'idf': 'IDF',
  'hamas': 'Hamas', 'cnn': 'CNN', 'bbc': 'BBC', 'nyt': 'NYT',
  'wsj': 'WSJ', 'ap': 'AP', 'gop': 'GOP', 'dnc': 'DNC',
  'rnc': 'RNC', 'scotus': 'SCOTUS', 'potus': 'POTUS',
  'flotus': 'FLOTUS', 'opec': 'OPEC', 'imf': 'IMF', 'wto': 'WTO',
  'cbp': 'CBP', 'dea': 'DEA', 'atf': 'ATF', 'nypd': 'NYPD',
};

/**
 * Format a keyword for display.
 * Calls normalizeKeyword() — never re-derives normalization.
 */
function formatKeywordDisplay(keyword: string): string {
  const normalized = normalizeKeyword(keyword);
  return DISPLAY_NAMES[normalized]
    ?? keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
}

/**
 * Extract matched keywords from a single news item
 * Returns only explicit keyword matches, not source region fallbacks
 */
export function extractKeywordsFromItem(item: NewsItem): string[] {
  // Combine title and content for detection
  const text = `${item.title} ${item.content || ''}`;

  // Run detection - we don't care about the region result,
  // just the matched keywords
  const result = detectRegion(text, 'all');

  // Collect all matched keywords from all region matches
  const keywords: string[] = [];
  for (const match of result.allMatches) {
    keywords.push(...match.matchedKeywords);
  }

  return keywords;
}

/**
 * Count keyword occurrences across all items
 * Display names come from DISPLAY_NAMES map, with title-case fallback
 */
export function countKeywords(
  items: NewsItem[]
): Map<string, { count: number; regions: Set<string>; displayName: string }> {
  const counts = new Map<string, { count: number; regions: Set<string>; displayName: string }>();

  for (const item of items) {
    const keywords = extractKeywordsFromItem(item);

    // Track which keywords we've already counted for this item
    // (avoid double-counting if same keyword appears multiple times in one item)
    const seenInItem = new Set<string>();

    for (const keyword of keywords) {
      const normalized = normalizeKeyword(keyword);

      if (seenInItem.has(normalized)) continue;
      seenInItem.add(normalized);

      const existing = counts.get(normalized);
      if (existing) {
        existing.count++;
        existing.regions.add(item.region);
      } else {
        // Format display name with proper casing
        const displayName = formatKeywordDisplay(keyword.trim());
        counts.set(normalized, {
          count: 1,
          regions: new Set([item.region]),
          displayName,
        });
      }
    }
  }

  return counts;
}

/**
 * Get trending keywords from news items
 *
 * @param items - News items to analyze
 * @param limit - Maximum number of keywords to return (default 10)
 * @returns Trending keywords sorted by count (descending)
 */
export function getTrendingKeywords(
  items: NewsItem[],
  limit: number = 10
): TrendingKeywordsResult {
  const counts = countKeywords(items);

  // Convert to array and sort by count
  // Use displayName (properly cased) instead of normalized key
  const keywords: TrendingKeyword[] = Array.from(counts.entries())
    .map(([_normalized, data]) => ({
      keyword: data.displayName,
      count: data.count,
      regions: Array.from(data.regions),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Count items with at least one keyword match
  let itemsWithMatches = 0;
  for (const item of items) {
    const keywords = extractKeywordsFromItem(item);
    if (keywords.length > 0) {
      itemsWithMatches++;
    }
  }

  return {
    keywords,
    totalItemsAnalyzed: items.length,
    itemsWithMatches,
  };
}

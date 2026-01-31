/**
 * SOURCE UTILITIES
 * ================
 * Helper functions for source classification and detection.
 * Extracted from sources.ts during cleanup (2026-01-27).
 */

import type { WatchpointId } from '@/types';
import { detectRegion } from './regionDetection';

/**
 * Region classification result with both source and detected regions
 */
export interface RegionClassification {
  region: WatchpointId;           // Effective region to use
  sourceRegion?: WatchpointId;    // Original source region (only set if different from detected)
}

/**
 * Classify news item by region based on content.
 * Uses the comprehensive regex patterns in regionDetection.ts
 *
 * @param title - Post title
 * @param content - Post content
 * @param sourceRegion - The source's default region
 * @returns Object with effective region and sourceRegion (if overridden)
 */
export function classifyRegion(
  title: string,
  content: string,
  sourceRegion: WatchpointId = 'all'
): RegionClassification {
  const text = `${title} ${content}`;
  const result = detectRegion(text, sourceRegion);

  // If we detected a region with confidence
  if (result.detectedRegion && result.detectedRegion !== 'all') {
    // If source has a specific region and detected is different, track the override
    // This lets UI show "MIDEAST → ASIA" when Jerusalem Post posts about Tokyo
    if (sourceRegion !== 'all' && result.detectedRegion !== sourceRegion) {
      return {
        region: result.detectedRegion,
        sourceRegion: sourceRegion,
      };
    }
    // Detected matches source or source is global - just return detected
    return { region: result.detectedRegion };
  }

  // No strong detection - use source default
  return { region: sourceRegion };
}

// Breaking news keywords - focused on geopolitical events
export const breakingKeywords = [
  'breaking:', 'urgent:', 'alert:', 'just in:', 'developing:',
  'explosion', 'airstrike', 'missile strike', 'rocket attack',
  'troops', 'military operation', 'invasion', 'declaration of war',
  'ceasefire', 'peace deal', 'hostage', 'assassination',
  'coup', 'martial law', 'state of emergency', 'sanctions',
  'nuclear', 'chemical weapons', 'biological weapons',
  'embassy', 'diplomat expelled', 'protests',
];

// Keywords that indicate NOT breaking (sports, entertainment, etc.)
const notBreakingKeywords = [
  'semifinal', 'final score', 'match', 'goal', 'tournament',
  'cup of nations', 'world cup', 'premier league', 'champions league',
  'nba', 'nfl', 'mlb', 'tennis', 'golf', 'cricket',
  'box office', 'movie', 'album', 'concert', 'celebrity',
  'recipe', 'weather forecast', 'stock market', 'earnings',
];

/**
 * Check if content appears to be breaking news.
 * Excludes sports/entertainment, then checks for breaking indicators.
 */
export function isBreakingNews(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();

  // First check if it's clearly NOT breaking (sports, entertainment)
  if (notBreakingKeywords.some((kw) => text.includes(kw))) {
    return false;
  }

  // Then check for actual breaking news indicators
  return breakingKeywords.some((kw) => text.includes(kw));
}

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
interface RegionClassification {
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


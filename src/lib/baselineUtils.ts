/**
 * PPD Baseline Utilities
 * ======================
 * Single source of truth for getting the effective posts-per-day value
 * for activity detection.
 *
 * Priority: baselinePPD (30-day measured) > estimatedPPD (quick API) > FALLBACK_PPD
 */

/** Fallback PPD when no measurement exists */
export const FALLBACK_PPD = 3;

/** Return the best available PPD: baseline > estimate > fallback */
export function getEffectivePPD(source: { baselinePPD?: number; estimatedPPD?: number }): number {
  if (source.baselinePPD && source.baselinePPD > 0) return source.baselinePPD;
  if (source.estimatedPPD && source.estimatedPPD > 0) return source.estimatedPPD;
  return FALLBACK_PPD;
}

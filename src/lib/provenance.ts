import { SourceProvenance, ProvenanceType, AggregationTarget } from '@/types';

// =============================================================================
// SOURCE PROVENANCE DEFINITIONS
// =============================================================================
// "How was this information obtained?"
// Shows access, not truth claims. Reader orientation without disruption.

// Provenance configuration for UI
export const provenanceConfig: Record<ProvenanceType, {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  'on-ground': {
    icon: '📍',
    label: 'On Ground',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'First-hand witness, video or photo from scene',
  },
  'direct': {
    icon: '🎙',
    label: 'Direct',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    description: 'Official statement or primary document',
  },
  'analysis': {
    icon: '🔍',
    label: 'Analysis',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'OSINT analysis of imagery, data, or documents',
  },
  'aggregated': {
    icon: '📡',
    label: 'Aggregated',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Curating and compiling multiple reports',
  },
  'reported': {
    icon: '📰',
    label: 'Reported',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'News organization citing sources',
  },
};

// Aggregation target descriptions
export const aggregationTargetLabels: Record<AggregationTarget, string> = {
  ground: 'ground sources',
  official: 'official statements',
  analysis: 'OSINT analysis',
  mixed: 'mixed sources',
};

// Helper to create provenance for different source types
export function createProvenance(
  type: ProvenanceType,
  amplifies?: AggregationTarget,
  customDescription?: string
): SourceProvenance {
  const baseConfig = provenanceConfig[type];
  let description = customDescription || baseConfig.description;

  // For aggregators, add what they amplify
  if (type === 'aggregated' && amplifies) {
    description = `Aggregates and amplifies ${aggregationTargetLabels[amplifies]}`;
  }

  return {
    type,
    amplifies,
    description,
  };
}

// Pre-built provenance templates for common source types
export const provenanceTemplates = {
  // Official government/military accounts
  official: createProvenance('direct', undefined, 'Official government or military statement'),

  // Key reporters with direct access
  reporter: createProvenance('reported', undefined, 'Journalist with government/insider sources'),

  // OSINT analysts who do original analysis
  osintAnalysis: createProvenance('analysis', undefined, 'Original OSINT analysis of imagery and data'),

  // OSINT aggregators who compile reports
  osintAggregatorGround: createProvenance('aggregated', 'ground', 'Aggregates ground-level reports and eyewitness content'),
  osintAggregatorMixed: createProvenance('aggregated', 'mixed', 'Aggregates reports from multiple source types'),
  osintAggregatorOfficial: createProvenance('aggregated', 'official', 'Aggregates official statements and press releases'),

  // Ground sources - local reporters, Telegram channels
  ground: createProvenance('on-ground', undefined, 'First-hand reports from the scene'),

  // News organizations
  newsOrg: createProvenance('reported', undefined, 'News organization citing multiple sources'),

  // Think tanks and research orgs
  research: createProvenance('analysis', undefined, 'Research-based analysis and assessment'),

  // Flight/ship trackers
  dataTracker: createProvenance('analysis', undefined, 'Real-time data tracking and analysis'),
};

// Get display info for a provenance type
export function getProvenanceDisplay(provenance: SourceProvenance) {
  const config = provenanceConfig[provenance.type];

  // Build the label - add amplification target for aggregators
  let label = config.label;
  if (provenance.type === 'aggregated' && provenance.amplifies) {
    const targetLabel = aggregationTargetLabels[provenance.amplifies];
    // Capitalize first letter
    const capitalizedTarget = targetLabel.charAt(0).toUpperCase() + targetLabel.slice(1);
    label = `${config.label} → ${capitalizedTarget}`;
  }

  return {
    ...config,
    label,
    description: provenance.description,
  };
}

// Provenance spectrum for the "Source Access Key" legend
// Ordered from closest to event (on-ground) to furthest (reported)
export const provenanceSpectrum: ProvenanceType[] = [
  'on-ground',
  'direct',
  'analysis',
  'aggregated',
  'reported',
];

// Color gradient for the spectrum (warm = close, cool = far)
export const provenanceColors = {
  'on-ground': '#ef4444',  // red-500
  'direct': '#10b981',     // emerald-500
  'analysis': '#3b82f6',   // blue-500
  'aggregated': '#f59e0b', // amber-500
  'reported': '#6b7280',   // gray-500
};

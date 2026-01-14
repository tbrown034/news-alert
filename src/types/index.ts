// Watchpoint regions
export type WatchpointId =
  | 'middle-east'
  | 'ukraine-russia'
  | 'china-taiwan'
  | 'venezuela'
  | 'us-domestic'
  | 'all';

export interface Watchpoint {
  id: WatchpointId;
  name: string;
  shortName: string;
  priority: number;
  activityLevel: 'low' | 'normal' | 'elevated' | 'high' | 'critical';
  color: string;
}

// Source tiers (information cascade)
export type SourceTier = 'official' | 'reporter' | 'osint' | 'ground';

export interface Source {
  id: string;
  name: string;
  handle?: string;
  platform: 'bluesky' | 'rss' | 'twitter' | 'telegram' | 'reddit';
  tier: SourceTier;
  confidence: number; // 1-100
  region: WatchpointId;
  url?: string;
}

// News item
export type VerificationStatus = 'unverified' | 'multiple-sources' | 'confirmed';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: Source;
  timestamp: Date;
  region: WatchpointId;
  verificationStatus: VerificationStatus;
  url?: string;
  isBreaking?: boolean;
  relatedItems?: string[]; // IDs of related news items
}

// Activity level for watchpoints
export interface ActivityData {
  watchpointId: WatchpointId;
  currentLevel: number; // 0-100
  baselineLevel: number; // 0-100
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: Date;
}

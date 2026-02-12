// Watchpoint regions
export type WatchpointId =
  | 'us'           // United States
  | 'latam'        // Latin America + Caribbean
  | 'middle-east'  // Middle East
  | 'europe-russia' // Europe & Russia (including Ukraine conflict)
  | 'asia'         // Asia-Pacific (China, Taiwan, Korea, etc.)
  | 'africa'       // Sub-Saharan Africa + North Africa
  | 'seismic'
  | 'all';

// =============================================================================
// SEISMIC / EARTHQUAKE DATA
// =============================================================================

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: Date;
  coordinates: [number, number, number]; // [longitude, latitude, depth in km]
  url: string;
  tsunami: boolean;
  felt: number | null; // Number of felt reports
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  significance: number; // USGS significance score 0-1000+
  depth: number; // km
}

export interface Watchpoint {
  id: WatchpointId;
  name: string;
  shortName: string;
  priority: number;
  activityLevel: 'normal' | 'elevated' | 'critical';
  color: string;
}

// Source types (what kind of source is this)
export type SourceType =
  | 'official'    // Government, military, institutional accounts
  | 'news-org'    // News organizations (AP, Reuters, etc.)
  | 'reporter'    // Individual journalists
  | 'osint'       // Open-source intelligence accounts
  | 'aggregator'  // News aggregators (BNO, etc.)
  | 'analyst'     // Expert analysts, think tanks
  | 'ground'      // On-the-ground sources, local reporters
  | 'bot';        // Automated feeds

// US subcategory tags for filtering within the US region
export type USTag =
  | 'politics'    // Congress, White House, elections, Trump admin, parties
  | 'defense'     // Pentagon, military, DoD, veterans
  | 'economy'     // Fed, Treasury, trade, markets
  | 'domestic';   // Crime, infrastructure, social issues

// =============================================================================
// SOURCE ACTIVITY TRACKING
// =============================================================================
// Detect when a source is posting more than usual

export interface SourceActivityProfile {
  sourceId: string;
  // Baseline: average posts per day (calculated from historical data)
  baselinePostsPerDay: number;
  // Recent: posts in the last tracking window
  recentPosts: number;
  recentWindowHours: number;
  // Anomaly detection
  anomalyRatio: number; // recent_rate / baseline_rate (>1 = above normal)
  isAnomalous: boolean; // true if significantly above baseline
}

export interface Source {
  id: string;
  name: string;
  handle?: string;
  platform: 'bluesky' | 'rss' | 'twitter' | 'telegram' | 'reddit' | 'mastodon' | 'youtube';
  sourceType: SourceType;
  confidence: number; // 1-100
  region: WatchpointId;
  url?: string;
  // Avatar/profile image URL
  avatarUrl?: string;
  // State-sponsored media flag (RT, CGTN, Xinhua, etc.)
  isStateSponsored?: boolean;
  // Expected posting frequency (posts per day, for anomaly detection)
  baselinePostsPerDay?: number;
  // Optional tags for subcategory filtering (currently used for US region)
  tags?: USTag[];
}

export type VerificationStatus = 'unverified' | 'multiple-sources' | 'confirmed';

// Media attachment for posts (images, videos, external links)
export interface MediaAttachment {
  type: 'image' | 'video' | 'external';
  url: string;
  thumbnail?: string;
  alt?: string;
  title?: string; // For external links
}

// Context for replies
export interface ReplyContext {
  parentAuthor: string;
  parentHandle?: string;
  parentText?: string;
}

// Context for reposts/retweets
export interface RepostContext {
  originalAuthor: string;
  originalHandle?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: Source;
  timestamp: Date;
  region: WatchpointId;           // Effective region (detected or source default)
  sourceRegion?: WatchpointId;    // Original source region (shown when overridden)
  verificationStatus: VerificationStatus;
  url?: string;

  // Media attachments (images, videos, links)
  media?: MediaAttachment[];

  // Reply/repost context for social media posts
  replyContext?: ReplyContext;
  repostContext?: RepostContext;

  // For grouping similar stories
  relatedItems?: string[];
  clusterId?: string;

  // Activity anomaly indicators
  // Shows if this source is posting more than usual
  sourceActivity?: {
    isAnomalous: boolean;
    anomalyRatio: number; // 2.0 = posting at 2x normal rate
    recentCount: number;  // "5 posts in 2 hours"
    windowHours: number;
    baseline: number;     // "usually 1/day"
  };
}

// =============================================================================
// REGIONAL SURGE DETECTION
// =============================================================================
// When multiple sources for a region are posting above baseline

export interface RegionalSurge {
  region: WatchpointId;
  anomalousSources: number;     // How many sources are above baseline
  totalActiveSources: number;   // How many sources are posting at all
  surgeRatio: number;           // anomalous / total
  isSurging: boolean;           // True if significant surge detected
  topContributors: string[];    // Source names driving the surge
}

// Activity level for watchpoints
export interface ActivityData {
  watchpointId: WatchpointId;
  currentLevel: number; // 0-100
  baselineLevel: number; // 0-100
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: Date;
}

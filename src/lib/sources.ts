import { Source, WatchpointId } from '@/types';

// RSS feed sources with confidence scores from sources.md
export const rssSources: (Source & { feedUrl: string })[] = [
  // Global/Wire Services
  {
    id: 'bbc-world',
    name: 'BBC World',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'all' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    url: 'https://www.bbc.com/news/world',
  },
  // Reuters deprecated their RSS feeds, using AP via Bluesky instead
  {
    id: 'aljazeera',
    name: 'Al Jazeera',
    platform: 'rss',
    tier: 'reporter',
    confidence: 80,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    url: 'https://www.aljazeera.com/',
  },
  // Middle East Regional
  {
    id: 'bbc-middle-east',
    name: 'BBC Middle East',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    url: 'https://www.bbc.com/news/world/middle_east',
  },
  // Europe/Ukraine
  {
    id: 'bbc-europe',
    name: 'BBC Europe',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
    url: 'https://www.bbc.com/news/world/europe',
  },
  // Asia/China-Taiwan
  {
    id: 'bbc-asia',
    name: 'BBC Asia',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'china-taiwan' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    url: 'https://www.bbc.com/news/world/asia',
  },
];

// Bluesky sources from sources.md - using RSS endpoints
export const blueskySources: (Source & { feedUrl: string })[] = [
  // Global OSINT
  {
    id: 'bellingcat',
    name: 'Bellingcat',
    handle: '@bellingcat.com',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/bellingcat.com/rss',
    url: 'https://bsky.app/profile/bellingcat.com',
  },
  {
    id: 'isw',
    name: 'ISW',
    handle: '@thestudyofwar.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 95,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/thestudyofwar.bsky.social/rss',
    url: 'https://bsky.app/profile/thestudyofwar.bsky.social',
  },
  {
    id: 'osinttechnical',
    name: 'OSINTtechnical',
    handle: '@osinttechnical.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/osinttechnical.bsky.social/rss',
    url: 'https://bsky.app/profile/osinttechnical.bsky.social',
  },
  {
    id: 'noelreports',
    name: 'NOELREPORTS',
    handle: '@noelreports.com',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 75,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/noelreports.com/rss',
    url: 'https://bsky.app/profile/noelreports.com',
  },
  {
    id: 'wartranslated',
    name: 'WarTranslated',
    handle: '@wartranslated.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/wartranslated.bsky.social/rss',
    url: 'https://bsky.app/profile/wartranslated.bsky.social',
  },
  {
    id: 'aurora-intel',
    name: 'Aurora Intel',
    handle: '@auroraintel.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/auroraintel.bsky.social/rss',
    url: 'https://bsky.app/profile/auroraintel.bsky.social',
  },
  {
    id: 'ap-news',
    name: 'AP News',
    handle: '@apnews.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/apnews.com/rss',
    url: 'https://bsky.app/profile/apnews.com',
  },
  {
    id: 'aljazeera-bsky',
    name: 'Al Jazeera',
    handle: '@aljazeera.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 85,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/aljazeera.com/rss',
    url: 'https://bsky.app/profile/aljazeera.com',
  },
];

// All sources combined
export const allSources = [...rssSources, ...blueskySources];

// Get sources by region
export function getSourcesByRegion(region: WatchpointId) {
  if (region === 'all') return allSources;
  return allSources.filter((s) => s.region === region || s.region === 'all');
}

// Region keywords for classification
export const regionKeywords: Record<WatchpointId, string[]> = {
  'middle-east': [
    'iran', 'israel', 'gaza', 'palestinian', 'hamas', 'hezbollah',
    'lebanon', 'syria', 'iraq', 'saudi', 'yemen', 'houthi',
    'tehran', 'jerusalem', 'tel aviv', 'idf', 'irgc', 'strait of hormuz',
  ],
  'ukraine-russia': [
    'ukraine', 'russia', 'kyiv', 'moscow', 'crimea', 'donbas',
    'zelensky', 'putin', 'nato', 'kherson', 'bakhmut', 'avdiivka',
    'wagner', 'kursk', 'drone', 'frontline',
  ],
  'china-taiwan': [
    'taiwan', 'china', 'beijing', 'taipei', 'xi jinping',
    'south china sea', 'pla', 'strait', 'tsmc', 'semiconductors',
  ],
  'venezuela': [
    'venezuela', 'maduro', 'caracas', 'guaido', 'pdvsa',
    'colombian border', 'bolivarian',
  ],
  'us-domestic': [
    'washington', 'pentagon', 'white house', 'congress', 'senate',
    'biden', 'trump', 'state department', 'cia', 'fbi',
  ],
  all: [],
};

// Classify news item by region based on content
export function classifyRegion(title: string, content: string): WatchpointId {
  const text = `${title} ${content}`.toLowerCase();

  for (const [region, keywords] of Object.entries(regionKeywords)) {
    if (region === 'all') continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return region as WatchpointId;
    }
  }

  return 'all';
}

// Breaking news keywords
export const breakingKeywords = [
  'breaking', 'urgent', 'alert', 'just in', 'developing',
  'explosion', 'attack', 'strike', 'missile', 'rocket',
  'killed', 'casualties', 'invasion', 'war', 'emergency',
];

export function isBreakingNews(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return breakingKeywords.some((kw) => text.includes(kw));
}

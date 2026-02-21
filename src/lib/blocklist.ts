/**
 * SOURCE BLOCKLIST
 * =================
 * Sources we've evaluated and rejected. Don't re-add these.
 *
 * Format: { id, name, reason, dateBlocked }
 */

export const blockedSources = [
  {
    id: 'kathmandu-post-rss',
    name: 'Kathmandu Post',
    reason: 'Low value/credibility, worldwide aggregator miscategorized as Asia-specific, pollutes regional feeds with off-topic content',
    dateBlocked: '2025-01-19',
  },
  {
    id: 'dark-reading-rss',
    name: 'Dark Reading',
    reason: 'Cybersecurity only, no geopolitical relevance',
    dateBlocked: '2026-01-20',
  },
  {
    id: 'marginal-revolution-rss',
    name: 'Marginal Revolution',
    reason: 'Economics blog, off-topic',
    dateBlocked: '2026-01-20',
  },
  {
    id: 'bleeping-computer-rss',
    name: 'Bleeping Computer',
    reason: 'Tech news only, no geopolitical relevance',
    dateBlocked: '2026-01-20',
  },
  {
    id: 'socialistdogmom',
    name: 'Molly Conger',
    reason: 'Off-topic, user requested removal',
    dateBlocked: '2026-01-20',
  },
  {
    id: 'telegraph-rss',
    name: 'The Telegraph',
    reason: 'HTTP 403 - blocks RSS requests, paywall',
    dateBlocked: '2026-01-29',
  },
  {
    id: 'youtube-memritv',
    name: 'MEMRI TV',
    reason: 'YouTube channel ID invalid (404), channel may have been removed or ID changed',
    dateBlocked: '2026-01-29',
  },
  {
    id: 'potus-tracker',
    name: 'POTUS Tracker',
    reason: 'Account/channel no longer accessible',
    dateBlocked: '2026-01-30',
  },
  {
    id: 'telegram-militarylandnet',
    name: 'Military Land',
    reason: 'Account/channel no longer accessible',
    dateBlocked: '2026-01-30',
  },
  {
    id: 'gijn-rss',
    name: 'GIJN',
    reason: 'Cloudflare bot protection - requires JS challenge to access RSS',
    dateBlocked: '2026-01-30',
  },
  {
    id: 'politico-us-rss',
    name: 'Politico (US)',
    reason: 'Cloudflare bot protection - requires JS challenge to access RSS',
    dateBlocked: '2026-01-30',
  },
  {
    id: 'politico-eu-rss',
    name: 'Politico EU',
    reason: 'Cloudflare bot protection - requires JS challenge to access RSS',
    dateBlocked: '2026-01-30',
  },
  {
    id: 'euractiv-rss',
    name: 'Euractiv',
    reason: 'Cloudflare bot protection - requires JS challenge to access RSS',
    dateBlocked: '2026-01-30',
  },
  {
    id: 'nyt-ericlipton',
    name: 'Eric Lipton (NYT)',
    reason: 'Bluesky account deactivated (ericlipton.nytimes.com)',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'eric-lipton',
    name: 'Eric Lipton',
    reason: 'Duplicate of nyt-ericlipton, account deactivated',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'michael-mcfaul',
    name: 'Michael McFaul',
    reason: 'Wrong account - mcfaul.bsky.social is a pet rats account, not the former US Ambassador',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'mastodon-bendobrown',
    name: 'Benjamin Strick',
    reason: 'Inactive since July 2023, only 14 posts total',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'dan-lamothe',
    name: 'Dan Lamothe',
    reason: 'Duplicate of wapo-danlamothe (same person, same handle @danlamothe.bsky.social)',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'telegram-deepstateen',
    name: 'DeepState EN',
    reason: 'Telegram channel inactive for 636+ days, no posts since mid-2024',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'telegram-inikiforov',
    name: 'Illia Nikiforov (OSINTua)',
    reason: 'Telegram channel inactive for 705+ days, no posts since early 2024',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'bonnie-glaser',
    name: 'Bonnie Glaser (GMFUS)',
    reason: 'Bluesky account inactive since Aug 2025 (186+ days), last post 2025-08-05',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'wapo-gregmiller',
    name: 'Greg Miller (WaPo)',
    reason: 'Bluesky account inactive since Oct 2025 (101+ days), last post 2025-10-29',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'jodi-kantor',
    name: 'Jodi Kantor',
    reason: 'Bluesky account inactive since Nov 2025 (98+ days), last post 2025-11-01',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'dominic-casciani',
    name: 'Dominic Casciani',
    reason: 'Bluesky account inactive since Nov 2025 (95+ days), last post 2025-11-04',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'matthew-cappucci',
    name: 'Matthew Cappucci',
    reason: 'Bluesky account inactive since Oct 2025 (103+ days), last post 2025-10-28',
    dateBlocked: '2026-02-07',
  },
  {
    id: 'masha-gessen',
    name: 'Masha Gessen',
    reason: 'Bluesky account inactive since Oct 2025 (99+ days), last post 2025-10-31',
    dateBlocked: '2026-02-07',
  },
  // === Feb 2026 audit ===
  {
    id: 'nikkei-asia-rss',
    name: 'Nikkei Asia',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'csis-rss',
    name: 'CSIS',
    reason: 'RSS feed dormant 3641 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'cnn-world-rss',
    name: 'CNN World',
    reason: 'RSS feed fetch failed',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'cnn-us-rss',
    name: 'CNN US',
    reason: 'RSS feed fetch failed',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'nation-africa-rss',
    name: 'Nation Africa',
    reason: 'RSS feed returns HTTP 404',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'nti-rss',
    name: 'NTI',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'korea-herald-rss',
    name: 'Korea Herald',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'public-integrity-rss',
    name: 'Public Integrity',
    reason: 'RSS feed dormant 384 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'eenews-rss',
    name: 'E&E News',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'aviation-week-rss',
    name: 'Aviation Week',
    reason: 'RSS feed dormant 116 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'icsr-rss',
    name: 'ICSR',
    reason: 'RSS feed dormant 234 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'the-hindu-rss',
    name: 'The Hindu',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'hindustan-times-rss',
    name: 'Hindustan Times',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'tico-times-rss',
    name: 'Tico Times',
    reason: 'RSS feed returns HTTP 403',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'americas-quarterly-rss',
    name: 'Americas Quarterly',
    reason: 'RSS feed dormant 2317 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'rferl-rss',
    name: 'Radio Free Europe',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'cato-rss',
    name: 'Cato Institute',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'fas-rss',
    name: 'Federation of American Scientists',
    reason: 'RSS feed dormant 1102 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'asan-forum-rss',
    name: 'Asan Forum',
    reason: 'RSS feed dormant 91 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'state-dept-rss',
    name: 'State Department',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'fed-reserve-rss',
    name: 'Federal Reserve',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'the-nation-rss',
    name: 'The Nation',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'daily-sabah-rss',
    name: 'Daily Sabah',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'scmp-china-rss',
    name: 'SCMP China',
    reason: 'RSS feed fetch failed',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'telegram-idfofficial',
    name: 'IDF Official',
    reason: 'Telegram channel has no public posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'telegram-iranintlen',
    name: 'Iran International English',
    reason: 'Telegram channel dormant 844 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'telegram-tasnim',
    name: 'Tasnim News Agency',
    reason: 'Telegram channel dormant 723 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'telegram-sabreen',
    name: 'Sabreen News',
    reason: 'Telegram channel dormant 859 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'sipri-rss',
    name: 'SIPRI',
    reason: 'RSS feed returns no parseable posts',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'arms-control-assoc-rss',
    name: 'Arms Control Association',
    reason: 'RSS feed fetch failed',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'us-state-dept',
    name: 'US State Department',
    reason: 'Bluesky account dormant 121 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'taiwan-monitor',
    name: 'Taiwan Security Monitor',
    reason: 'Bluesky account dormant 93 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'ukraine-air-alerts',
    name: 'Ukraine Air Raid Alert Map',
    reason: 'Bluesky account dormant 94 days',
    dateBlocked: '2026-02-20',
  },
  {
    id: 'jeremy-page',
    name: 'Jeremy Page',
    reason: 'Bluesky account dormant 93 days',
    dateBlocked: '2026-02-20',
  },
];

// Quick lookup
export const blockedSourceIds = new Set(blockedSources.map(s => s.id));


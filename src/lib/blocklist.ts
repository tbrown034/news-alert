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
];

// Quick lookup
export const blockedSourceIds = new Set(blockedSources.map(s => s.id));


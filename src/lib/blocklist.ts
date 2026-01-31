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
];

// Quick lookup
export const blockedSourceIds = new Set(blockedSources.map(s => s.id));

/**
 * CONTENT KEYWORD BLOCKLIST
 * ==========================
 * Posts containing these keywords are filtered out.
 * Used to remove sports, entertainment, and other off-topic content.
 */
export const blockedKeywords: RegExp[] = [
  // Sports - General
  /\bbasketball\b/i,
  /\bnba\b/i,
  /\bnfl\b/i,
  /\bfootball\s+(game|season|player|team|coach)\b/i,
  /\bmlb\b/i,
  /\bnhl\b/i,
  /\bsuper\s*bowl\b/i,
  /\bworld\s+series\b/i,
  /\bplayoffs?\b/i,
  /\btouchdown\b/i,
  /\bhome\s*run\b/i,
  /\bquarterback\b/i,
  /\bwide\s+receiver\b/i,
  /\brunning\s+back\b/i,
  // NFL Teams
  /\bpackers\b/i,
  /\bpatriots\b/i,
  /\bcowboys\b/i,
  /\bsteelers\b/i,
  /\b49ers\b/i,
  /\bseahawks\b/i,
  /\braiders\b/i,
  /\bchiefs\b/i,
  /\bbroncos\b/i,
  /\bbears\b/i,
  /\blions\b/i,
  /\bvikings\b/i,
  /\beagles\b/i,
  /\bgiants\b/i,
  /\bredskins\b/i,
  /\bcommanders\b/i,
  /\bravens\b/i,
  /\bbengals\b/i,
  /\bbrowns\b/i,
  /\bbills\b/i,
  /\bdolphins\b/i,
  /\bjets\b/i,
  /\btexans\b/i,
  /\bcolts\b/i,
  /\bjaguars\b/i,
  /\btitans\b/i,
  /\bchargers\b/i,
  /\bcardinals\b/i,
  /\brams\b/i,
  /\bfalcons\b/i,
  /\bpanthers\b/i,
  /\bsaints\b/i,
  /\bbuccaneers\b/i,
  /\bbucs\b/i,
];

/**
 * Check if a post should be filtered based on blocked keywords
 * @param text - The post title and/or content to check
 * @returns true if the post should be filtered out
 */
export function shouldFilterPost(text: string): boolean {
  if (!text) return false;
  return blockedKeywords.some(pattern => pattern.test(text));
}

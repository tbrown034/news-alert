import { TieredSource } from '@/lib/sources-clean';

// Feed platforms (power the live wire + activity detection)
export const FEED_PLATFORMS = new Set(['bluesky', 'telegram', 'mastodon']);
// News platforms (mainstream news area)
export const NEWS_PLATFORMS = new Set(['rss', 'reddit', 'youtube']);

// Platform badge colors
export function platformBadgeClass(platform: string): string {
  switch (platform) {
    case 'bluesky': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'telegram': return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400';
    case 'mastodon': return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400';
    case 'rss': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    case 'reddit': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400';
    case 'youtube': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}

export const regionDisplayNames: Record<string, string> = {
  'us': 'United States',
  'middle-east': 'Middle East',
  'europe-russia': 'Europe & Russia',
  'latam': 'Latin America',
  'asia': 'Asia-Pacific',
  'all': 'Global',
  'seismic': 'Seismic',
};

// Baseline calculation (mirrors activityDetection.ts logic)
const CONSERVATIVE_DEFAULT = 3;
function isMeasuredValue(n: number): boolean {
  return n !== Math.floor(n);
}

export interface RegionBaseline {
  region: string;
  feedSources: number;
  totalPpd: number;
  trustedPpd: number;
  baseline6h: number;
}

export function calculateRegionBaselines(allSources: TieredSource[]): RegionBaseline[] {
  const feedSources = allSources.filter(s => FEED_PLATFORMS.has(s.platform));
  const regionMap = new Map<string, { count: number; totalPpd: number; trustedPpd: number }>();

  for (const s of feedSources) {
    const r = s.region;
    if (!regionMap.has(r)) regionMap.set(r, { count: 0, totalPpd: 0, trustedPpd: 0 });
    const entry = regionMap.get(r)!;
    entry.count++;
    entry.totalPpd += s.postsPerDay || 0;
    entry.trustedPpd += isMeasuredValue(s.postsPerDay) ? s.postsPerDay : CONSERVATIVE_DEFAULT;
  }

  const results: RegionBaseline[] = [];
  const order = ['us', 'middle-east', 'europe-russia', 'latam', 'asia', 'africa', 'all', 'seismic'];

  for (const region of order) {
    const entry = regionMap.get(region);
    if (!entry) continue;
    results.push({
      region,
      feedSources: entry.count,
      totalPpd: Math.round(entry.totalPpd * 10) / 10,
      trustedPpd: Math.round(entry.trustedPpd * 10) / 10,
      baseline6h: Math.round(entry.trustedPpd / 4),
    });
  }

  return results;
}

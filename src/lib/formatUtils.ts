import { WatchpointId } from '@/types';

// Source type colors - each category visually distinct
export const sourceTypeColors: Record<string, string> = {
  official: 'text-[10px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700',
  'news-org': 'text-[10px] uppercase tracking-wider font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950',
  osint: 'text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950',
  reporter: 'text-[10px] uppercase tracking-wider font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950',
  analyst: 'text-[10px] uppercase tracking-wider font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950',
  aggregator: 'text-[10px] uppercase tracking-wider font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950',
  ground: 'text-[10px] uppercase tracking-wider font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950',
  bot: 'text-[10px] uppercase tracking-wider font-medium italic text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800',
};

// Platform display names
export const platformNames: Record<string, string> = {
  bluesky: 'Bluesky',
  rss: 'RSS',
  telegram: 'Telegram',
  reddit: 'Reddit',
  youtube: 'YouTube',
  mastodon: 'Mastodon',
};

// Human-readable source type labels
export const sourceTypeLabels: Record<string, string> = {
  official: 'Official',
  'news-org': 'News Org',
  osint: 'OSINT',
  reporter: 'Reporter',
  analyst: 'Analyst',
  aggregator: 'Aggregator',
  ground: 'Ground',
  bot: 'Bot',
};

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);

  // Handle future timestamps (clock drift, timezone issues)
  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Region badge colors — subtly tinted per region (used by NewsCard, BriefingCard)
export const regionBadges: Record<WatchpointId, { label: string; color: string }> = {
  'us': { label: 'US', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
  'latam': { label: 'AMERICAS', color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
  'middle-east': { label: 'MIDEAST', color: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300' },
  'europe-russia': { label: 'EUR', color: 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300' },
  'asia': { label: 'ASIA', color: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300' },
  'africa': { label: 'AFRICA', color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
  'seismic': { label: 'SEISMIC', color: 'bg-elevated-muted text-elevated' },
  'all': { label: 'GLOBAL', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
};

// Region accent colors — used for card accent lines, matching ActivityChart palette
export const regionAccentColors: Record<string, string> = {
  'us': '#3b82f6',
  'latam': '#22c55e',
  'middle-east': '#f97316',
  'europe-russia': '#a855f7',
  'asia': '#06b6d4',
  'africa': '#eab308',
  'all': '#6b7280',
};

// Region badge colors — Tailwind colored variant (used by EditorialCard)
export const editorialRegionBadges: Record<WatchpointId, { label: string; color: string }> = {
  'us': { label: 'US', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  'latam': { label: 'AMERICAS', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  'middle-east': { label: 'MIDEAST', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  'europe-russia': { label: 'EUR', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  'asia': { label: 'ASIA', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  'africa': { label: 'AFRICA', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  'seismic': { label: 'SEISMIC', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  'all': { label: 'GLOBAL', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
};

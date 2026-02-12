import { WatchpointId } from '@/types';

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

// Region badge colors — neutral, CSS variable-based (used by NewsCard, BriefingCard)
export const regionBadges: Record<WatchpointId, { label: string; color: string }> = {
  'us': { label: 'US', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
  'latam': { label: 'AMERICAS', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
  'middle-east': { label: 'MIDEAST', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
  'europe-russia': { label: 'EUR', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
  'asia': { label: 'ASIA', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
  'africa': { label: 'AFRICA', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
  'seismic': { label: 'SEISMIC', color: 'bg-[var(--color-elevated-muted)] text-[var(--color-elevated)]' },
  'all': { label: 'GLOBAL', color: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-light)]' },
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

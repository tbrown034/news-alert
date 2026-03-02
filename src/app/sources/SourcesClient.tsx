'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { PlatformIcon, platformBadgeStyles } from '@/components/PlatformIcon';
import { regionBadges, sourceTypeColors, sourceTypeLabels, platformNames } from '@/lib/formatUtils';
import type { PublicSource } from './page';
import type { WatchpointId } from '@/types';

const CATEGORIES = ['all', 'news', 'intelligence', 'community'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  news: 'News',
  intelligence: 'Intelligence',
  community: 'Community',
};

const REGIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'us', label: 'US' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'europe-russia', label: 'Europe & Russia' },
  { value: 'asia', label: 'Asia' },
  { value: 'latam', label: 'Latin America' },
  { value: 'africa', label: 'Africa' },
  { value: 'global', label: 'Global' },
];

const PLATFORMS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'rss', label: 'RSS' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'mastodon', label: 'Mastodon' },
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors ${
        active
          ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
          : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border-[var(--border-light)] hover:text-[var(--foreground)]'
      }`}
    >
      {label}
    </button>
  );
}

export default function SourcesClient({ sources }: { sources: PublicSource[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [region, setRegion] = useState('all');
  const [platform, setPlatform] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sources.filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (region === 'global') {
        if (s.region !== 'all') return false;
      } else if (region !== 'all') {
        if (s.region !== region) return false;
      }
      if (platform !== 'all' && s.platform !== platform) return false;
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchHandle = s.handle?.toLowerCase().includes(q);
        if (!matchName && !matchHandle) return false;
      }
      return true;
    });
  }, [sources, search, category, region, platform]);

  const categoryCounts = useMemo(() => {
    const counts = { news: 0, intelligence: 0, community: 0 };
    filtered.forEach((s) => counts[s.category]++);
    return counts;
  }, [filtered]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((s) => {
      counts[s.platform] = (counts[s.platform] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  const hasActiveFilters = search || category !== 'all' || region !== 'all' || platform !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setRegion('all');
    setPlatform('all');
  };

  // Group by category when no category filter is active
  const grouped = useMemo(() => {
    if (category !== 'all') return null;
    const groups: Record<string, PublicSource[]> = { news: [], intelligence: [], community: [] };
    filtered.forEach((s) => groups[s.category].push(s));
    return groups;
  }, [filtered, category]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Pulse</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-serif font-semibold text-[var(--foreground)] tracking-tight">Sources</h1>
              <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-light)]">
                {sources.length}
              </span>
            </div>
            <div className="w-12" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-light)]" />
          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-[var(--background-card)] border border-[var(--border-card)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground-light)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground-muted)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-light)] hover:text-[var(--foreground)]"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Category */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>

          {/* Region + Platform */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {REGIONS.map((r) => (
              <Chip key={r.value} label={r.label} active={region === r.value} onClick={() => setRegion(r.value)} />
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {PLATFORMS.map((p) => (
              <Chip key={p.value} label={p.label} active={platform === p.value} onClick={() => setPlatform(p.value)} />
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="text-sm text-[var(--foreground-muted)]">
          <p>
            {filtered.length} source{filtered.length !== 1 ? 's' : ''} across{' '}
            {Object.keys(platformCounts).length} platform{Object.keys(platformCounts).length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-[var(--foreground-light)]">
            <span>{categoryCounts.news} News</span>
            <span className="text-[var(--border-light)]">&middot;</span>
            <span>{categoryCounts.intelligence} Intelligence</span>
            <span className="text-[var(--border-light)]">&middot;</span>
            <span>{categoryCounts.community} Community</span>
          </div>
        </div>

        {/* Source list */}
        {filtered.length === 0 ? (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border-card)] p-8 text-center">
            <p className="text-sm text-[var(--foreground-light)] mb-3">No sources match your search</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-[var(--color-elevated)] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : grouped ? (
          // Grouped view (no category filter active)
          <>
            {(['news', 'intelligence', 'community'] as const).map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="text-xs font-semibold text-[var(--foreground-light)] uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[cat]}
                    <span className="ml-2 text-[var(--foreground-light)] font-normal">{items.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {items.map((s) => (
                      <SourceRow key={s.id} source={s} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          // Flat list (category filter active)
          <div className="space-y-2">
            {filtered.map((s) => (
              <SourceRow key={s.id} source={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SourceRow({ source }: { source: PublicSource }) {
  const regionBadge = regionBadges[source.region as WatchpointId] || regionBadges['all'];
  const typeStyle = sourceTypeColors[source.sourceType] || sourceTypeColors.osint;
  const typeLabel = sourceTypeLabels[source.sourceType] || source.sourceType;
  const platformBadge = platformBadgeStyles[source.platform] || platformBadgeStyles.rss;
  const platformName = platformNames[source.platform] || source.platform;

  return (
    <Link
      href={`/source/${source.id}`}
      className="flex items-center gap-3 p-3 bg-[var(--background-card)] border border-[var(--border-card)] rounded-xl hover:bg-[var(--background-secondary)] transition-colors group"
    >
      {/* Platform icon */}
      <span className={`flex-shrink-0 ${platformBadge.split(' ').find((c: string) => c.startsWith('text-')) || 'text-[var(--foreground-muted)]'}`}>
        <PlatformIcon platform={source.platform} className="w-5 h-5" />
      </span>

      {/* Name + handle */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--foreground)]">
            {source.name}
          </span>
          {source.isStateSponsored && (
            <BuildingLibraryIcon className="w-3.5 h-3.5 text-[var(--color-elevated)] flex-shrink-0" title="State-sponsored media" />
          )}
        </div>
        {source.handle && (
          <p className="text-xs text-[var(--foreground-light)] truncate">{source.handle}</p>
        )}
      </div>

      {/* Badges */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-md ${typeStyle}`}>
          {typeLabel}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md ${regionBadge.color}`}>
          {regionBadge.label}
        </span>
      </div>

      {/* Mobile: just platform name */}
      <span className="sm:hidden text-[10px] text-[var(--foreground-light)] flex-shrink-0">
        {platformName}
      </span>
    </Link>
  );
}

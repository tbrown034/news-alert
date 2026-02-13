'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline';
import { WatchpointId, NewsItem } from '@/types';
import { PlatformIcon, platformColors } from '@/components/PlatformIcon';

// =============================================================================
// TYPES
// =============================================================================

interface MainstreamSourceGroup {
  sourceId: string;
  sourceName: string;
  sourceRegion: WatchpointId;
  articles: NewsItem[];
  mostRecentTimestamp: string;
  articleCountInWindow: number;
}

interface MainstreamResponse {
  sources: MainstreamSourceGroup[];
  totalSources: number;
  totalArticles: number;
  fetchedAt: string;
  fromCache: boolean;
}

interface ArticleWithSource extends Omit<NewsItem, 'timestamp'> {
  timestamp: string;
  _sourceName: string;
  _sourceRegion: WatchpointId;
  _sourcePlatform: string;
}

// =============================================================================
// CONFIG
// =============================================================================

const REGIONS: { id: WatchpointId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'us', label: 'US' },
  { id: 'latam', label: 'LATAM' },
  { id: 'middle-east', label: 'Middle East' },
  { id: 'europe-russia', label: 'Europe & Russia' },
  { id: 'asia', label: 'Asia-Pacific' },
];

const PAGE_SIZE = 50;
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// =============================================================================
// HELPERS
// =============================================================================

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>\s*<p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getTimeBucket(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 5) return 'just-now';
  if (diffMins < 60) return 'minutes';
  if (diffMins < 360) return 'hours';
  return 'older';
}

const BUCKET_LABELS: Record<string, string> = {
  'just-now': 'Just Now',
  'minutes': 'Minutes Ago',
  'hours': 'Earlier Today',
  'older': 'Yesterday & Older',
};

function getThumbnail(article: ArticleWithSource): string | null {
  if (!article.media || article.media.length === 0) return null;
  for (const m of article.media) {
    if (m.thumbnail) return m.thumbnail;
    if (m.type === 'image' && m.url) return m.url;
  }
  return null;
}

function flattenAndSort(groups: MainstreamSourceGroup[]): ArticleWithSource[] {
  const articles: ArticleWithSource[] = [];
  for (const group of groups) {
    for (const article of group.articles) {
      articles.push({
        ...article,
        timestamp: typeof article.timestamp === 'string' ? article.timestamp : new Date(article.timestamp).toISOString(),
        _sourceName: group.sourceName,
        _sourceRegion: group.sourceRegion,
        _sourcePlatform: article.source?.platform || 'rss',
      });
    }
  }
  articles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return articles;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NewsPage() {
  const [articles, setArticles] = useState<ArticleWithSource[]>([]);
  const [pendingArticles, setPendingArticles] = useState<ArticleWithSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<WatchpointId>('all');
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [totalSources, setTotalSources] = useState(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const isInitialFetch = useRef(true);

  const fetchNews = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch('/api/mainstream?region=all&hours=24&topN=5');
      if (!response.ok) throw new Error('Failed to fetch news');
      const data: MainstreamResponse = await response.json();

      const flattened = flattenAndSort(data.sources);
      setTotalSources(data.totalSources);
      setFetchedAt(data.fetchedAt);

      if (isInitialFetch.current || !isBackground) {
        setArticles(flattened);
        setPendingArticles([]);
        isInitialFetch.current = false;
      } else {
        const existingIds = new Set(articles.map(a => a.id));
        const newArticles = flattened.filter(a => !existingIds.has(a.id));
        if (newArticles.length > 0) {
          setPendingArticles(prev => {
            const pendingIds = new Set(prev.map(a => a.id));
            const uniqueNew = newArticles.filter(a => !pendingIds.has(a.id));
            return [...uniqueNew, ...prev];
          });
        }
      }
    } catch (err) {
      if (!isBackground) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  }, [articles]);

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => fetchNews(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchNews]);

  const showPending = () => {
    setArticles(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const unique = pendingArticles.filter(a => !existingIds.has(a.id));
      return [...unique, ...prev];
    });
    setPendingArticles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = selectedRegion === 'all'
    ? articles
    : articles.filter(a => a._sourceRegion === selectedRegion || a.region === selectedRegion);

  const visible = filtered.slice(0, displayLimit);
  const hasMore = filtered.length > displayLimit;

  // Group articles by time bucket for section dividers
  let lastBucket = '';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Pulse</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <NewspaperIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
                {!isLoading && articles.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-[pulse-soft_3s_ease-in-out_infinite]" />
                )}
              </div>
              <h1 className="text-base font-serif font-semibold text-[var(--foreground)] tracking-tight">News Wire</h1>
            </div>
            <button
              onClick={() => fetchNews()}
              disabled={isLoading}
              className="p-2 text-[var(--foreground-light)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              title="Refresh headlines"
            >
              <ArrowPathIcon className={`w-4.5 h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-12">
        {/* Region tabs + stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {REGIONS.map(r => (
              <button
                key={r.id}
                onClick={() => { setSelectedRegion(r.id); setDisplayLimit(PAGE_SIZE); }}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedRegion === r.id
                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                    : 'text-[var(--foreground-light)] hover:text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/[0.06]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {fetchedAt && !isLoading && (
            <div className="flex items-center gap-3 text-[12px] text-[var(--foreground-light)] shrink-0 px-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-light)]" />
                <span className="text-[var(--foreground-muted)] tabular-nums">{filtered.length}</span> articles
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-light)]" />
                <span className="text-[var(--foreground-muted)] tabular-nums">{totalSources}</span> sources
              </span>
              <span className="text-[var(--foreground-light)]">{formatTimeAgo(fetchedAt)}</span>
            </div>
          )}
        </div>

        {/* New articles banner */}
        {pendingArticles.length > 0 && (
          <button
            onClick={showPending}
            className="w-full mb-4 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-xl hover:bg-emerald-500/12 transition-all duration-200 cursor-pointer group"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:animate-ping" />
              {pendingArticles.length} new {pendingArticles.length === 1 ? 'article' : 'articles'} available
            </span>
          </button>
        )}

        {/* Loading skeleton */}
        {isLoading && articles.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 bg-[var(--background-card)] border border-[var(--border-card)] rounded-xl p-4 sm:px-5"
                style={{ opacity: 1 - i * 0.08, animationDelay: `${i * 60}ms` }}
              >
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--border)] animate-pulse" />
                    <div className="h-3 w-24 rounded bg-[var(--border)] animate-pulse" />
                    <div className="h-3 w-12 rounded bg-[var(--border-light)] animate-pulse" />
                  </div>
                  <div className="h-4 w-full rounded bg-[var(--border)] animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-[var(--border-light)] animate-pulse" />
                </div>
                <div className="hidden sm:block w-28 h-20 rounded-lg bg-[var(--border-light)] animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-medium text-sm">Failed to load news</p>
                <p className="text-red-400/50 text-xs mt-0.5 truncate">{error}</p>
              </div>
              <button
                onClick={() => fetchNews()}
                className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Articles with time bucket dividers */}
        {visible.length > 0 && (
          <div className="space-y-2">
            {visible.map((article, index) => {
              const bucket = getTimeBucket(article.timestamp);
              const showDivider = bucket !== lastBucket;
              lastBucket = bucket;

              return (
                <div key={article.id}>
                  {showDivider && index > 0 && (
                    <div className="flex items-center gap-3 py-3 mt-1">
                      <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-light)] to-transparent" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--foreground-light)]">
                        {BUCKET_LABELS[bucket] || bucket}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-l from-[var(--border-light)] to-transparent" />
                    </div>
                  )}
                  <ArticleCard article={article} index={index} />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--background-secondary)] mb-4">
              <NewspaperIcon className="w-8 h-8 text-[var(--foreground-light)]" />
            </div>
            <p className="text-[var(--foreground-muted)] text-sm font-medium">No articles found</p>
            <p className="text-[var(--foreground-light)] text-xs mt-1">Try selecting a different region</p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            className="w-full mt-4 py-3 text-sm font-medium text-[var(--foreground-light)] bg-[var(--background-secondary)]/50 border border-[var(--border-light)] rounded-xl hover:bg-[var(--background-secondary)] hover:text-[var(--foreground-muted)] hover:border-[var(--border)] transition-all duration-200 cursor-pointer"
          >
            Load more ({filtered.length - displayLimit} remaining)
          </button>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// ARTICLE CARD
// =============================================================================

function ArticleCard({ article, index }: { article: ArticleWithSource; index: number }) {
  const title = stripHtml(article.title || article.content?.slice(0, 120) || 'Untitled');
  const rawSnippet = article.content && article.content !== article.title
    ? stripHtml(article.content)
    : null;
  const snippet = rawSnippet && rawSnippet !== title
    ? rawSnippet.slice(0, 140) + (rawSnippet.length > 140 ? '...' : '')
    : null;
  const thumb = getThumbnail(article);
  const platform = article._sourcePlatform || 'rss';
  const isRecent = Date.now() - new Date(article.timestamp).getTime() < 5 * 60 * 1000;

  return (
    <a
      href={article.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 bg-[var(--background-card)] border border-[var(--border-card)] rounded-xl hover:border-[var(--border)] hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.2)] transition-all duration-200 group p-4 sm:px-5 nw-card-enter"
      style={{ animationDelay: `${Math.min(index, 15) * 30}ms` }}
    >
      {/* Left accent for very recent articles */}
      {isRecent && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-emerald-500/60" />
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        {/* Source row */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`flex-shrink-0 ${platformColors[platform] || platformColors.rss}`}>
            <PlatformIcon platform={platform} className="w-3 h-3" />
          </span>
          <span className="text-[12px] font-semibold text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors truncate">
            {article._sourceName}
          </span>
          <span className="text-[11px] text-[var(--foreground-light)] shrink-0 tabular-nums">
            {formatTimeAgo(article.timestamp)}
          </span>
          <RegionBadge region={article._sourceRegion} />
        </div>

        {/* Headline */}
        <h2 className="text-[15px] sm:text-base font-serif font-medium text-[var(--foreground)] leading-snug group-hover:text-[var(--foreground)] transition-colors line-clamp-2">
          {title}
        </h2>

        {/* Snippet */}
        {snippet && (
          <p className="mt-1 text-[13px] text-[var(--foreground-light)] leading-relaxed line-clamp-2">
            {snippet}
          </p>
        )}

        {/* External link indicator */}
        <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--foreground-light)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          <span>Read article</span>
        </div>
      </div>

      {/* Thumbnail */}
      {thumb && (
        <div className="hidden sm:block w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--background-secondary)] self-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        </div>
      )}
    </a>
  );
}

// =============================================================================
// REGION BADGE
// =============================================================================

const regionBadgeStyles: Record<string, string> = {
  'us': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'latam': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'middle-east': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'europe-russia': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'asia': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  'africa': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const regionLabels: Record<string, string> = {
  'us': 'US',
  'latam': 'LATAM',
  'middle-east': 'Mideast',
  'europe-russia': 'Europe',
  'asia': 'Asia',
  'africa': 'Africa',
};

function RegionBadge({ region }: { region: WatchpointId }) {
  if (region === 'all' || region === 'seismic') return null;
  return (
    <span className={`ml-auto text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${regionBadgeStyles[region] || 'text-[var(--foreground-light)] bg-[var(--foreground)]/5 border-[var(--border-light)]'}`}>
      {regionLabels[region] || region}
    </span>
  );
}

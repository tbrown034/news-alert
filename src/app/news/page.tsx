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
              <NewspaperIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
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
                className={`px-3 py-1.5 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === r.id
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--foreground-light)] hover:text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/[0.04]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {fetchedAt && !isLoading && (
            <div className="flex items-center gap-4 text-[12px] text-[var(--foreground-light)] shrink-0 px-0.5">
              <span><span className="text-[var(--foreground-muted)]">{filtered.length}</span> articles</span>
              <span><span className="text-[var(--foreground-muted)]">{totalSources}</span> sources</span>
              <span>{formatTimeAgo(fetchedAt)}</span>
            </div>
          )}
        </div>

        {/* New articles banner */}
        {pendingArticles.length > 0 && (
          <button
            onClick={showPending}
            className="w-full mb-4 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/8 border border-blue-500/15 rounded-xl hover:bg-blue-500/12 transition-colors cursor-pointer"
          >
            {pendingArticles.length} new {pendingArticles.length === 1 ? 'article' : 'articles'} available
          </button>
        )}

        {/* Loading */}
        {isLoading && articles.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--foreground-muted)] rounded-full animate-spin" />
              <span className="text-sm text-[var(--foreground-light)]">Loading news wire...</span>
            </div>
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

        {/* Articles */}
        {visible.length > 0 && (
          <div className="space-y-2">
            {visible.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <NewspaperIcon className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
            <p className="text-[var(--foreground-light)] text-sm">No articles found for this region</p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            className="w-full mt-4 py-3 text-sm font-medium text-[var(--foreground-light)] bg-[var(--background-secondary)]/50 border border-[var(--border-light)] rounded-xl hover:bg-[var(--background-secondary)] hover:text-[var(--foreground-muted)] transition-colors cursor-pointer"
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

function ArticleCard({ article }: { article: ArticleWithSource }) {
  const title = stripHtml(article.title || article.content?.slice(0, 120) || 'Untitled');
  const rawSnippet = article.content && article.content !== article.title
    ? stripHtml(article.content)
    : null;
  const snippet = rawSnippet && rawSnippet !== title
    ? rawSnippet.slice(0, 140) + (rawSnippet.length > 140 ? '...' : '')
    : null;
  const thumb = getThumbnail(article);
  const platform = article._sourcePlatform || 'rss';

  return (
    <a
      href={article.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 bg-[var(--background-card)] border border-[var(--border-card)] rounded-xl hover:border-[var(--border)] transition-all group p-4 sm:px-5"
    >
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
          <span className="text-[11px] text-[var(--foreground-light)] shrink-0">
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
        <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--foreground-light)] opacity-0 group-hover:opacity-100 transition-opacity">
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
            className="w-full h-full object-cover"
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

const regionColors: Record<string, string> = {
  'us': 'text-indigo-500 dark:text-indigo-400',
  'latam': 'text-emerald-500 dark:text-emerald-400',
  'middle-east': 'text-amber-500 dark:text-amber-400',
  'europe-russia': 'text-sky-500 dark:text-sky-400',
  'asia': 'text-rose-500 dark:text-rose-400',
};

const regionLabels: Record<string, string> = {
  'us': 'US',
  'latam': 'LATAM',
  'middle-east': 'Mideast',
  'europe-russia': 'Europe',
  'asia': 'Asia',
};

function RegionBadge({ region }: { region: WatchpointId }) {
  if (region === 'all' || region === 'seismic') return null;
  return (
    <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wide ${regionColors[region] || 'text-[var(--foreground-light)]'}`}>
      {regionLabels[region] || region}
    </span>
  );
}

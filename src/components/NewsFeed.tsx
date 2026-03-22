'use client';

import { useState, useEffect, useRef, useMemo, useCallback, useTransition, memo } from 'react';
import { NewsItem, WatchpointId } from '@/types';
import { NewsCard } from './NewsCard';
import { EditorialCard, isEditorialItem } from './EditorialCard';
import { BriefingCard } from './BriefingCard';
import { ArrowPathIcon, ExclamationTriangleIcon, GlobeAltIcon, ListBulletIcon, ChevronDownIcon, SignalIcon, FireIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { regionDisplayNames } from '@/lib/regionDetection';
import Link from 'next/link';
import { getTrendingKeywords } from '@/lib/trendingKeywords';

interface ActivityData {
  level: string;
  count: number;
  baseline?: number;
  multiplier?: number;
  vsNormal?: string;
  percentChange?: number;
}

// Tab selection type
type SelectedTab = WatchpointId;

interface NewsFeedProps {
  items: NewsItem[];
  selectedWatchpoint: WatchpointId;
  onSelectWatchpoint?: (id: WatchpointId) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  activity?: Record<string, ActivityData>;
  error?: string | null;
  onRetry?: () => void;
  lastUpdated?: string | null;
  loadTimeMs?: number | null;
  // Live update settings
  pendingCount?: number;
  onShowPending?: () => void;
  autoUpdate?: boolean;
  onToggleAutoUpdate?: () => void;
  // Stats for header
  totalPosts?: number;
  uniqueSources?: number;
  hoursWindow?: number;
  // All items for trending analysis (not paginated)
  allItemsForTrending?: NewsItem[];
  // All items for accurate tab counts (items prop may be paginated for rendering)
  allItems?: NewsItem[];
}

// Skeleton loader for news cards
function NewsCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="px-4 py-4 border-b border-border-light"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col gap-3">
        <div className="space-y-2">
          <div className="h-4 skeleton-shimmer rounded w-[90%]" />
          <div className="h-4 skeleton-shimmer rounded w-[70%]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 skeleton-shimmer rounded" />
          <div className="h-3 skeleton-shimmer rounded w-24" />
          <div className="h-3 skeleton-shimmer rounded w-16" />
          <div className="h-3 skeleton-shimmer rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-4 my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">Failed to load feed</p>
          <p className="text-red-500 dark:text-red-400 text-xs mt-1 truncate">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-critical-muted text-critical hover:opacity-80 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Tab configuration
type TabId = WatchpointId;

interface TabConfig {
  id: TabId;
  label: string;
  alwaysVisible?: boolean; // Show on all screen sizes
  minScreen?: 'sm' | 'md' | 'lg'; // Minimum screen size to show inline
}

// Primary tabs shown inline, secondary tabs in "More" dropdown
const primaryTabs: TabConfig[] = [
  { id: 'all', label: 'All', alwaysVisible: true },
  { id: 'us', label: 'US', alwaysVisible: true },
  { id: 'middle-east', label: 'Middle East', alwaysVisible: true },
  { id: 'europe-russia', label: 'Europe', alwaysVisible: true },
];

const secondaryTabs: TabConfig[] = [
  { id: 'latam', label: 'Latin America' },
  { id: 'asia', label: 'Asia-Pacific' },
  { id: 'africa', label: 'Africa' },
];

const allTabs: TabConfig[] = [...primaryTabs, ...secondaryTabs];

// Format actual time for last updated (e.g., "3:45 PM")
function formatActualTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const NewsFeed = memo(function NewsFeed({
  items,
  selectedWatchpoint,
  onSelectWatchpoint,
  isLoading,
  onRefresh,
  activity,
  error,
  onRetry,
  lastUpdated,
  loadTimeMs,
  totalPosts,
  uniqueSources,
  hoursWindow = 6,
  allItemsForTrending,
  allItems,
}: NewsFeedProps) {
  // Track previously seen item IDs to animate new ones
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const [regionalExpanded, setRegionalExpanded] = useState(false);
  const [showFeedStats, setShowFeedStats] = useState(false);
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('all'); // Local tab state, defaults to All
  const [searchFilter, setSearchFilter] = useState('');
  const isInitialLoadRef = useRef(true);

  // useTransition for smooth region switching - keeps UI responsive during filtering
  const [isPending, startTransition] = useTransition();

  // Track items that existed when user first loaded the page (for "new since arrival" divider)
  const [initialSessionIds, setInitialSessionIds] = useState<Set<string> | null>(null);

  // Handle tab selection - update local and parent state with transition for smooth UX
  const handleTabSelect = useCallback((tabId: TabId) => {
    // Update visual selection immediately
    setSelectedTab(tabId);
    // Defer the expensive filtering to keep UI responsive
    startTransition(() => {
      if (onSelectWatchpoint) {
        onSelectWatchpoint(tabId);
      }
    });
  }, [onSelectWatchpoint]);

  // Sync local tab state with parent's selectedWatchpoint (e.g., when map region is clicked)
  useEffect(() => {
    if (selectedWatchpoint !== selectedTab) {
      setSelectedTab(selectedWatchpoint);
    }
  }, [selectedWatchpoint]);


  const filteredItems = useMemo(() => {
    let result = items;
    // Apply region filter
    if (selectedTab !== 'all') {
      result = result.filter((item) => item.region === selectedTab);
    }
    // Apply search filter
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      result = result.filter((item) => {
        const text = `${item.title || ''} ${item.content || ''} ${item.source?.name || ''}`.toLowerCase();
        return text.includes(q);
      });
    }
    return result;
  }, [items, selectedTab, searchFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [filteredItems]);

  // Get top trending keywords for display (only for "All" view)
  const trendingKeywords = useMemo(() => {
    if (selectedTab !== 'all' || items.length === 0) return [];
    const result = getTrendingKeywords(items, 4);
    return result.keywords; // Keep full objects with count
  }, [items, selectedTab]);

  // Feed stats: platform + source type breakdowns
  const feedStats = useMemo(() => {
    const source = allItems || items;
    const platformCounts: Record<string, { posts: number; sources: Set<string> }> = {};
    const typeCounts: Record<string, number> = {};

    for (const item of source) {
      if (item.id.startsWith('editorial-')) continue;
      const platform = item.source?.platform || 'unknown';
      const sourceType = item.source?.sourceType || 'unknown';

      if (!platformCounts[platform]) {
        platformCounts[platform] = { posts: 0, sources: new Set() };
      }
      platformCounts[platform].posts++;
      platformCounts[platform].sources.add(item.source.id);

      typeCounts[sourceType] = (typeCounts[sourceType] || 0) + 1;
    }

    // Convert to sorted arrays
    const platforms = Object.entries(platformCounts)
      .map(([name, { posts, sources }]) => ({ name, posts, sources: sources.size }))
      .sort((a, b) => b.posts - a.posts);

    const types = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { platforms, types };
  }, [allItems, items]);

  // Track new items for animation
  useEffect(() => {
    if (sortedItems.length === 0) return;

    const currentIds = new Set(sortedItems.map(item => item.id));

    if (isInitialLoadRef.current) {
      // First load - mark all as seen, no animation
      setSeenIds(currentIds);
      // Also capture these as the "initial session" items for the divider
      if (initialSessionIds === null) {
        setInitialSessionIds(currentIds);
      }
      isInitialLoadRef.current = false;
    } else {
      // Find new items (not in seenIds)
      const newIds = new Set<string>();
      for (const item of sortedItems) {
        if (!seenIds.has(item.id)) {
          newIds.add(item.id);
        }
      }

      if (newIds.size > 0) {
        setNewItemIds(newIds);

        // Clear new status after animation completes
        const timeout = setTimeout(() => {
          setNewItemIds(new Set());
          setSeenIds(prev => {
            const next = new Set(prev);
            newIds.forEach(id => next.add(id));
            return next;
          });
        }, 2000); // Match animation duration

        return () => clearTimeout(timeout);
      }
    }
  }, [sortedItems, seenIds, initialSessionIds]);

  // Reset seen items when tab changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    setSeenIds(new Set());
    setNewItemIds(new Set());
    setInitialSessionIds(null); // Reset so new tab gets its own "initial" set
  }, [selectedTab]);

  // Count items by region (use allItems for accurate counts, fall back to items)
  const itemsForCounts = allItems || items;
  const regionCounts = useMemo(() => {
    return itemsForCounts.reduce((acc, item) => {
      acc[item.region] = (acc[item.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [itemsForCounts]);

  // Get count for a tab (use full item counts, not paginated)
  const getTabCount = useCallback((tabId: TabId): number => {
    if (tabId === 'all') return itemsForCounts.length;
    return regionCounts[tabId] || 0;
  }, [itemsForCounts.length, regionCounts]);

  // Tabs that always show inline
  const inlineTabs = allTabs.filter(t => t.alwaysVisible || t.minScreen);
  // Tabs that go in More dropdown
  const dropdownTabs = allTabs.filter(t => !t.alwaysVisible && !t.minScreen);

  // Get animation class for an item
  const getItemAnimationClass = (itemId: string, index: number): string => {
    if (newItemIds.has(itemId)) {
      // New item - animate in
      const delayClass = index < 5 ? `news-item-delay-${index + 1}` : '';
      return `news-item-enter news-item-new ${delayClass}`;
    }
    if (isInitialLoadRef.current || seenIds.size === 0) {
      // Initial load - subtle fade
      return 'news-initial-load';
    }
    return '';
  };

  // Calculate where to show the "new since arrival" divider
  const newSinceArrivalCount = useMemo(() => {
    if (!initialSessionIds || initialSessionIds.size === 0) return 0;
    return sortedItems.filter(item => !initialSessionIds.has(item.id)).length;
  }, [sortedItems, initialSessionIds]);

  // Find the index where we should insert the divider (after all new items)
  const dividerIndex = useMemo(() => {
    if (newSinceArrivalCount === 0 || !initialSessionIds) return -1;
    // Find first item that WAS in the initial session
    for (let i = 0; i < sortedItems.length; i++) {
      if (initialSessionIds.has(sortedItems[i].id)) {
        return i; // Insert divider before this item
      }
    }
    return -1;
  }, [sortedItems, initialSessionIds, newSinceArrivalCount]);

  // Get the current region label
  const currentRegionLabel = selectedTab === 'all'
    ? 'All Regions'
    : allTabs.find(t => t.id === selectedTab)?.label || 'All Regions';

  // Calculate display stats based on filtered view
  const isFiltered = selectedTab !== 'all';
  const displayPosts = isFiltered ? filteredItems.length : (totalPosts ?? filteredItems.length);
  const displaySources = isFiltered
    ? new Set(filteredItems.map(i => i.source.id)).size
    : (uniqueSources ?? new Set(filteredItems.map(i => i.source.id)).size);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      {/* Header - matches Global Monitor pattern */}
      <div className="relative z-10 px-3 sm:px-4 py-2.5 bg-background-card/80 backdrop-blur-sm border-b border-border-light rounded-t-xl">
          {/* Row 1: Title + Refresh */}
          <div className="flex items-center justify-between mb-2">
            {/* Title */}
            <div className="flex items-center gap-2">
              <SignalIcon className="w-4 h-4 text-emerald-500" />
              <h2 className="text-subhead">Live Wire</h2>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {/* Refresh button with timestamp */}
            {onRefresh && (
              <div className="flex flex-col items-end gap-0.5">
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  aria-label={isLoading ? 'Refreshing feed' : 'Refresh feed'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground-muted bg-background-secondary hover:bg-background-secondary/80 border border-border-light transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Refreshing...' : 'Refresh Feed'}</span>
                </button>
                {lastUpdated && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs text-foreground-muted" suppressHydrationWarning>
                      Last updated {formatActualTime(lastUpdated)}
                    </span>
                    <button
                      onClick={() => setShowFeedStats(!showFeedStats)}
                      className={`p-0.5 rounded transition-colors ${
                        showFeedStats
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                      aria-label="Toggle feed stats"
                      aria-expanded={showFeedStats}
                    >
                      <ChartBarIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Feed Stats Panel */}
          {showFeedStats && (
            <div className="mb-2 p-2.5 bg-background-secondary rounded-lg border border-border-light space-y-2">
              {/* Platform breakdown */}
              <div>
                <div className="text-2xs font-medium text-foreground-muted uppercase tracking-wide mb-1.5">By Platform</div>
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-1.5">
                  {feedStats.platforms.map(({ name, posts, sources }) => (
                    <div key={name} className="flex items-center justify-between px-2 py-1 bg-background-secondary rounded text-xs">
                      <span className="font-medium text-foreground capitalize">{name}</span>
                      <span className="text-foreground-muted">
                        {posts} <span className="text-foreground-muted">/ {sources} src</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Source type breakdown */}
              <div>
                <div className="text-2xs font-medium text-foreground-muted uppercase tracking-wide mb-1.5">By Source Type</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {feedStats.types.map(({ name, count }) => (
                    <span key={name} className="text-foreground-muted">
                      <span className="capitalize">{name}</span>{' '}
                      <span className="font-mono text-foreground-muted">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
              {/* Load time */}
              {loadTimeMs && (
                <div className="text-xs text-foreground-muted">
                  Fetch time: <span className="font-mono text-foreground">{(loadTimeMs / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}

          {/* Row 2: Stats - with loading skeleton */}
          <div className="text-xs text-foreground-muted mb-2.5">
            {isLoading && displayPosts === 0 ? (
              // Skeleton loading state
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span>Fetching</span>
                  <span className="inline-block w-12 h-3.5 skeleton-shimmer rounded" />
                  <span>posts from</span>
                  <span className="inline-block w-10 h-3.5 skeleton-shimmer rounded" />
                  <span>sources...</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-24 h-3 skeleton-shimmer rounded" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    <span className="font-semibold text-foreground">{displayPosts.toLocaleString()} posts</span>
                    {' · '}
                    <span className="font-semibold text-foreground">{displaySources.toLocaleString()} sources</span>
                    {isFiltered
                      ? ' (filtered)'
                      : <> · {hoursWindow}h</>
                    }
                  </span>
                  <Link href="/sources" className="hidden sm:inline text-foreground-muted underline underline-offset-2 hover:text-foreground hover:no-underline">Sources</Link>
                </div>
                {/* Trending keywords - only for All view */}
                {trendingKeywords.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border-light">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted uppercase tracking-wide">
                        <FireIcon className="w-3 h-3 text-amber-500" />
                        <span>Trending</span>
                      </div>
                      {trendingKeywords.map((kw) => (
                        <button
                          key={kw.keyword}
                          onClick={() => setSearchFilter(searchFilter === kw.keyword ? '' : kw.keyword)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                            searchFilter === kw.keyword
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-background-secondary text-foreground border-border-light hover:border-border hover:bg-background-secondary/80'
                          }`}
                        >
                          {kw.keyword}
                          <span className={searchFilter === kw.keyword ? 'text-amber-600/60 dark:text-amber-400/60' : 'text-foreground-light'}>{kw.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Region Selector */}
          <div className="pb-2">
            <div className={`
              flex flex-wrap items-center gap-0.5 p-1 rounded-lg
              bg-background-secondary
              ${isPending ? 'opacity-70' : ''}
              transition-all duration-200
            `}>
              {primaryTabs.map((tab, index) => {
                const isSelected = selectedTab === tab.id;
                const count = getTabCount(tab.id);
                const isLast = index === primaryTabs.length - 1;

                return (
                  <div key={tab.id} className="flex items-center">
                    <button
                      onClick={() => handleTabSelect(tab.id)}
                      className={`
                        group relative px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap
                        transition-all duration-200 ease-out
                        ${isSelected
                          ? 'bg-background-card text-foreground shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                        }
                      `}
                    >
                      <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                        {tab.id === 'all' && (
                          <ListBulletIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSelected ? 'text-foreground' : 'text-foreground-muted'}`} />
                        )}
                        <span>{tab.label}</span>
                        <span className={`
                          inline-flex text-2xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-md transition-all duration-200
                          ${isSelected
                            ? 'bg-background-secondary text-foreground'
                            : 'text-foreground-muted'
                          }
                        `}>
                          {count}
                        </span>
                      </span>
                    </button>
                    {!isLast && (
                      <div className="w-px h-4 sm:h-5 bg-border mx-0.5 hidden sm:block" />
                    )}
                  </div>
                );
              })}

              {/* Secondary regions - inline when expanded */}
              {regionalExpanded && secondaryTabs.map((tab, index) => {
                const isSelected = selectedTab === tab.id;
                const count = getTabCount(tab.id);
                return (
                  <div key={tab.id} className="flex items-center">
                    {index === 0 && (
                      <div className="w-px h-4 sm:h-5 bg-border mx-0.5 hidden sm:block" />
                    )}
                    <button
                      onClick={() => handleTabSelect(tab.id)}
                      className={`
                        group relative px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap
                        transition-all duration-200 ease-out
                        ${isSelected
                          ? 'bg-background-card text-foreground shadow-sm'
                          : 'text-foreground-muted hover:text-foreground'
                        }
                      `}
                    >
                      <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                        <span>{tab.label}</span>
                        <span className={`
                          inline-flex text-2xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-md transition-all duration-200
                          ${isSelected
                            ? 'bg-background-secondary text-foreground'
                            : 'text-foreground-muted'
                          }
                        `}>
                          {count}
                        </span>
                      </span>
                    </button>
                    {index < secondaryTabs.length - 1 && (
                      <div className="w-px h-4 sm:h-5 bg-border mx-0.5 hidden sm:block" />
                    )}
                  </div>
                );
              })}

              {/* Divider before More/Less */}
              <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1 hidden sm:block" />

              {/* More/Less toggle */}
              <button
                onClick={() => setRegionalExpanded(!regionalExpanded)}
                className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
              >
                <span>{regionalExpanded ? 'Less' : 'More'}</span>
                <ChevronDownIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${regionalExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Loading indicator */}
            {isPending && (
              <span className="ml-3 inline-flex items-center gap-2 text-xs text-foreground-muted">
                <span className="w-3 h-3 border-2 border-border border-t-foreground-muted rounded-full animate-spin" />
                <span>Filtering...</span>
              </span>
            )}
          </div>
        </div>

      <div id="feed-panel" role="tabpanel" aria-label={`News for ${selectedTab === 'all' ? 'all regions' : selectedTab}`}>

        {/* Active search filter bar */}
        {searchFilter && (
          <div className="mx-3 sm:mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <FireIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Showing posts matching &ldquo;{searchFilter}&rdquo;
            </span>
            <span className="text-xs text-amber-600/60 dark:text-amber-400/60 tabular-nums">
              {sortedItems.length} {sortedItems.length === 1 ? 'result' : 'results'}
            </span>
            <button
              onClick={() => setSearchFilter('')}
              className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
            >
              &times; Clear
            </button>
          </div>
        )}

        {error && (
          <ErrorState message={error} onRetry={onRetry} />
        )}

        {isLoading && sortedItems.length === 0 && !error && (
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <NewsCardSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {!isLoading && !error && sortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center mb-3">
              <GlobeAltIcon className="w-6 h-6 text-foreground-muted" />
            </div>
            <span className="text-foreground text-base sm:text-lg font-medium mb-1">No updates yet</span>
            <span className="text-foreground-muted text-sm text-center max-w-xs">
              {searchFilter
                ? `No posts matching "${searchFilter}"`
                : selectedTab === 'all'
                  ? 'News will appear here as it breaks'
                  : `No news for ${regionDisplayNames[selectedTab] || 'this region'} yet`}
            </span>
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="mt-3 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                Clear filter
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-4 px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground bg-background-secondary rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ArrowPathIcon className="w-4 h-4 inline mr-1.5" />
                Refresh feed
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 px-3 sm:px-4 pt-4 pb-3 sm:pb-4 news-feed-list">
          {/* AI Briefing Card - always shows global briefing regardless of region filter */}
          {!isLoading && sortedItems.length > 0 && (
            <BriefingCard
              region="all"
              autoGenerate={true}
              postCount={totalPosts ?? sortedItems.length}
            />
          )}

          {sortedItems.map((item, index) => (
            <div key={item.id}>
              {/* New since arrival divider - appears before first "old" item */}
              {dividerIndex === index && dividerIndex > 0 && (
                <div className="flex items-center gap-3 py-3 mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent dark:via-blue-500/40" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap px-2">
                    {newSinceArrivalCount} new since you arrived
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent dark:via-blue-500/40" />
                </div>
              )}
              <div className={getItemAnimationClass(item.id, index)}>
                {isEditorialItem(item) ? (
                  <EditorialCard item={item} />
                ) : (
                  <NewsCard item={item} />
                )}
              </div>
            </div>
          ))}
        </div>


        {isLoading && sortedItems.length > 0 && (
          <div className="py-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

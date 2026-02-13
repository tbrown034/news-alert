'use client';

import { useState, useEffect, useRef, useMemo, useCallback, useTransition, memo } from 'react';
import { NewsItem, WatchpointId } from '@/types';
import { NewsCard } from './NewsCard';
import { EditorialCard, isEditorialItem } from './EditorialCard';
import { BriefingCard } from './BriefingCard';
import { ArrowPathIcon, ExclamationTriangleIcon, GlobeAltIcon, ChevronDownIcon, SignalIcon, FireIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { regionDisplayNames } from '@/lib/regionDetection';
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
      className="px-4 py-4 border-b border-slate-100 dark:border-slate-800"
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
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 rounded-lg transition-colors"
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
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [regionalExpanded, setRegionalExpanded] = useState(false);
  const [showFeedStats, setShowFeedStats] = useState(false);
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('all'); // Local tab state, defaults to All
  const moreDropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    // Apply region filter only
    if (selectedTab !== 'all') {
      return items.filter((item) => item.region === selectedTab);
    }
    return items;
  }, [items, selectedTab]);

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
  // Check if selected tab is in dropdown
  const isDropdownTabSelected = dropdownTabs.some(t => t.id === selectedTab);

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
      <div className="relative z-10 px-3 sm:px-4 py-2.5 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 rounded-t-2xl">
          {/* Row 1: Title + Refresh */}
          <div className="flex items-center justify-between mb-2">
            {/* Title */}
            <div className="flex items-center gap-2">
              <SignalIcon className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Wire</h2>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {/* Refresh button with timestamp */}
            {onRefresh && (
              <div className="flex flex-col items-end gap-0.5">
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  aria-label={isLoading ? 'Refreshing feed' : 'Refresh feed'}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Refreshing...' : 'Refresh Feed'}</span>
                </button>
                {lastUpdated && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs text-slate-400 dark:text-slate-500" suppressHydrationWarning>
                      Last updated {formatActualTime(lastUpdated)}
                    </span>
                    <button
                      onClick={() => setShowFeedStats(!showFeedStats)}
                      className={`p-0.5 rounded transition-colors ${
                        showFeedStats
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
            <div className="mb-2 p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50 space-y-2">
              {/* Platform breakdown */}
              <div>
                <div className="text-2xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">By Platform</div>
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-1.5">
                  {feedStats.platforms.map(({ name, posts, sources }) => (
                    <div key={name} className="flex items-center justify-between px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{name}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {posts} <span className="text-slate-400 dark:text-slate-500">/ {sources} src</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Source type breakdown */}
              <div>
                <div className="text-2xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">By Source Type</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {feedStats.types.map(({ name, count }) => (
                    <span key={name} className="text-slate-600 dark:text-slate-400">
                      <span className="capitalize">{name}</span>{' '}
                      <span className="font-mono text-slate-500 dark:text-slate-500">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
              {/* Load time */}
              {loadTimeMs && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Fetch time: <span className="font-mono text-slate-700 dark:text-slate-300">{(loadTimeMs / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}

          {/* Row 2: Stats - with loading skeleton */}
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
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
                <div>
                  {isFiltered ? 'Showing ' : 'Fetched '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{displayPosts.toLocaleString()} posts</span>
                  {' from '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{displaySources.toLocaleString()} sources</span>
                  {isFiltered
                    ? ' (filtered)'
                    : <> in last <span className="font-semibold text-slate-700 dark:text-slate-300">six hours</span> {selectedTab === 'all' ? 'globally' : `in ${regionDisplayNames[selectedTab] || selectedTab}`}</>
                  }
                </div>
                {/* Activity indicator - show for both global and regional views */}
                {!isFiltered && activity && activity[selectedTab] && (
                  <div className="italic mt-0.5">
                    {(() => {
                      const a = activity[selectedTab];
                      if (!a.vsNormal || a.vsNormal === 'normal') return 'Typical activity';
                      if (a.vsNormal === 'above') {
                        if (a.multiplier && a.multiplier >= 2) return `More than usual (${a.multiplier}× normal)`;
                        if (a.percentChange && a.percentChange >= 50) return `More than usual (+${a.percentChange}%)`;
                        return 'Slightly more than usual';
                      }
                      if (a.vsNormal === 'below') {
                        if (a.percentChange) return `Less than usual (${Math.abs(a.percentChange)}% below)`;
                        return 'Less than usual';
                      }
                      return 'Typical activity';
                    })()}
                  </div>
                )}
                {/* Trending keywords - only for All view */}
                {trendingKeywords.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        <FireIcon className="w-3 h-3 text-amber-500" />
                        <span>Trending</span>
                      </div>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {trendingKeywords.map((kw, i) => (
                          <span key={kw.keyword}>
                            {i > 0 && '  ·  '}
                            {kw.keyword} <span className="text-slate-400 dark:text-slate-500">({kw.count})</span>
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Region Selector */}
          <div className="pb-2" ref={moreDropdownRef}>
            <div className={`
              inline-flex flex-wrap items-center gap-0.5 p-1 rounded-xl
              bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/60
              border border-slate-200/80 dark:border-slate-700/60
              shadow-sm dark:shadow-lg dark:shadow-black/20
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
                        group relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                        transition-all duration-200 ease-out
                        ${isSelected
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md dark:shadow-lg dark:shadow-black/30 ring-1 ring-slate-200 dark:ring-slate-600/50 scale-[1.02]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/40'
                        }
                      `}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {tab.id === 'all' && (
                          <GlobeAltIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        )}
                        <span>{tab.label}</span>
                        <span className={`
                          hidden sm:inline-flex text-2xs font-semibold px-1.5 py-0.5 rounded-md transition-all duration-200
                          ${isSelected
                            ? 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                            : 'bg-transparent text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50'
                          }
                        `}>
                          {count}
                        </span>
                      </span>
                    </button>
                    {!isLast && (
                      <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-600/40 mx-0.5" />
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
                      <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-600/40 mx-0.5" />
                    )}
                    <button
                      onClick={() => handleTabSelect(tab.id)}
                      className={`
                        group relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                        transition-all duration-200 ease-out
                        ${isSelected
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md dark:shadow-lg dark:shadow-black/30 ring-1 ring-slate-200 dark:ring-slate-600/50 scale-[1.02]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/40'
                        }
                      `}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span>{tab.label}</span>
                        <span className={`
                          hidden sm:inline-flex text-2xs font-semibold px-1.5 py-0.5 rounded-md transition-all duration-200
                          ${isSelected
                            ? 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                            : 'bg-transparent text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50'
                          }
                        `}>
                          {count}
                        </span>
                      </span>
                    </button>
                    {index < secondaryTabs.length - 1 && (
                      <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-600/40 mx-0.5" />
                    )}
                  </div>
                );
              })}

              {/* Divider before More/Less */}
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60 mx-1" />

              {/* More/Less toggle */}
              <button
                onClick={() => setRegionalExpanded(!regionalExpanded)}
                className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/40 transition-all duration-200 ease-out flex items-center gap-1.5"
              >
                <span>{regionalExpanded ? 'Less' : 'More'}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${regionalExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Loading indicator */}
            {isPending && (
              <span className="ml-3 inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span className="w-3 h-3 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
                <span>Filtering...</span>
              </span>
            )}
          </div>
        </div>

      <div id="feed-panel" role="tabpanel" aria-label={`News for ${selectedTab === 'all' ? 'all regions' : selectedTab}`}>

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
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <GlobeAltIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <span className="text-slate-800 dark:text-slate-100 text-base sm:text-lg font-medium mb-1">No updates yet</span>
            <span className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs">
              {selectedTab === 'all'
                ? 'News will appear here as it breaks'
                : `No news for ${regionDisplayNames[selectedTab] || 'this region'} yet`}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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

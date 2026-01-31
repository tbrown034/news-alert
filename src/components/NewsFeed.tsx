'use client';

import { useState, useEffect, useRef, useMemo, useCallback, useTransition } from 'react';
import { NewsItem, WatchpointId } from '@/types';
import { NewsCard } from './NewsCard';
import { EditorialCard, isEditorialItem } from './EditorialCard';
import { BriefingCard } from './BriefingCard';
import { ArrowPathIcon, ExclamationTriangleIcon, GlobeAltIcon, ChevronDownIcon, SignalIcon } from '@heroicons/react/24/outline';
import { regionDisplayNames } from '@/lib/regionDetection';
import { TrendingKeywords } from './TrendingKeywords';
import { PlatformIcon, platformColors, platformBadgeStyles } from './PlatformIcon';

interface ActivityData {
  level: string;
  count: number;
  breaking: number;
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
];

const allTabs: TabConfig[] = [...primaryTabs, ...secondaryTabs];

// Platform filter options (multi-select)
type PlatformId = 'bluesky' | 'rss' | 'telegram' | 'mastodon' | 'youtube' | 'reddit';
const platformOptions: { id: PlatformId; label: string }[] = [
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'rss', label: 'RSS' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'mastodon', label: 'Mastodon' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'reddit', label: 'Reddit' },
];
const ALL_PLATFORMS = new Set<PlatformId>(['bluesky', 'rss', 'telegram', 'mastodon', 'youtube', 'reddit']);

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

export function NewsFeed({
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
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<PlatformId>>(new Set(ALL_PLATFORMS));
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [regionalExpanded, setRegionalExpanded] = useState(false);
  const [sourceFilterExpanded, setSourceFilterExpanded] = useState(false);
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
    let filtered = items;

    // Apply region filter
    // Server-side detection now assigns regions based on content keywords
    // Just filter by the assigned region (which may have been detected from content)
    if (selectedTab !== 'all') {
      filtered = items.filter((item) => item.region === selectedTab);
    }

    // Apply platform filter (multi-select)
    const allEnabled = enabledPlatforms.size === ALL_PLATFORMS.size;
    if (!allEnabled) {
      filtered = filtered.filter((item) => enabledPlatforms.has(item.source.platform as PlatformId));
    }

    return filtered;
  }, [items, selectedTab, enabledPlatforms]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [filteredItems]);

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

  // Count items by platform (from region-filtered items, NOT platform-filtered)
  const platformCounts = useMemo(() => {
    // Apply only region filter, not platform filter
    const regionFiltered = selectedTab === 'all'
      ? items
      : items.filter((item) => item.region === selectedTab);

    return regionFiltered.reduce((acc, item) => {
      const platform = item.source.platform;
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items, selectedTab]);

  // Get count for a tab (use full item counts, not paginated)
  const getTabCount = (tabId: TabId): number => {
    if (tabId === 'all') return itemsForCounts.length;
    return regionCounts[tabId] || 0;
  };

  // Check if a tab is in the More dropdown (not visible inline)
  const isInMoreDropdown = (tab: TabConfig): boolean => {
    if (tab.alwaysVisible) return false;
    // Without JS media queries, we'll put non-alwaysVisible tabs in More
    // The responsive classes will show/hide them appropriately
    return !tab.minScreen;
  };

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

  // Get the current source label for multi-select
  const allPlatformsEnabled = enabledPlatforms.size === ALL_PLATFORMS.size;
  const currentSourceLabel = allPlatformsEnabled
    ? 'All Sources'
    : enabledPlatforms.size === 0
      ? 'None'
      : enabledPlatforms.size === 1
        ? platformOptions.find(p => enabledPlatforms.has(p.id))?.label || 'Sources'
        : `${enabledPlatforms.size} Sources`;

  const totalFilteredPosts = Object.values(platformCounts).reduce((sum, c) => sum + c, 0);

  // Calculate display stats based on filtered view
  // Region selection = still show "Fetched X in {region}"
  // Platform filter = show "(filtered)"
  const isPlatformFiltered = !allPlatformsEnabled;
  const displayPosts = (selectedTab !== 'all' || isPlatformFiltered) ? filteredItems.length : (totalPosts ?? filteredItems.length);
  const displaySources = (selectedTab !== 'all' || isPlatformFiltered)
    ? new Set(filteredItems.map(i => i.source.id)).size
    : (uniqueSources ?? new Set(filteredItems.map(i => i.source.id)).size);

  return (
    <div className="flex flex-col">
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
                  <span className="text-2xs text-slate-400 dark:text-slate-500" suppressHydrationWarning>
                    Last updated {formatActualTime(lastUpdated)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Stats - consistent format for all views */}
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <div>
              {isPlatformFiltered ? 'Showing ' : 'Fetched '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{displayPosts.toLocaleString()} posts</span>
              {' from '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{displaySources.toLocaleString()} sources</span>
              {isPlatformFiltered
                ? ' (filtered by platform)'
                : <> in last <span className="font-semibold text-slate-700 dark:text-slate-300">six hours</span> {selectedTab === 'all' ? 'globally' : `in ${regionDisplayNames[selectedTab] || selectedTab}`}</>
              }
            </div>
            {/* Activity indicator - show for both global and regional views */}
            {!isPlatformFiltered && activity && activity[selectedTab] && (
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
          </div>

          {/* Row 2: Region Selector - elevated segmented control with activity indicators */}
          <div className="pb-3 border-b border-slate-200/50 dark:border-slate-700/40 mb-3" ref={moreDropdownRef}>
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
                        {/* Post count badge - only show on hover or when selected */}
                        <span className={`
                          text-2xs font-semibold px-1.5 py-0.5 rounded-md transition-all duration-200
                          ${isSelected
                            ? 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                            : 'bg-transparent text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50'
                          }
                        `}>
                          {count}
                        </span>
                      </span>
                    </button>
                    {/* Subtle separator between tabs */}
                    {!isLast && (
                      <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-600/40 mx-0.5" />
                    )}
                  </div>
                );
              })}

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60 mx-1" />

              {/* More dropdown for secondary regions */}
              <div className="relative">
                <button
                  onClick={() => {
                    setRegionalExpanded(!regionalExpanded);
                    setSourceFilterExpanded(false);
                  }}
                  className={`
                    group relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                    transition-all duration-200 ease-out flex items-center gap-2
                    ${secondaryTabs.some(t => t.id === selectedTab)
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md dark:shadow-lg dark:shadow-black/30 ring-1 ring-slate-200 dark:ring-slate-600/50 scale-[1.02]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/40'
                    }
                  `}
                >
                  <span>{secondaryTabs.some(t => t.id === selectedTab)
                    ? secondaryTabs.find(t => t.id === selectedTab)?.label
                    : 'More'
                  }</span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${regionalExpanded ? 'rotate-180' : ''}`} />
                </button>

                {regionalExpanded && (
                  <div className="absolute top-full left-0 mt-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/40 z-50 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-150">
                    {secondaryTabs.map((tab) => {
                      const isSelected = selectedTab === tab.id;
                      const count = regionCounts[tab.id] || 0;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            handleTabSelect(tab.id);
                            setRegionalExpanded(false);
                          }}
                          className={`
                            w-full px-4 py-2.5 text-sm font-medium transition-all text-left flex items-center gap-3
                            ${isSelected
                              ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-900 dark:hover:text-white'
                            }
                          `}
                        >
                          <span className="flex-1">{tab.label}</span>
                          <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Loading indicator with better styling */}
            {isPending && (
              <span className="ml-3 inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span className="w-3 h-3 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
                <span>Filtering...</span>
              </span>
            )}
          </div>

          {/* Row 3: Source filter */}
          <div className="flex items-center gap-2 sm:gap-3 pb-2">
            {/* Source Dropdown - Multi-select with checkboxes */}
            <div className="relative">
              <button
                onClick={() => {
                  setSourceFilterExpanded(!sourceFilterExpanded);
                  setRegionalExpanded(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                {/* Show mini platform icons when filtered */}
                {!allPlatformsEnabled && enabledPlatforms.size > 0 && enabledPlatforms.size <= 3 && (
                  <div className="flex items-center -space-x-1">
                    {Array.from(enabledPlatforms).slice(0, 3).map((p) => (
                      <span key={p} className={platformColors[p]}>
                        <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{currentSourceLabel}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${sourceFilterExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Source dropdown menu - multi-select with checkboxes */}
              {sourceFilterExpanded && (
                <div className="absolute top-full left-0 mt-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 min-w-[200px]">
                  {/* Select All / None header */}
                  <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Platforms</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEnabledPlatforms(new Set(ALL_PLATFORMS))}
                        className="text-2xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        All
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        onClick={() => setEnabledPlatforms(new Set())}
                        className="text-2xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {/* Platform checkboxes */}
                  {platformOptions.map((platform) => {
                    const isEnabled = enabledPlatforms.has(platform.id);
                    const count = platformCounts[platform.id] || 0;
                    const badgeStyle = platformBadgeStyles[platform.id] || '';

                    return (
                      <button
                        key={platform.id}
                        onClick={() => {
                          const newSet = new Set(enabledPlatforms);
                          if (isEnabled) {
                            newSet.delete(platform.id);
                          } else {
                            newSet.add(platform.id);
                          }
                          setEnabledPlatforms(newSet);
                        }}
                        className="w-full px-3 py-2 text-sm transition-colors text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        {/* Custom checkbox */}
                        <div className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                          ${isEnabled
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-300 dark:border-slate-600'
                          }
                        `}>
                          {isEnabled && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Platform icon and name */}
                        <div className={`flex items-center gap-2 flex-1 ${isEnabled ? '' : 'opacity-50'}`}>
                          <span className={platformColors[platform.id]}>
                            <PlatformIcon platform={platform.id} className="w-4 h-4" />
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{platform.label}</span>
                        </div>

                        {/* Count badge */}
                        <span className={`
                          px-1.5 py-0.5 text-2xs font-semibold rounded-md border
                          ${isEnabled ? badgeStyle : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}
                        `}>
                          {isLoading && count === 0 ? '...' : count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Total footer */}
                  <div className="px-3 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {filteredItems.length} posts
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Trending Keywords - uses all items, not paginated subset */}
            <TrendingKeywords items={allItemsForTrending || items} isLoading={isLoading} />
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
          {/* AI Briefing Card - appears at top of feed */}
          {!isLoading && sortedItems.length > 0 && (
            <BriefingCard region={selectedTab} />
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
}

'use client';

import { NewsItem, WatchpointId } from '@/types';
import { NewsCard } from './NewsCard';
import { InlineBriefing } from './InlineBriefing';
import { SeismicFeed } from './SeismicFeed';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ActivityData {
  level: string;
  count: number;
  breaking: number;
  baseline?: number;
  multiplier?: number;
  vsNormal?: string;
  percentChange?: number;
}

interface NewsFeedProps {
  items: NewsItem[];
  selectedWatchpoint: WatchpointId;
  onSelectWatchpoint?: (id: WatchpointId) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  activity?: Record<string, ActivityData>;
  error?: string | null;
  onRetry?: () => void;
}

// Skeleton loader for news cards
function NewsCardSkeleton() {
  return (
    <div className="px-4 py-4 border-b border-gray-800/50 animate-pulse">
      <div className="flex flex-col gap-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded w-[90%]" />
          <div className="h-4 bg-gray-800 rounded w-[70%]" />
        </div>
        {/* Source footer skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-800 rounded" />
          <div className="h-3 bg-gray-800 rounded w-24" />
          <div className="h-3 bg-gray-800 rounded w-16" />
          <div className="h-3 bg-gray-800 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-4 my-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-red-400 text-sm font-medium">Failed to load feed</p>
          <p className="text-red-400/70 text-xs mt-1 truncate">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-red-800/50 hover:bg-red-800 text-red-200 rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Volume indicator - shows post count vs baseline (not AI)
function VolumeIndicator({ activity }: { activity: ActivityData }) {
  const getVolumeText = () => {
    if (!activity.vsNormal || !activity.multiplier) {
      return { text: 'Normal volume', color: 'text-gray-500' };
    }
    if (activity.vsNormal === 'above') {
      const pct = activity.percentChange || 0;
      if (pct >= 200) return { text: `${activity.multiplier}× normal volume`, color: 'text-red-400' };
      if (pct >= 100) return { text: `${activity.multiplier}× normal volume`, color: 'text-orange-400' };
      return { text: `+${pct}% vs normal`, color: 'text-yellow-400' };
    } else if (activity.vsNormal === 'below') {
      return { text: `${Math.abs(activity.percentChange || 0)}% below normal`, color: 'text-emerald-400' };
    }
    return { text: 'Normal volume', color: 'text-gray-500' };
  };

  const volume = getVolumeText();

  return (
    <div className="mx-4 mt-3 px-3 py-2 flex items-center justify-between text-xs border-b border-gray-800/30">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{activity.count} posts</span>
        <span className="text-gray-600">in last hour</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={volume.color}>{volume.text}</span>
        {activity.baseline && (
          <span className="text-gray-600">(baseline: ~{activity.baseline}/hr)</span>
        )}
      </div>
    </div>
  );
}

// Region tab configuration
const regionTabs: { id: WatchpointId; label: string; icon?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'middle-east', label: 'Middle East' },
  { id: 'ukraine-russia', label: 'Ukraine' },
  { id: 'china-taiwan', label: 'Taiwan' },
  { id: 'venezuela', label: 'Venezuela' },
  { id: 'us-domestic', label: 'US' },
  { id: 'seismic', label: 'Seismic', icon: '🌍' },
];

export function NewsFeed({
  items,
  selectedWatchpoint,
  onSelectWatchpoint,
  isLoading,
  onRefresh,
  activity,
  error,
  onRetry,
}: NewsFeedProps) {
  // Filter items by watchpoint
  const filteredItems =
    selectedWatchpoint === 'all'
      ? items
      : items.filter((item) => item.region === selectedWatchpoint);

  // Sort by timestamp (newest first) - always chronological
  const sortedItems = [...filteredItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Count items per region for badges
  const regionCounts = items.reduce((acc, item) => {
    acc[item.region] = (acc[item.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col">
      {/* Region Tabs */}
      <div className="sticky top-[57px] z-40 bg-[#0f1219]/95 backdrop-blur-md border-b border-gray-800/60">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {regionTabs.map((tab) => {
            const isSelected = selectedWatchpoint === tab.id;
            const count = tab.id === 'all' ? items.length : (regionCounts[tab.id] || 0);

            return (
              <button
                key={tab.id}
                onClick={() => onSelectWatchpoint?.(tab.id)}
                className={`
                  relative flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium
                  transition-colors duration-200 whitespace-nowrap
                  ${isSelected
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }
                `}
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label}

                {/* Count badge - don't show for "All" or "Seismic" since they're different */}
                {count > 0 && tab.id !== 'all' && tab.id !== 'seismic' && (
                  <span className={`
                    ml-1.5 px-1.5 py-0.5 text-xs rounded-full
                    ${isSelected
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-gray-700/50 text-gray-400'
                    }
                  `}>
                    {count}
                  </span>
                )}

                {/* Active indicator */}
                {isSelected && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}

          {/* Refresh button at end */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-shrink-0 ml-auto px-3 py-3 text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Seismic Feed - show instead of regular content when seismic tab selected */}
      {selectedWatchpoint === 'seismic' ? (
        <SeismicFeed />
      ) : (
        <>
          {/* Volume Indicator - separate from AI */}
          {activity?.[selectedWatchpoint] && selectedWatchpoint !== 'all' && (
            <VolumeIndicator activity={activity[selectedWatchpoint]} />
          )}

          {/* AI Briefing Card */}
          <InlineBriefing region={selectedWatchpoint} />

          {/* Error state */}
          {error && (
            <ErrorState message={error} onRetry={onRetry} />
          )}

          {/* Loading state with skeleton loaders */}
          {isLoading && sortedItems.length === 0 && !error && (
            <div className="flex flex-col">
              {[...Array(5)].map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && sortedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <span className="text-2xl">📡</span>
              </div>
              <span className="text-gray-200 text-lg font-medium mb-1">No updates yet</span>
              <span className="text-gray-500 text-sm text-center">
                {selectedWatchpoint === 'all'
                  ? 'News will appear here as it breaks'
                  : `No news for ${regionTabs.find(t => t.id === selectedWatchpoint)?.label || 'this region'} yet`}
              </span>
            </div>
          )}

          {/* News items - chronological feed */}
          <div className="flex flex-col">
            {sortedItems.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {/* Loading more indicator */}
          {isLoading && sortedItems.length > 0 && (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

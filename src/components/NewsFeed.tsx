'use client';

import { NewsItem, WatchpointId } from '@/types';
import { NewsCard } from './NewsCard';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface NewsFeedProps {
  items: NewsItem[];
  selectedWatchpoint: WatchpointId;
  onSelectWatchpoint?: (id: WatchpointId) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Region tab configuration
const regionTabs: { id: WatchpointId; label: string; shortLabel: string }[] = [
  { id: 'all', label: 'All', shortLabel: 'All' },
  { id: 'middle-east', label: 'Middle East', shortLabel: 'M.East' },
  { id: 'ukraine-russia', label: 'Ukraine', shortLabel: 'UKR' },
  { id: 'china-taiwan', label: 'Taiwan', shortLabel: 'TWN' },
  { id: 'venezuela', label: 'Venezuela', shortLabel: 'VEN' },
  { id: 'us-domestic', label: 'US', shortLabel: 'US' },
];

export function NewsFeed({
  items,
  selectedWatchpoint,
  onSelectWatchpoint,
  isLoading,
  onRefresh,
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
                  relative flex-shrink-0 px-4 py-3 text-sm font-medium
                  transition-colors duration-200
                  ${isSelected
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }
                `}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>

                {/* Count badge */}
                {count > 0 && (
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

      {/* Loading state */}
      {isLoading && sortedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-gray-500 text-sm">Loading intel...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedItems.length === 0 && (
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
    </div>
  );
}

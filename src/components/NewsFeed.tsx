'use client';

import { NewsItem, WatchpointId } from '@/types';
import { NewsCard } from './NewsCard';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface NewsFeedProps {
  items: NewsItem[];
  selectedWatchpoint: WatchpointId;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function NewsFeed({
  items,
  selectedWatchpoint,
  isLoading,
  onRefresh,
}: NewsFeedProps) {
  // Filter items by watchpoint
  const filteredItems =
    selectedWatchpoint === 'all'
      ? items
      : items.filter((item) => item.region === selectedWatchpoint);

  // Sort by timestamp (newest first)
  const sortedItems = [...filteredItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Feed header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-200">Latest Updates</h2>
          <span className="px-2 py-0.5 bg-[#232734] rounded-full text-sm text-gray-400">
            {sortedItems.length}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#232734] hover:bg-[#2a2f3f] rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span className="text-sm text-gray-400">Refresh</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && sortedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ArrowPathIcon className="w-8 h-8 animate-spin mb-2" />
          <span>Loading updates...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <span className="text-lg mb-1">No updates</span>
          <span className="text-sm">
            {selectedWatchpoint === 'all'
              ? 'No news items available'
              : 'No news items for this region'}
          </span>
        </div>
      )}

      {/* News items */}
      <div className="flex flex-col gap-3">
        {sortedItems.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

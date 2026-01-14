'use client';

import { useState, useEffect, useCallback } from 'react';
import { WatchpointSelector, NewsFeed, Legend, WorldMap } from '@/components';
import { watchpoints as defaultWatchpoints } from '@/lib/mockData';
import { NewsItem, WatchpointId, Watchpoint } from '@/types';
import { BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';

interface ApiResponse {
  items: NewsItem[];
  activity: Record<string, { level: string; count: number; breaking: number }>;
  fetchedAt: string;
  totalItems: number;
}

export default function Home() {
  const [selectedWatchpoint, setSelectedWatchpoint] = useState<WatchpointId>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [watchpoints, setWatchpoints] = useState<Watchpoint[]>(defaultWatchpoints);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/news?region=${selectedWatchpoint}&limit=50`);
      const data: ApiResponse = await response.json();

      // Parse dates from JSON
      const items = data.items.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));

      setNewsItems(items);
      setLastFetched(data.fetchedAt);

      // Update watchpoint activity levels from API data
      if (data.activity) {
        setWatchpoints((prev) =>
          prev.map((wp) => {
            const activity = data.activity[wp.id];
            if (activity) {
              return {
                ...wp,
                activityLevel: activity.level as Watchpoint['activityLevel'],
              };
            }
            return wp;
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [selectedWatchpoint]);

  // Fetch on mount and when watchpoint changes
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchNews, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const handleRefresh = () => {
    fetchNews();
  };

  // Count items per region for map display
  const regionCounts = newsItems.reduce((acc, item) => {
    const region = item.region;
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#0f1219]">
      {/* Header - Twitter style */}
      <header className="sticky top-0 z-50 bg-[#0f1219]/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-xl mx-auto px-4 h-[57px] flex items-center justify-between">
          {/* Logo + Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BoltIcon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[15px] font-bold text-white leading-none">newsAlert</h1>
              <p className="text-[11px] text-gray-500 leading-none mt-0.5">Breaking news before it&apos;s news</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-white/[0.03] rounded-full transition-colors relative">
              <BellIcon className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2.5 hover:bg-white/[0.03] rounded-full transition-colors">
              <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* World Map - Hero area for regional activity */}
      <WorldMap
        watchpoints={watchpoints}
        selected={selectedWatchpoint}
        onSelect={setSelectedWatchpoint}
        regionCounts={regionCounts}
      />

      {/* Main content */}
      <main className="max-w-xl mx-auto">
        {/* News feed */}
        <NewsFeed
          items={newsItems}
          selectedWatchpoint={selectedWatchpoint}
          onSelectWatchpoint={setSelectedWatchpoint}
          isLoading={isRefreshing || isInitialLoad}
          onRefresh={handleRefresh}
        />
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-20" />

      {/* Legend */}
      <Legend />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { WatchpointSelector, NewsFeed } from '@/components';
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

  // Count breaking news
  const breakingCount = newsItems.filter((item) => item.isBreaking).length;

  return (
    <div className="min-h-screen bg-[#0f1219]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1219]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">newsAlert</h1>
              {breakingCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold animate-pulse">
                  {breakingCount} Breaking
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#232734] rounded-lg transition-colors relative">
                <BellIcon className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 hover:bg-[#232734] rounded-lg transition-colors">
                <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* Watchpoint selector */}
        <section className="mb-6">
          <WatchpointSelector
            watchpoints={watchpoints}
            selected={selectedWatchpoint}
            onSelect={setSelectedWatchpoint}
          />
        </section>

        {/* Activity summary (when viewing all) */}
        {selectedWatchpoint === 'all' && (
          <section className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {watchpoints.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => setSelectedWatchpoint(wp.id)}
                  className="bg-[#232734] rounded-xl p-3 hover:bg-[#2a2f3f] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        wp.activityLevel === 'critical'
                          ? 'bg-red-500 animate-pulse'
                          : wp.activityLevel === 'high'
                          ? 'bg-orange-500 animate-pulse'
                          : wp.activityLevel === 'elevated'
                          ? 'bg-yellow-500'
                          : wp.activityLevel === 'normal'
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <span className="text-xs text-gray-500 uppercase">
                      {wp.activityLevel}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {wp.shortName}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* News feed */}
        <section>
          <NewsFeed
            items={newsItems}
            selectedWatchpoint={selectedWatchpoint}
            isLoading={isRefreshing || isInitialLoad}
            onRefresh={handleRefresh}
          />
          {lastFetched && !isRefreshing && (
            <p className="text-center text-xs text-gray-600 mt-4">
              Last updated: {new Date(lastFetched).toLocaleTimeString()}
            </p>
          )}
        </section>
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-20" />
    </div>
  );
}

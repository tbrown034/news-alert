'use client';

import { useState } from 'react';
import { WatchpointSelector, NewsFeed } from '@/components';
import { watchpoints, mockNewsItems } from '@/lib/mockData';
import { WatchpointId } from '@/types';
import { BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';

export default function Home() {
  const [selectedWatchpoint, setSelectedWatchpoint] = useState<WatchpointId>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Count breaking news
  const breakingCount = mockNewsItems.filter((item) => item.isBreaking).length;

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
            items={mockNewsItems}
            selectedWatchpoint={selectedWatchpoint}
            isLoading={isRefreshing}
            onRefresh={handleRefresh}
          />
        </section>
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-20" />
    </div>
  );
}

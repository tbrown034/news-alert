'use client';

import { useState, useEffect, useCallback } from 'react';
import { WatchpointSelector, NewsFeed, Legend, WorldMap, SituationBriefing, SeismicMap, WeatherMap, OutagesMap, TravelMap, FiresMap } from '@/components';
import { watchpoints as defaultWatchpoints } from '@/lib/mockData';
import { NewsItem, WatchpointId, Watchpoint, Earthquake } from '@/types';
import { SparklesIcon, GlobeAltIcon, CloudIcon, SignalIcon, ExclamationTriangleIcon, FireIcon } from '@heroicons/react/24/outline';
import { BoltIcon, MapPinIcon } from '@heroicons/react/24/solid';

interface ApiResponse {
  items: NewsItem[];
  activity: Record<string, { level: string; count: number; breaking: number }>;
  fetchedAt: string;
  totalItems: number;
}

type HeroView = 'hotspots' | 'seismic' | 'weather' | 'outages' | 'travel' | 'fires';

export default function Home() {
  const [selectedWatchpoint, setSelectedWatchpoint] = useState<WatchpointId>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [watchpoints, setWatchpoints] = useState<Watchpoint[]>(defaultWatchpoints);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [activityData, setActivityData] = useState<ApiResponse['activity'] | null>(null);

  // Hero view mode (hotspots vs seismic)
  const [heroView, setHeroView] = useState<HeroView>('hotspots');
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [seismicLoading, setSeismicLoading] = useState(false);

  // Activity level priority for auto-selection
  const activityPriority: Record<string, number> = {
    critical: 4,
    high: 3,
    elevated: 2,
    normal: 1,
  };

  const fetchNews = useCallback(async (autoSelectHottest = false) => {
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
        setActivityData(data.activity);
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

        // On initial load, auto-select the region with highest activity
        if (autoSelectHottest) {
          const regions = Object.entries(data.activity)
            .filter(([id]) => id !== 'all')
            .map(([id, activity]) => ({
              id: id as WatchpointId,
              priority: activityPriority[activity.level] || 0,
            }))
            .sort((a, b) => b.priority - a.priority);

          // Select hottest region if it's elevated or higher
          if (regions.length > 0 && regions[0].priority >= 2) {
            setSelectedWatchpoint(regions[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [selectedWatchpoint]);

  // Fetch on mount (with auto-select hottest region) and when watchpoint changes
  useEffect(() => {
    fetchNews(isInitialLoad);
  }, [fetchNews, isInitialLoad]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchNews, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const handleRefresh = () => {
    fetchNews();
  };

  // Fetch earthquake data when seismic view is active
  const fetchEarthquakes = useCallback(async () => {
    setSeismicLoading(true);
    try {
      const response = await fetch('/api/seismic?period=day&minMag=2.5');
      const data = await response.json();
      if (data.earthquakes) {
        setEarthquakes(data.earthquakes.map((eq: any) => ({
          ...eq,
          time: new Date(eq.time),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch earthquakes:', error);
    } finally {
      setSeismicLoading(false);
    }
  }, []);

  // Fetch earthquakes when switching to seismic view
  useEffect(() => {
    if (heroView === 'seismic' && earthquakes.length === 0) {
      fetchEarthquakes();
    }
  }, [heroView, earthquakes.length, fetchEarthquakes]);

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
              <GlobeAltIcon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[15px] font-bold text-white leading-none">Sentinel</h1>
              <p className="text-[11px] text-gray-500 leading-none mt-0.5">Global intelligence, real-time</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowBriefing(true)}
              className="p-2.5 hover:bg-white/[0.03] rounded-full transition-colors relative group"
              title="AI Situation Briefing"
            >
              <SparklesIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Map with view tabs */}
      <div className="relative">
        {/* View Mode Tabs */}
        <div className="absolute top-3 right-4 z-20 flex gap-1 bg-black/60 backdrop-blur-sm rounded-full p-1">
          <button
            onClick={() => setHeroView('hotspots')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${heroView === 'hotspots'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <MapPinIcon className="w-3.5 h-3.5" />
            Hotspots
          </button>
          <button
            onClick={() => setHeroView('seismic')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${heroView === 'seismic'
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <GlobeAltIcon className="w-3.5 h-3.5" />
            Seismic
          </button>
          <button
            onClick={() => setHeroView('weather')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${heroView === 'weather'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <CloudIcon className="w-3.5 h-3.5" />
            Weather
          </button>
          <button
            onClick={() => setHeroView('outages')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${heroView === 'outages'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <SignalIcon className="w-3.5 h-3.5" />
            Outages
          </button>
          <button
            onClick={() => setHeroView('travel')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${heroView === 'travel'
                ? 'bg-rose-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Travel
          </button>
          <button
            onClick={() => setHeroView('fires')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${heroView === 'fires'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <FireIcon className="w-3.5 h-3.5" />
            Fires
          </button>
        </div>

        {/* Map Views */}
        {heroView === 'hotspots' && (
          <WorldMap
            watchpoints={watchpoints}
            selected={selectedWatchpoint}
            onSelect={setSelectedWatchpoint}
            regionCounts={regionCounts}
          />
        )}
        {heroView === 'seismic' && (
          <SeismicMap
            earthquakes={earthquakes}
            selected={selectedQuake}
            onSelect={setSelectedQuake}
            isLoading={seismicLoading}
          />
        )}
        {heroView === 'weather' && (
          <WeatherMap />
        )}
        {heroView === 'outages' && (
          <OutagesMap />
        )}
        {heroView === 'travel' && (
          <TravelMap />
        )}
        {heroView === 'fires' && (
          <FiresMap />
        )}
      </div>

      {/* Main content */}
      <main className="max-w-xl mx-auto">
        {/* News feed */}
        <NewsFeed
          items={newsItems}
          selectedWatchpoint={selectedWatchpoint}
          onSelectWatchpoint={setSelectedWatchpoint}
          isLoading={isRefreshing || isInitialLoad}
          onRefresh={handleRefresh}
          activity={activityData || undefined}
        />
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-20" />

      {/* Legend */}
      <Legend />

      {/* AI Situation Briefing Modal */}
      {showBriefing && (
        <SituationBriefing
          region={selectedWatchpoint}
          onClose={() => setShowBriefing(false)}
        />
      )}
    </div>
  );
}

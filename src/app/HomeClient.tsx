'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NewsFeed, Legend, WorldMap, SeismicMap, WeatherMap, OutagesMap, TravelMap, FiresMap, AuthButton } from '@/components';
import type { TFRMarker, FireMarker } from '@/components/WorldMap';
import { EditorialFAB } from '@/components/EditorialFAB';
import { ErrorBoundary, FeedSkeleton, MapSkeleton } from '@/components/ErrorBoundary';
import { watchpoints as defaultWatchpoints } from '@/lib/mockData';
import { NewsItem, WatchpointId, Watchpoint, Earthquake } from '@/types';
import { useClock } from '@/hooks/useClock';
import { GlobeAltIcon, CloudIcon, SignalIcon, ExclamationTriangleIcon, FireIcon, EllipsisHorizontalIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, SunIcon, MoonIcon, InformationCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/lib/auth-client';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { RegionActivity } from '@/lib/activityDetection';
import { tier1Sources, tier2Sources, tier3Sources } from '@/lib/sources-clean';

interface ApiResponse {
  items: NewsItem[];
  activity: Record<string, RegionActivity>;
  fetchedAt: string;
  totalItems: number;
  tiers?: string[];
  hoursWindow?: number;
  sourcesCount?: number;
  isIncremental?: boolean;
}

type HeroView = 'main' | 'seismic' | 'weather' | 'outages' | 'travel' | 'fires' | 'combined';

const HERO_MAIN_TABS = [
  { id: 'main', label: 'Main', icon: GlobeAltIcon, color: 'blue' },
  { id: 'seismic', label: 'Seismic', icon: MapPinIcon, color: 'amber' },
] as const;

const HERO_SECONDARY_TABS = [
  { id: 'weather', label: 'Weather', icon: CloudIcon, color: 'cyan' },
  { id: 'outages', label: 'Outages', icon: SignalIcon, color: 'purple' },
  { id: 'travel', label: 'Travel', icon: ExclamationTriangleIcon, color: 'rose' },
  { id: 'fires', label: 'Fires', icon: FireIcon, color: 'orange' },
  { id: 'combined', label: 'Combined', icon: GlobeAltIcon, color: 'blue' },
] as const;

const HERO_ALL_TABS = [...HERO_MAIN_TABS, ...HERO_SECONDARY_TABS];

interface HomeClientProps {
  initialData: ApiResponse | null;
  initialRegion: WatchpointId;
  initialMapFocus?: WatchpointId; // Focus map here without filtering feed
}

export default function HomeClient({ initialData, initialRegion, initialMapFocus }: HomeClientProps) {
  const { data: session } = useSession();
  const [selectedWatchpoint, setSelectedWatchpointState] = useState<WatchpointId>(initialRegion);

  // Simple region setter (no persistence - always starts at "All")
  const setSelectedWatchpoint = useCallback((region: WatchpointId) => {
    setSelectedWatchpointState(region);
  }, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    if (!initialData?.items) return [];
    return initialData.items.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  });
  const [watchpoints, setWatchpoints] = useState<Watchpoint[]>(() => {
    if (!initialData?.activity) return defaultWatchpoints;
    return defaultWatchpoints.map(wp => {
      const activity = initialData.activity[wp.id];
      if (activity) {
        return { ...wp, activityLevel: activity.level as Watchpoint['activityLevel'] };
      }
      return wp;
    });
  });
  const [lastFetched, setLastFetched] = useState<string | null>(initialData?.fetchedAt || null);
  const [activityData, setActivityData] = useState<ApiResponse['activity'] | null>(initialData?.activity || null);
  const [activityConfirmed, setActivityConfirmed] = useState(false); // True after client-side fetch confirms fresh data
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsLoadTimeMs, setNewsLoadTimeMs] = useState<number | null>(null);
  const [hoursWindow, setHoursWindow] = useState<number>(initialData?.hoursWindow || 6);

  // Live update settings
  const [pendingItems, setPendingItems] = useState<NewsItem[]>([]); // Buffer for new items
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true); // Default to true, load from localStorage in useEffect
  const [displayLimit, setDisplayLimit] = useState<number>(50); // Pagination: how many to show

  // Hero view mode
  const [heroView, setHeroView] = useState<HeroView>('main');
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [significantQuakes, setSignificantQuakes] = useState<Earthquake[]>([]); // 6.0+ for Main view
  const [tfrs, setTfrs] = useState<TFRMarker[]>([]); // Active TFRs for map
  const [fireMarkers, setFireMarkers] = useState<FireMarker[]>([]); // Active fires for map
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [seismicLoading, setSeismicLoading] = useState(false);
  const [seismicLastFetched, setSeismicLastFetched] = useState<Date | null>(null);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [showPanel, setShowPanel] = useState<'activity' | 'info' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [useUTC, setUseUTC] = useState(false);
  const currentTime = useClock();

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Format time for header display
  const formatHeaderTime = () => {
    // Return placeholder during SSR/hydration to avoid mismatch
    if (!currentTime) return '—';

    if (useUTC) {
      return currentTime.toLocaleString('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' UTC';
    }
    return currentTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
  };

  // Initialize autoUpdate preference from localStorage (after hydration)
  useEffect(() => {
    const saved = localStorage.getItem('news-auto-update');
    if (saved !== null) {
      setAutoUpdate(saved === 'true');
    }
  }, []);


  // Toggle theme and persist to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Ref for dropdown click-outside handling
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic source count
  const totalSources = tier1Sources.length + tier2Sources.length + tier3Sources.length;

  // Ref to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  // Check if we have ACTUAL data, not just an empty response
  const hasInitialData = useRef(!!(initialData?.items?.length));

  // Toggle auto-update preference (saves to localStorage in handler, not useEffect)
  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdate(prev => {
      const newValue = !prev;
      localStorage.setItem('news-auto-update', String(newValue));
      return newValue;
    });
  }, []);

  // Show pending items (user clicked the "X new posts" banner)
  const showPendingItems = useCallback(() => {
    if (pendingItems.length === 0) return;

    setNewsItems(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const unique = pendingItems.filter(i => !existingIds.has(i.id));

      if (unique.length === 0) return prev;

      // Sort new items by timestamp (newest first among new items)
      const sortedNew = unique.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      // PREPEND only - never insert in middle of existing feed
      return [...sortedNew, ...prev];
    });

    setPendingItems([]);
  }, [pendingItems]);

  // Fetch incremental updates (only items newer than lastFetched)
  // Uses prepend-only logic - new items always appear at top, never mid-feed
  const fetchIncremental = useCallback(async () => {
    if (!lastFetched || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Always fetch ALL regions for incremental - filtering is client-side
      const since = encodeURIComponent(lastFetched);
      const response = await fetch(
        `/api/news?region=all&hours=6&limit=100&since=${since}`
      );

      if (!response.ok) return;

      const data: ApiResponse = await response.json();

      if (data.items.length > 0) {
        const newItems = data.items.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));

        // Use functional updates to avoid depending on newsItems/pendingItems state
        if (autoUpdate) {
          // Auto-update ON: Prepend new items directly to feed
          setNewsItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
            if (uniqueNewItems.length === 0) return prev;
            const sortedNew = uniqueNewItems.sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );
            return [...sortedNew, ...prev];
          });
        } else {
          // Auto-update OFF: Add to pending buffer
          setPendingItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
            if (uniqueNewItems.length === 0) return prev;
            return [...prev, ...uniqueNewItems];
          });
        }
      }

      // Update lastFetched for next incremental fetch
      setLastFetched(data.fetchedAt);

      // Update activity data if provided
      if (data.activity) {
        setActivityData(data.activity);
        setActivityConfirmed(true); // Mark as confirmed from client fetch
        setWatchpoints((prev) =>
          prev.map((wp) => {
            const activity = data.activity[wp.id];
            if (activity) {
              return { ...wp, activityLevel: activity.level as Watchpoint['activityLevel'] };
            }
            return wp;
          })
        );
      }
    } catch {
      // Incremental fetch is non-critical, fail silently
    } finally {
      isFetchingRef.current = false;
    }
  }, [lastFetched, autoUpdate]); // Removed selectedWatchpoint - always fetches 'all'

  const fetchNews = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    setIsRefreshing(true);
    setNewsError(null);
    const startTime = Date.now();

    try {
      // Always fetch ALL regions - client-side filtering handles display
      // This prevents refetching when switching tabs
      const response = await fetch(`/api/news?region=all&hours=6&limit=2000`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      const elapsed = Date.now() - startTime;
      setNewsLoadTimeMs(elapsed);

      const items = data.items.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));

      setNewsItems(items);
      setLastFetched(data.fetchedAt);
      setDisplayLimit(50); // Reset pagination on fresh fetch
      if (data.hoursWindow) setHoursWindow(data.hoursWindow);

      if (data.activity) {
        setActivityData(data.activity);
        setActivityConfirmed(true); // Mark as confirmed from client fetch
        setWatchpoints((prev) =>
          prev.map((wp) => {
            const activity = data.activity[wp.id];
            if (activity) {
              return { ...wp, activityLevel: activity.level as Watchpoint['activityLevel'] };
            }
            return wp;
          })
        );
      }

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        setNewsError('Request timed out. Try again in a moment.');
      } else {
        setNewsError(error instanceof Error ? error.message : 'Failed to load news feed');
      }
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []); // No dependencies - always fetches 'all'

  // Store latest callbacks in refs to avoid useEffect dependency issues
  const fetchNewsRef = useRef(fetchNews);
  const fetchIncrementalRef = useRef(fetchIncremental);
  useEffect(() => { fetchNewsRef.current = fetchNews; }, [fetchNews]);
  useEffect(() => { fetchIncrementalRef.current = fetchIncremental; }, [fetchIncremental]);

  // Initial data fetch (once on mount)
  // Region changes are handled client-side via filtering - no refetch needed
  useEffect(() => {
    if (hasInitialData.current) {
      hasInitialData.current = false;
      // We have SSR data - fetch any items newer than fetchedAt (fills the gap)
      fetchIncrementalRef.current();
    } else {
      // No SSR data (failed or timed out) - do a full fetch
      fetchNewsRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 5 minutes using incremental updates
  useEffect(() => {
    const interval = setInterval(() => fetchIncrementalRef.current(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEarthquakes = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    setSeismicLoading(true);

    try {
      const response = await fetch('/api/seismic?period=day&minMag=4.5', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      if (data.earthquakes) {
        setEarthquakes(data.earthquakes.map((eq: any) => ({
          ...eq,
          time: new Date(eq.time),
        })));
        setSeismicLastFetched(new Date());
      }
    } catch {
      clearTimeout(timeoutId);
    } finally {
      setSeismicLoading(false);
    }
  }, []);

  // Handler for changing hero view - fetches data when needed (not in useEffect)
  const handleHeroViewChange = useCallback((view: HeroView) => {
    setHeroView(view);
    // Fetch earthquake data when seismic tab is opened (if not already loaded)
    if ((view === 'seismic' || view === 'combined') && earthquakes.length === 0) {
      fetchEarthquakes();
    }
  }, [earthquakes.length, fetchEarthquakes]);

  // Fetch significant earthquakes (6.0+) for Main view on mount
  useEffect(() => {
    const fetchSignificantQuakes = async () => {
      try {
        const response = await fetch('/api/seismic?period=day&minMag=6');
        if (!response.ok) return;
        const data = await response.json();
        if (data.earthquakes) {
          setSignificantQuakes(data.earthquakes.map((eq: any) => ({
            ...eq,
            time: new Date(eq.time),
          })));
        }
      } catch {
        // Silent fail for Main view - earthquakes are supplementary
      }
    };
    fetchSignificantQuakes();

    // Fetch active TFRs for map markers
    const fetchTFRs = async () => {
      try {
        const response = await fetch('/api/tfr');
        if (!response.ok) return;
        const data = await response.json();
        if (data.tfrs) {
          setTfrs(data.tfrs.map((tfr: any) => ({
            id: tfr.id,
            title: tfr.title,
            coordinates: tfr.coordinates as [number, number],
            tfrType: tfr.tfrType,
            state: tfr.state,
            severity: tfr.severity,
          })));
        }
      } catch {
        // Silent fail — TFRs are supplementary
      }
    };
    fetchTFRs();

    // Fetch active fires for map markers
    const fetchFires = async () => {
      try {
        const response = await fetch('/api/fires');
        if (!response.ok) return;
        const data = await response.json();
        if (data.fires) {
          setFireMarkers(data.fires.map((fire: any) => ({
            id: fire.id,
            title: fire.title,
            coordinates: fire.coordinates as [number, number],
            severity: fire.severity,
            brightness: fire.brightness || 0,
            source: fire.source,
          })));
        }
      } catch {
        // Silent fail — fires are supplementary
      }
    };
    fetchFires();
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!moreDropdownRef.current?.contains(target)) {
        setShowMoreTabs(false);
      }
    };
    if (showMoreTabs) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreTabs]);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const uniqueSources = useMemo(() => new Set(newsItems.map(i => i.source.id)).size, [newsItems]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => {
                setSelectedWatchpoint('all');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
              aria-label="News Pulse home - reset to all regions"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center shadow-md shadow-black/30 border border-slate-700">
                <svg viewBox="0 0 32 32" className="w-6 h-6 sm:w-7 sm:h-7">
                  {/* Bold P */}
                  <text x="8" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="700" fill="#ffffff">P</text>
                  {/* Pulse line */}
                  <path d="M4 26 L10 26 L12 23 L14 29 L16 24 L18 26 L28 26" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-bold headline text-slate-900 dark:text-white">
                  News Pulse
                </h1>
                <p className="text-2xs sm:text-xs font-medium tracking-wide hidden xs:block text-cyan-600 dark:text-cyan-400">
                  News before it&apos;s news
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="#map"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
              >
                Map
              </a>
              <a
                href="#feed"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
              >
                Feed
              </a>
              <a
                href="/news"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
              >
                News
              </a>
              <a
                href="/conditions"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
              >
                Conditions
              </a>
              <a
                href="/about"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
              >
                About
              </a>
              {session && (
                <a
                  href="/admin"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
                >
                  Admin
                </a>
              )}
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
              <AuthButton />
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>

{/* Mobile Menu - Compact Dropdown */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop - invisible but catches clicks */}
              <div
                className="fixed inset-0 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Dropdown */}
              <div className="absolute top-full right-4 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 md:hidden overflow-hidden">
                {/* Navigation */}
                <div className="py-1">
                  <a
                    href="#map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Map
                  </a>
                  <a
                    href="#feed"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Feed
                  </a>
                  <a
                    href="/news"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    News
                  </a>
                  <a
                    href="/conditions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Conditions
                  </a>
                  <a
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    About
                  </a>
                  {session && (
                    <a
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Admin
                    </a>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700" />

                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                  {theme === 'dark' ? (
                    <SunIcon className="w-4 h-4 text-slate-400" />
                  ) : (
                    <MoonIcon className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700" />

                {/* Account */}
                <div className="py-1">
                  <AuthButton variant="dropdown" onNavigate={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Hero Map Section */}
      <section id="map" className="max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-3 sm:px-4 pt-4">
          <div className="relative bg-slate-100 dark:bg-slate-900 rounded-t-2xl border border-slate-300 dark:border-slate-600 border-b-0 shadow-lg shadow-black/5 dark:shadow-black/30">
            {/* Map Header with integrated tabs - outside overflow-hidden so dropdowns work */}
            <div className="relative z-10 px-3 sm:px-4 py-2 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 rounded-t-2xl">
              <div className="flex items-center justify-between gap-2">
                {/* Dynamic Title */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {heroView === 'main' && (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Global Monitor</h2>
                      </div>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-6">{formatHeaderTime()}</span>
                    </div>
                  )}
                  {heroView === 'seismic' && (
                    <>
                      <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Seismic Activity</h2>
                    </>
                  )}
                  {heroView === 'weather' && (
                    <>
                      <CloudIcon className="w-4 h-4 text-sky-500" />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Weather Alerts</h2>
                    </>
                  )}
                  {heroView === 'outages' && (
                    <>
                      <SignalIcon className="w-4 h-4 text-purple-500" />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Internet Outages</h2>
                    </>
                  )}
                  {heroView === 'travel' && (
                    <>
                      <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Travel Advisories</h2>
                    </>
                  )}
                  {heroView === 'fires' && (
                    <>
                      <FireIcon className="w-4 h-4 text-orange-500" />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Wildfire Tracker</h2>
                    </>
                  )}
                  {heroView === 'combined' && (
                    <>
                      <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Combined Monitor</h2>
                    </>
                  )}
                </div>

                {/* Tabs - right side: Main + Seismic visible, rest in More dropdown */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1">
                    {HERO_MAIN_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleHeroViewChange(tab.id)}
                        className={`
                          flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                          ${heroView === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                          }
                        `}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                    {/* More dropdown for secondary tabs */}
                    <div className="relative" ref={moreDropdownRef}>
                      <button
                        onClick={() => setShowMoreTabs(!showMoreTabs)}
                        className={`
                          flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                          ${HERO_SECONDARY_TABS.some(t => t.id === heroView)
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                          }
                        `}
                      >
                        <EllipsisHorizontalIcon className="w-3.5 h-3.5 sm:hidden" />
                        <span className="hidden sm:inline">More</span>
                        <ChevronDownIcon className={`hidden sm:block w-3 h-3 transition-transform ${showMoreTabs ? 'rotate-180' : ''}`} />
                      </button>
                      {showMoreTabs && (
                        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-50">
                          {HERO_SECONDARY_TABS.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                handleHeroViewChange(tab.id);
                                setShowMoreTabs(false);
                              }}
                              className={`
                                w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors
                                ${heroView === tab.id
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }
                              `}
                            >
                              <tab.icon className="w-4 h-4" />
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Map content area - overflow-hidden to clip maps while allowing header dropdowns */}
            <div className="overflow-hidden">
              <ErrorBoundary section="Map" fallback={<MapSkeleton />}>
              {heroView === 'main' && (
                <WorldMap
                  watchpoints={watchpoints}
                  selected={selectedWatchpoint}
                  onSelect={setSelectedWatchpoint}
                  activity={activityData || undefined}
                  hoursWindow={hoursWindow}
                  useUTC={useUTC}
                  initialFocus={initialMapFocus}
                />
              )}
              {heroView === 'seismic' && (
                <SeismicMap
                  earthquakes={earthquakes}
                  selected={selectedQuake}
                  onSelect={setSelectedQuake}
                  isLoading={seismicLoading}
                  lastFetched={seismicLastFetched}
                  onRefresh={fetchEarthquakes}
                />
              )}
              {heroView === 'weather' && <WeatherMap />}
              {heroView === 'outages' && <OutagesMap />}
              {heroView === 'travel' && <TravelMap />}
              {heroView === 'fires' && <FiresMap />}
              {heroView === 'combined' && (
                <WorldMap
                  watchpoints={watchpoints}
                  selected={selectedWatchpoint}
                  onSelect={setSelectedWatchpoint}
                  activity={activityData || undefined}
                  significantQuakes={significantQuakes}
                  tfrs={tfrs}
                  fires={fireMarkers}
                  hoursWindow={hoursWindow}
                  useUTC={useUTC}
                />
              )}
              </ErrorBoundary>
            </div>
          </div>

        {/* Status Bar - flush against map bottom */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-b-2xl border-x border-b border-slate-300 dark:border-slate-600 -mt-[1px] text-xs text-slate-500 dark:text-slate-400 shadow-lg shadow-black/5 dark:shadow-black/30">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-3">

            {/* Seismic Legend */}
            {heroView === 'seismic' && (
              <div className="flex items-center gap-3">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Magnitude:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>7+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>6+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>5+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span>4+</span>
                </div>
              </div>
            )}

            {/* Weather Legend */}
            {heroView === 'weather' && (
              <div className="flex items-center gap-3">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Severity:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Extreme</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Severe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Moderate</span>
                </div>
              </div>
            )}

            {/* Combined Legend */}
            {heroView === 'combined' && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>Elevated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Critical</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span>Quake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <span>Fire</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>TFR</span>
                </div>
              </div>
            )}

            {/* Fires Legend */}
            {heroView === 'fires' && (
              <div className="flex items-center gap-3">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Severity:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>Severe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Moderate</span>
                </div>
              </div>
            )}

            {/* Outages Legend */}
            {heroView === 'outages' && (
              <div className="flex items-center gap-3">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Severity:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Severe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Moderate</span>
                </div>
              </div>
            )}

            {/* Travel Legend */}
            {heroView === 'travel' && (
              <div className="flex items-center gap-3">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Advisory:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Do Not Travel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Reconsider</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Caution</span>
                </div>
              </div>
            )}

            {/* Main View - Activity Indicators */}
            {heroView === 'main' && (() => {
              const regionNames: Record<string, string> = {
                'us': 'US',
                'middle-east': 'MidEast',
                'europe-russia': 'Europe',
                'asia': 'Asia',
                'latam': 'LatAm',
                'africa': 'Africa',
              };

              // Show loading state until activity is confirmed from client fetch
              // This prevents stale cached data from showing false elevated/critical
              if (!activityConfirmed) {
                return (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      Checking feed activity...
                    </span>
                  </div>
                );
              }

              // Get all regions with elevated or critical activity
              const elevatedRegions = activityData
                ? Object.entries(activityData)
                    .filter(([, data]) => data.level === 'elevated' || data.level === 'critical')
                    .sort((a, b) => (b[1].multiplier || 0) - (a[1].multiplier || 0)) // Sort by multiplier desc
                : [];

              const hasElevated = elevatedRegions.length > 0;
              const hasCritical = elevatedRegions.some(([, data]) => data.level === 'critical');

              return (
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      hasCritical ? 'bg-red-500 animate-pulse' : hasElevated ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <span className={`font-medium ${
                      hasCritical
                        ? 'text-red-600 dark:text-red-400'
                        : hasElevated
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      Feed Activity: {hasCritical ? 'Surging Across Regions' : hasElevated ? 'Above Typical Levels' : 'Normal'}
                    </span>
                    {!hasElevated && (
                      <span className="text-slate-500 dark:text-slate-500 text-xs">for this time of day</span>
                    )}
                  </div>

                  {/* Show elevated regions - clickable to filter */}
                  {elevatedRegions.slice(0, 3).map(([regionId, data]) => {
                    const isCritical = data.level === 'critical';
                    const color = isCritical ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400';
                    const hoverColor = isCritical ? 'hover:text-red-500 dark:hover:text-red-300' : 'hover:text-orange-500 dark:hover:text-orange-300';
                    const dotColor = isCritical ? 'bg-red-500' : 'bg-orange-500';
                    const pctText = data.percentChange ? `+${data.percentChange}%` : '';
                    return (
                      <button
                        key={regionId}
                        onClick={() => setSelectedWatchpoint(regionId as WatchpointId)}
                        className={`flex items-center gap-1 ${hoverColor} transition-colors`}
                        title={`Filter to ${regionNames[regionId] || regionId}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCritical ? 'animate-pulse' : ''}`} />
                        <span className={`text-xs ${color} font-medium`}>
                          {regionNames[regionId] || regionId} {pctText} Vs Typical
                        </span>
                      </button>
                    );
                  })}
                  {elevatedRegions.length > 3 && (
                    <span className="text-2xs text-slate-500 dark:text-slate-400">+{elevatedRegions.length - 3}</span>
                  )}
                </div>
              );
            })()}
          </div>
          {/* Panel toggle buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPanel(showPanel === 'activity' ? null : 'activity')}
              className={`flex items-center gap-1 px-2 py-1 text-2xs font-medium rounded transition-colors ${
                showPanel === 'activity'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
              aria-expanded={showPanel === 'activity'}
            >
              <ChartBarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </button>
            <button
              onClick={() => setShowPanel(showPanel === 'info' ? null : 'info')}
              className={`flex items-center gap-1 px-2 py-1 text-2xs font-medium rounded transition-colors ${
                showPanel === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
              aria-expanded={showPanel === 'info'}
            >
              <InformationCircleIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Info</span>
            </button>
          </div>
        </div>

        {/* Activity Thermometer Panel */}
        {showPanel === 'activity' && (
          <div className="mt-1 px-3 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Feed Activity Monitor</div>
                <div className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">
                  How many posts we collected vs how many we&apos;d expect right now
                </div>
              </div>
              <div className="flex items-center gap-3 text-2xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Normal</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Elevated</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Critical</span>
              </div>
            </div>

            {/* Thermometer bars per region */}
            {activityData && (() => {
              const scoredRegions = [
                { id: 'us', label: 'US' },
                { id: 'middle-east', label: 'MidEast' },
                { id: 'europe-russia', label: 'Europe' },
              ] as const;
              const excludedRegions = [
                { id: 'asia', label: 'Asia' },
                { id: 'latam', label: 'LatAm' },
                { id: 'africa', label: 'Africa' },
              ] as const;

              const renderBar = (regionId: string, label: string, excluded: boolean = false) => {
                const data = activityData[regionId as WatchpointId];
                if (!data) return null;

                const { count, baseline, multiplier, level } = data;
                // Scale: 6x baseline gives room to show critical (5x) marker visibly
                const maxScale = Math.max(6 * baseline, count * 1.1, baseline);
                const fillPct = Math.min((count / maxScale) * 100, 100);
                const baselinePct = (baseline / maxScale) * 100;
                const elevatedPct = ((2.5 * baseline) / maxScale) * 100;
                const criticalPct = ((5 * baseline) / maxScale) * 100;

                const barColor = excluded
                  ? 'bg-slate-400 dark:bg-slate-500'
                  : level === 'critical'
                    ? 'bg-red-500'
                    : level === 'elevated'
                      ? 'bg-amber-500'
                      : multiplier < 0.5
                        ? 'bg-blue-400 dark:bg-blue-500'
                        : 'bg-emerald-500';

                const labelColor = excluded
                  ? 'text-slate-400 dark:text-slate-500'
                  : level === 'critical'
                    ? 'text-red-500'
                    : level === 'elevated'
                      ? 'text-amber-500'
                      : 'text-slate-600 dark:text-slate-300';

                return (
                  <div key={regionId} className="flex items-center gap-2">
                    {/* Region label */}
                    <div className={`w-14 text-right text-2xs font-medium ${labelColor} tabular-nums shrink-0`}>
                      {label}
                    </div>

                    {/* Thermometer bar */}
                    <div className="flex-1 relative h-4 bg-slate-200/60 dark:bg-slate-800/80 rounded-full overflow-hidden">
                      {/* Fill */}
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${fillPct}%` }}
                      />

                      {/* Baseline marker (1x) */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-slate-500 dark:bg-slate-400 z-10"
                        style={{ left: `${baselinePct}%` }}
                        title={`Expected: ${baseline} posts for this time of day`}
                      >
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
                      </div>

                      {/* Elevated threshold marker (2.5x) — only for scored regions */}
                      {!excluded && elevatedPct < 98 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-amber-500/40 z-10"
                          style={{ left: `${elevatedPct}%` }}
                          title="Elevated: 2.5× expected volume"
                        />
                      )}

                      {/* Critical threshold marker (5x) — only for scored regions */}
                      {!excluded && criticalPct < 98 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-500/40 z-10"
                          style={{ left: `${criticalPct}%` }}
                          title="Critical: 5× expected volume"
                        />
                      )}
                    </div>

                    {/* Numeric readout */}
                    <div className="w-28 sm:w-36 flex items-center gap-1 shrink-0">
                      <span className={`text-2xs font-mono tabular-nums ${labelColor}`}>
                        {count} <span className="font-sans text-slate-400 dark:text-slate-500">posts</span> / {baseline} <span className="font-sans text-slate-400 dark:text-slate-500">exp</span>
                      </span>
                      <span className={`text-2xs font-mono tabular-nums ${
                        excluded ? 'text-slate-400 dark:text-slate-500' :
                        multiplier >= 5 ? 'text-red-500 font-semibold' :
                        multiplier >= 2.5 ? 'text-amber-500 font-semibold' :
                        multiplier < 0.5 ? 'text-blue-400' :
                        'text-slate-500 dark:text-slate-400'
                      }`}>
                        ({multiplier.toFixed(1)}x)
                      </span>
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-1.5">
                  {scoredRegions.map(r => renderBar(r.id, r.label))}
                  {/* Divider before excluded regions */}
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-700/50 my-1" />
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-2xs text-slate-400 dark:text-slate-500 italic">Low source coverage — activity levels not assessed</span>
                  </div>
                  {excludedRegions.map(r => renderBar(r.id, r.label, true))}
                </div>
              );
            })()}

            {!activityConfirmed && (
              <div className="text-2xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                Waiting for fresh data...
              </div>
            )}

            {/* How it works explanation */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
              <div className="text-2xs text-slate-400 dark:text-slate-500 leading-relaxed">
                <span className="font-medium text-slate-500 dark:text-slate-400">How it works:</span>{' '}
                We track how many posts each source typically publishes per day, then estimate how many
                we&apos;d expect in the last {hoursWindow} hours given the current time of day (sources post more during
                US/EU business hours). The <span className="inline-flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-slate-500 dark:bg-slate-400 inline-block" /></span> marker
                shows that expected count. When actual posts reach 2.5× the expected count (and 25+ posts),
                activity is elevated. At 5× (and 50+ posts), it&apos;s critical.
              </div>
            </div>
          </div>
        )}

        {/* Info Panel (stats, views, map key) */}
        {showPanel === 'info' && (
          <div className="mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            {/* Quick links to views */}
            <div>
              <div className="text-2xs text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Views</div>
              <div className="flex flex-wrap gap-2">
                {HERO_ALL_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = heroView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleHeroViewChange(tab.id as HeroView)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${
                        isActive
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Stats */}
            <div>
              <div className="text-2xs text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Stats</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Window:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{hoursWindow}h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Latency:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{newsLoadTimeMs ? `${(newsLoadTimeMs / 1000).toFixed(1)}s` : '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Sources:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{totalSources}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Map Time:</span>
                  <button
                    onClick={() => setUseUTC(!useUTC)}
                    className="font-mono text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    {useUTC ? 'UTC' : 'Local'}
                  </button>
                </div>
              </div>
            </div>
            {/* Map Key - view-specific */}
            <div>
              <div className="text-2xs text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Map Key</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                {heroView === 'main' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 text-2xs">({hoursWindow}h)</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Typical</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>2x+</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>4x+</span>
                    </span>
                  </div>
                )}
                {heroView === 'seismic' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span>M2.5+</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>M4.5+</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /><span>M6+</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span>M7+</span></span>
                  </div>
                )}
                {heroView === 'weather' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /><span>Advisory</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Watch</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /><span>Warning</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span>Emergency</span></span>
                  </div>
                )}
                {heroView === 'outages' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Minor</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /><span>Significant</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span>Major</span></span>
                  </div>
                )}
                {heroView === 'travel' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /><span>Level 1</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Level 2</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /><span>Level 3</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span>Level 4</span></span>
                  </div>
                )}
                {heroView === 'fires' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Low</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /><span>Moderate</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span>High</span></span>
                  </div>
                )}
                {heroView === 'combined' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span>Normal</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /><span>Elevated</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span>Critical</span></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span>Quake</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /><span>Fire</span></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /><span>TFR</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <main id="feed" className="max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-3 sm:px-4 pb-20 pt-4">
        <ErrorBoundary section="News Feed" fallback={<FeedSkeleton count={5} />}>
        <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 shadow-lg shadow-black/5 dark:shadow-black/30">
          <NewsFeed
            items={newsItems.slice(0, displayLimit)}
            selectedWatchpoint={selectedWatchpoint}
            onSelectWatchpoint={setSelectedWatchpoint}
            isLoading={isRefreshing}
            onRefresh={fetchNews}
            activity={activityData || undefined}
            lastUpdated={lastFetched}
            error={newsError}
            onRetry={fetchNews}
            loadTimeMs={newsLoadTimeMs}
            pendingCount={pendingItems.length}
            onShowPending={showPendingItems}
            autoUpdate={autoUpdate}
            onToggleAutoUpdate={toggleAutoUpdate}
            totalPosts={newsItems.length}
            uniqueSources={uniqueSources}
            hoursWindow={hoursWindow}
            allItemsForTrending={newsItems}
            allItems={newsItems}
          />

          {/* Load more button - shows when there are more items beyond displayLimit */}
          {(() => {
            const filteredTotal = selectedWatchpoint === 'all'
              ? newsItems.length
              : newsItems.filter(i => i.region === selectedWatchpoint).length;
            const remaining = filteredTotal - displayLimit;
            if (remaining <= 0) return null;
            return (
              <div className="px-4 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 50)}
                  className="w-full py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                  Load more ({remaining} remaining)
                </button>
              </div>
            );
          })()}
        </div>
        </ErrorBoundary>
      </main>

      <Legend />

      {/* Editorial FAB - only visible when admin is logged in */}
      {session && <EditorialFAB onPostCreated={fetchNews} />}
    </div>
  );
}

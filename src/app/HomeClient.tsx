"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  NewsFeed,
  WorldMap,
  SeismicMap,
} from "@/components";
import { EditorialFAB } from "@/components/EditorialFAB";
import {
  ErrorBoundary,
  FeedSkeleton,
  MapSkeleton,
} from "@/components/ErrorBoundary";
import { watchpoints as defaultWatchpoints } from "@/lib/mockData";
import { NewsItem, WatchpointId, Watchpoint, Earthquake } from "@/types";
import { useClock } from "@/hooks/useClock";
import {
  GlobeAltIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "@/lib/auth-client";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { RegionActivity } from "@/lib/activityDetection";
import { formatTimeAgo } from "@/lib/formatUtils";

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

type HeroView = "main" | "seismic";

const HERO_TABS = [
  { id: "main", label: "Main", icon: GlobeAltIcon, color: "blue" },
  { id: "seismic", label: "Seismic", icon: MapPinIcon, color: "amber" },
] as const;

interface HomeClientProps {
  initialData: ApiResponse | null;
  initialRegion: WatchpointId;
  initialMapFocus?: WatchpointId; // Focus map here without filtering feed
}

export default function HomeClient({
  initialData,
  initialRegion,
  initialMapFocus,
}: HomeClientProps) {
  const { data: session } = useSession();
  const [selectedWatchpoint, setSelectedWatchpointState] =
    useState<WatchpointId>(initialRegion);

  // Simple region setter (no persistence - always starts at "All")
  const setSelectedWatchpoint = useCallback((region: WatchpointId) => {
    setSelectedWatchpointState(region);
  }, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    if (!initialData?.items) return [];
    return initialData.items.map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  });
  const [watchpoints, setWatchpoints] = useState<Watchpoint[]>(() => {
    if (!initialData?.activity) return defaultWatchpoints;
    return defaultWatchpoints.map((wp) => {
      const activity = initialData.activity[wp.id];
      if (activity) {
        return {
          ...wp,
          activityLevel: activity.level as Watchpoint["activityLevel"],
        };
      }
      return wp;
    });
  });
  const [lastFetched, setLastFetched] = useState<string | null>(
    initialData?.fetchedAt || null,
  );
  const [activityData, setActivityData] = useState<
    ApiResponse["activity"] | null
  >(initialData?.activity || null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsLoadTimeMs, setNewsLoadTimeMs] = useState<number | null>(null);
  const [hoursWindow, setHoursWindow] = useState<number>(
    initialData?.hoursWindow || 6,
  );

  // Live update settings
  const [pendingItems, setPendingItems] = useState<NewsItem[]>([]); // Buffer for new items
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true); // Default to true, load from localStorage in useEffect
  const [displayLimit, setDisplayLimit] = useState<number>(50); // Pagination: how many to show

  // Hero view mode
  const [heroView, setHeroView] = useState<HeroView>("main");
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [significantQuakes, setSignificantQuakes] = useState<Earthquake[]>([]); // 6.0+ for Main view
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [quakePage, setQuakePage] = useState(0);
  const [seismicLoading, setSeismicLoading] = useState(false);
  const [seismicLastFetched, setSeismicLastFetched] = useState<Date | null>(
    null,
  );
  const [showPanel, setShowPanel] = useState<"activity" | null>(
    "activity",
  );
  const [useUTC] = useState(false);
  const currentTime = useClock();

  // Format time for header display
  const formatHeaderTime = () => {
    // Return placeholder during SSR/hydration to avoid mismatch
    if (!currentTime) return "—";

    // AP style: Friday, Feb. 27, 2026, 9:16 p.m. EST
    const AP_MONTHS = [
      "Jan.",
      "Feb.",
      "March",
      "April",
      "May",
      "June",
      "July",
      "Aug.",
      "Sept.",
      "Oct.",
      "Nov.",
      "Dec.",
    ];

    const formatAP = (d: Date, tz?: string) => {
      // Use Intl to get parts in the target timezone
      const parts = new Intl.DateTimeFormat("en-US", {
        ...(tz ? { timeZone: tz } : {}),
        weekday: "long",
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(d);

      const get = (type: string) =>
        parts.find((p) => p.type === type)?.value ?? "";
      const month = AP_MONTHS[parseInt(get("month")) - 1];
      const day = get("day");
      const year = get("year");
      const dayOfWeek = get("weekday");
      const hour = get("hour");
      const minute = get("minute");
      const period = get("dayPeriod")
        .toLowerCase()
        .replace("am", "a.m.")
        .replace("pm", "p.m.");

      return `${dayOfWeek}, ${month} ${day}, ${year}, ${hour}:${minute} ${period}`;
    };

    if (useUTC) {
      return formatAP(currentTime, "UTC") + " UTC";
    }

    // Get local timezone abbreviation
    const tzAbbr =
      new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(currentTime)
        .find((p) => p.type === "timeZoneName")?.value ?? "";

    return formatAP(currentTime) + " " + tzAbbr;
  };

  // Initialize autoUpdate preference from localStorage (after hydration)
  useEffect(() => {
    const saved = localStorage.getItem("news-auto-update");
    if (saved !== null) {
      setAutoUpdate(saved === "true");
    }
  }, []);

  // Toggle theme and persist to localStorage
  // Ref for dropdown click-outside handling

  // Ref to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  // Check if we have ACTUAL data, not just an empty response
  const hasInitialData = useRef(!!initialData?.items?.length);

  // Toggle auto-update preference (saves to localStorage in handler, not useEffect)
  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdate((prev) => {
      const newValue = !prev;
      localStorage.setItem("news-auto-update", String(newValue));
      return newValue;
    });
  }, []);

  // Show pending items (user clicked the "X new posts" banner)
  const showPendingItems = useCallback(() => {
    if (pendingItems.length === 0) return;

    setNewsItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const unique = pendingItems.filter((i) => !existingIds.has(i.id));

      if (unique.length === 0) return prev;

      // Sort new items by timestamp (newest first among new items)
      const sortedNew = unique.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
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
        `/api/news?region=all&hours=6&limit=100&since=${since}`,
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
          setNewsItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const uniqueNewItems = newItems.filter(
              (item) => !existingIds.has(item.id),
            );
            if (uniqueNewItems.length === 0) return prev;
            const sortedNew = uniqueNewItems.sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
            );
            return [...sortedNew, ...prev];
          });
        } else {
          // Auto-update OFF: Add to pending buffer
          setPendingItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const uniqueNewItems = newItems.filter(
              (item) => !existingIds.has(item.id),
            );
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
        setWatchpoints((prev) =>
          prev.map((wp) => {
            const activity = data.activity[wp.id];
            if (activity) {
              return {
                ...wp,
                activityLevel: activity.level as Watchpoint["activityLevel"],
              };
            }
            return wp;
          }),
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
        setWatchpoints((prev) =>
          prev.map((wp) => {
            const activity = data.activity[wp.id];
            if (activity) {
              return {
                ...wp,
                activityLevel: activity.level as Watchpoint["activityLevel"],
              };
            }
            return wp;
          }),
        );
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        setNewsError("Request timed out. Try again in a moment.");
      } else {
        setNewsError(
          error instanceof Error ? error.message : "Failed to load news feed",
        );
      }
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []); // No dependencies - always fetches 'all'

  // Store latest callbacks in refs to avoid useEffect dependency issues
  const fetchNewsRef = useRef(fetchNews);
  const fetchIncrementalRef = useRef(fetchIncremental);
  useEffect(() => {
    fetchNewsRef.current = fetchNews;
  }, [fetchNews]);
  useEffect(() => {
    fetchIncrementalRef.current = fetchIncremental;
  }, [fetchIncremental]);

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
  }, []);


  // Auto-refresh every 5 minutes using incremental updates
  useEffect(() => {
    const interval = setInterval(
      () => fetchIncrementalRef.current(),
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  const fetchEarthquakes = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    setSeismicLoading(true);

    try {
      const response = await fetch("/api/seismic?period=day&minMag=5", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      if (data.earthquakes) {
        setEarthquakes(
          data.earthquakes.map((eq: Earthquake & { time: string }) => ({
            ...eq,
            time: new Date(eq.time),
          })),
        );
        setSeismicLastFetched(new Date());
      }
    } catch {
      clearTimeout(timeoutId);
    } finally {
      setSeismicLoading(false);
    }
  }, []);

  // Handler for changing hero view - fetches data when needed (not in useEffect)
  const handleHeroViewChange = useCallback(
    (view: HeroView) => {
      setHeroView(view);
      // Close any open panel when switching views
      if (showPanel) setShowPanel(null);
      // Fetch earthquake data when seismic tab is opened (if not already loaded)
      if (view === "seismic" && earthquakes.length === 0) {
        fetchEarthquakes();
      }
    },
    [earthquakes.length, fetchEarthquakes, showPanel],
  );

  // Fetch significant earthquakes (6.0+) for Main view on mount
  useEffect(() => {
    const fetchSignificantQuakes = async () => {
      try {
        const response = await fetch("/api/seismic?period=day&minMag=6");
        if (!response.ok) return;
        const data = await response.json();
        if (data.earthquakes) {
          setSignificantQuakes(
            data.earthquakes.map((eq: Earthquake & { time: string }) => ({
              ...eq,
              time: new Date(eq.time),
            })),
          );
        }
      } catch {
        // Silent fail for Main view - earthquakes are supplementary
      }
    };
    fetchSignificantQuakes();

  }, []);

  const uniqueSources = useMemo(
    () => new Set(newsItems.map((i) => i.source.id)).size,
    [newsItems],
  );

  return (
    <>
      {/* Hero Map Section */}
      <section
        id="map"
        className="max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-3 sm:px-4 pt-4"
      >
        <div className="relative bg-background-card rounded-t-xl border border-border-card border-b-0 shadow-card">
          {/* Map Header with integrated tabs - outside overflow-hidden so dropdowns work */}
          <div className="relative z-10 px-3 sm:px-4 py-2 bg-background-card/80 backdrop-blur-sm border-b border-border-light rounded-t-xl">
            <div className="flex items-center justify-between gap-2">
              {/* Dynamic Title */}
              <div className="flex items-center gap-2 shrink-0">
                {heroView === "main" && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                      <h2 className="text-subhead">Global Monitor</h2>
                    </div>
                    <span className="text-xs font-mono text-foreground-muted ml-6">
                      {formatHeaderTime()}
                    </span>
                  </div>
                )}
                {heroView === "seismic" && (
                  <>
                    <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-subhead">Seismic Activity</h2>
                  </>
                )}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1">
                {HERO_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleHeroViewChange(tab.id)}
                    className={`
                        flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                        ${
                          heroView === tab.id
                            ? "bg-blue-600 text-white"
                            : "text-foreground-muted hover:text-foreground hover:bg-background-secondary"
                        }
                      `}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map content area - overflow-hidden to clip maps while allowing header dropdowns */}
          <div className="overflow-hidden">
            <ErrorBoundary section="Map" fallback={<MapSkeleton />}>
              {heroView === "main" && (
                <WorldMap
                  watchpoints={watchpoints}
                  selected={selectedWatchpoint}
                  onSelect={setSelectedWatchpoint}
                  activity={activityData || undefined}
                  significantQuakes={significantQuakes.filter(
                    (q) => q.magnitude >= 6,
                  )}
                  hoursWindow={hoursWindow}
                  useUTC={useUTC}
                  initialFocus={initialMapFocus}
                  locked
                />
              )}
              {heroView === "seismic" && (
                <SeismicMap
                  earthquakes={earthquakes}
                  selected={selectedQuake}
                  onSelect={setSelectedQuake}
                  isLoading={seismicLoading}
                  lastFetched={seismicLastFetched}
                  onRefresh={fetchEarthquakes}
                  locked
                />
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* Status Bar + Panels container - flush against map bottom */}
        <div className="bg-background-card rounded-b-xl border-x border-b border-border-card -mt-px shadow-card">
          {/* Seismic summary — seismic view only */}
          {heroView === "seismic" && (() => {
            const filtered = earthquakes.filter(eq => eq.magnitude >= 5.0);
            const largest = filtered.length > 0 ? Math.max(...filtered.map(eq => eq.magnitude)) : 0;
            const majorCount = filtered.filter(eq => eq.magnitude >= 6).length;
            const tsunamiCount = filtered.filter(eq => eq.tsunami).length;

            const magColor = (mag: number) =>
              mag >= 7 ? "text-red-400" : mag >= 6 ? "text-orange-400" : "text-yellow-400";
            const magDot = (mag: number) =>
              mag >= 7 ? "bg-red-500" : mag >= 6 ? "bg-orange-500" : "bg-yellow-500";

            return (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs text-foreground-muted">
                {filtered.length > 0 ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${magDot(largest)} ${largest >= 6 ? "animate-pulse" : ""}`} />
                      <span className={`font-bold tabular-nums ${magColor(largest)}`}>
                        M{largest.toFixed(1)}
                      </span>
                      <span>largest</span>
                    </div>
                    <span className="tabular-nums">
                      <span className="font-semibold text-foreground">{filtered.length}</span> quakes M5+
                    </span>
                    {majorCount > 0 && (
                      <span className="tabular-nums">
                        <span className="font-semibold text-red-400">{majorCount}</span> major (6+)
                      </span>
                    )}
                    {tsunamiCount > 0 && (
                      <span className="font-semibold text-blue-400">
                        {tsunamiCount} tsunami
                      </span>
                    )}
                    <span className="text-foreground-muted/50">24h</span>
                  </>
                ) : (
                  <span>No significant quakes in last 24h</span>
                )}

                {/* Magnitude legend */}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-2xs">7+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-2xs">6+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-2xs">5+</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Activity — main view, always visible */}
          {heroView === "main" && activityData && (() => {
            const globalData = activityData["all" as WatchpointId];
            const regions = [
              { id: "us", label: "US" },
              { id: "middle-east", label: "Mid East" },
              { id: "europe-russia", label: "Europe" },
            ] as const;

            const describeLevel = (mult: number) =>
              mult >= 5 ? "surging" : mult >= 2.5 ? "elevated" : "";

            return (
              <div className="px-3 py-2.5" role="region" aria-label="Feed activity">
                {globalData && (
                  <>
                    <p className="text-sm text-foreground">
                      Global source activity is{' '}
                      <span className="font-bold tabular-nums">{globalData.multiplier.toFixed(1)}×</span>
                      {' '}the typical pace across{' '}
                      <span className="font-bold tabular-nums">{globalData.count}</span>
                      {' '}posts in the last <span className="font-bold">6</span> hours.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground-muted mt-1">
                      {regions.map((r) => {
                        const data = activityData[r.id as WatchpointId];
                        if (!data) return null;
                        const level = describeLevel(data.multiplier);
                        return (
                          <span key={r.id} className="whitespace-nowrap">
                            {r.label}{' '}
                            {level && (
                              <span className={`font-semibold ${
                                data.multiplier >= 5 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                              }`}>
                                {level}{' '}
                              </span>
                            )}
                            <span className={`tabular-nums ${
                              data.multiplier >= 5 ? "text-red-600 dark:text-red-400 font-semibold" :
                              data.multiplier >= 2.5 ? "text-amber-600 dark:text-amber-400 font-semibold" :
                              ""
                            }`}>
                              {data.multiplier.toFixed(1)}×
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        </div>
        {/* end Status Bar + Panels container */}
      </section>

      {/* Main Content */}
      <main
        id="feed"
        className="max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-3 sm:px-4 pb-20 pt-4"
      >
        {heroView === "seismic" ? (
          /* Earthquake Table — replaces feed when seismic view is active */
          <div className="rounded-xl border border-border-card bg-background-card shadow-card">
            <div className="px-4 py-3 border-b border-border-light">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Earthquakes
                  </h2>
                  {earthquakes.length > 0 && (
                    <span className="text-xs text-foreground-muted">
                      ({earthquakes.length})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground-muted">
                  <span>M5+ · Last 24h</span>
                  <button
                    onClick={fetchEarthquakes}
                    className="hover:text-foreground transition-colors"
                  >
                    {seismicLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>
            {seismicLoading && earthquakes.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-foreground-muted">
                Loading earthquake data...
              </div>
            ) : earthquakes.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-foreground-muted">
                No significant earthquakes in the last 24 hours.
              </div>
            ) : (
              (() => {
                const sorted = [...earthquakes].sort((a, b) => b.magnitude - a.magnitude);
                const pageSize = 5;
                const totalPages = Math.ceil(sorted.length / pageSize);
                const page = Math.min(quakePage, totalPages - 1);
                const pageItems = sorted.slice(page * pageSize, (page + 1) * pageSize);

                const getMagColor = (mag: number) =>
                  mag >= 7 ? "bg-red-500" : mag >= 6 ? "bg-orange-500" : "bg-yellow-500";
                const getAlertColor = (alert: string | null) =>
                  alert === "red" ? "text-red-500" : alert === "orange" ? "text-orange-500" : "text-amber-500";

                return (
                  <>
                    <div className="divide-y divide-border-light">
                      {pageItems.map((eq) => {
                        const isSelected = selectedQuake?.id === eq.id;
                        return (
                          <button
                            key={eq.id}
                            onClick={() => setSelectedQuake(isSelected ? null : eq)}
                            className={`w-full flex items-center gap-4 px-4 py-2.5 text-left transition-colors ${
                              isSelected
                                ? "bg-blue-500/5 dark:bg-blue-500/10"
                                : "hover:bg-background-secondary"
                            }`}
                          >
                            <span
                              className={`w-10 text-center text-xs font-bold text-white rounded-md py-0.5 shrink-0 ${getMagColor(eq.magnitude)}`}
                            >
                              {eq.magnitude.toFixed(1)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-foreground truncate">
                                {eq.place}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground-muted">
                                <span className="tabular-nums">{eq.depth.toFixed(0)}km deep</span>
                                {eq.tsunami && <span className="text-blue-500 font-medium">Tsunami</span>}
                                {eq.alert && (eq.alert === "red" || eq.alert === "orange") && (
                                  <span className={`font-medium ${getAlertColor(eq.alert)}`}>
                                    {eq.alert.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-foreground-muted tabular-nums shrink-0" suppressHydrationWarning>
                              {formatTimeAgo(eq.time)}
                            </span>
                            <a
                              href={eq.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-foreground-light hover:text-foreground transition-colors shrink-0"
                              title="View on USGS"
                            >
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </a>
                          </button>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                        <button
                          onClick={() => setQuakePage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                          className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-foreground-muted tabular-nums">
                          {page + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => setQuakePage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page === totalPages - 1}
                          className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        ) : (
          <ErrorBoundary
            section="News Feed"
            fallback={<FeedSkeleton count={5} />}
          >
            <div className="rounded-xl border border-border-card bg-background-card shadow-card">
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
                totalPosts={activityData?.["all" as WatchpointId]?.count ?? newsItems.length}
                uniqueSources={uniqueSources}
                hoursWindow={hoursWindow}
                allItemsForTrending={newsItems}
                allItems={newsItems}
              />
              {/* Load more button */}
              {(() => {
                const filteredTotal =
                  selectedWatchpoint === "all"
                    ? newsItems.length
                    : newsItems.filter((i) => i.region === selectedWatchpoint)
                        .length;
                const remaining = filteredTotal - displayLimit;
                if (remaining <= 0) return null;
                return (
                  <div className="px-3 sm:px-4 py-4">
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + 50)}
                      className="w-full py-3 px-4 text-sm font-medium text-foreground-muted hover:text-foreground border border-border-card hover:bg-background-secondary rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronDownIcon className="w-4 h-4" />
                      Show {remaining} more posts
                    </button>
                  </div>
                );
              })()}
            </div>
          </ErrorBoundary>
        )}
      </main>

      {/* Legend removed — info available via About page */}

      {/* Editorial FAB - only visible when admin is logged in */}
      {session && <EditorialFAB onPostCreated={fetchNews} />}
    </>
  );
}

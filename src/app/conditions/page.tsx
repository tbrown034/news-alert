'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  GlobeAmericasIcon,
  GlobeEuropeAfricaIcon,
  GlobeAsiaAustraliaIcon,
  CloudIcon,
  FireIcon,
  MapPinIcon,
  WifiIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import ActivityChart from '@/components/ActivityChart';
import { WorldMap } from '@/components/WorldMap';
import type { Watchpoint, WatchpointId } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface SeismicThreat {
  id: string;
  type: 'seismic';
  title: string;
  description: string;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  magnitude: number;
  depth: number;
  tsunami: boolean;
}

interface WeatherThreat {
  id: string;
  type: 'weather';
  title: string;
  description: string;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  eventType: string;
}

interface FireThreat {
  id: string;
  type: 'fire';
  title: string;
  description: string;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  brightness?: number;
  confidence?: string;
}

interface TravelThreat {
  id: string;
  type: 'travel';
  title: string;
  description: string;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  country: string;
  countryCode: string;
  level: 1 | 2 | 3 | 4;
  levelText: string;
}

interface OutageThreat {
  id: string;
  type: 'outage';
  title: string;
  description: string;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  country: string;
  countryCode: string;
  percentDown: number;
}

interface TFRThreat {
  id: string;
  type: 'tfr';
  title: string;
  description: string;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  tfrType: string;
  state: string;
  notamKey: string;
}

interface RegionThreats {
  seismic: SeismicThreat[];
  weather: WeatherThreat[];
  fires: FireThreat[];
  travel: TravelThreat[];
  outages: OutageThreat[];
  tfrs: TFRThreat[];
  totalCount: number;
  criticalCount: number;
}

interface RegionActivity {
  level: 'critical' | 'elevated' | 'normal';
  count: number;
  baseline: number;
  multiplier: number;
  vsNormal: 'above' | 'below' | 'normal';
  percentChange: number;
}

interface TrendTerm {
  term: string;
  traffic: string;
  url: string;
}

interface SparklinePoint {
  date: string;
  price: number;
}

interface CommodityData {
  id: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  unit: string;
  source: string;
  sparkline: SparklinePoint[];
}

interface WikiPage {
  title: string;
  views: number;
  url: string;
  region: string;
}

interface ConditionsData {
  byRegion: Record<string, RegionThreats>;
  summary: {
    totalThreats: number;
    criticalCount: number;
    severeCount: number;
    byType: {
      seismic: number;
      weather: number;
      fires: number;
      travel: number;
      outages: number;
      tfrs: number;
    };
    lastUpdated: string;
  };
  fetchedAt: string;
}

// =============================================================================
// CONFIG
// =============================================================================

const REGIONS: { id: string; name: string }[] = [
  { id: 'us', name: 'United States' },
  { id: 'latam', name: 'Latin America' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'europe-russia', name: 'Europe & Russia' },
  { id: 'asia', name: 'Asia-Pacific' },
  { id: 'africa', name: 'Africa' },
];

const REGION_COLORS: Record<string, {
  color: string;
  icon: typeof GlobeAltIcon;
  abbr: string;
}> = {
  'us':            { color: '#3b82f6', icon: GlobeAmericasIcon, abbr: 'US' },
  'latam':         { color: '#22c55e', icon: GlobeAmericasIcon, abbr: 'LA' },
  'middle-east':   { color: '#f97316', icon: GlobeEuropeAfricaIcon, abbr: 'ME' },
  'europe-russia': { color: '#a855f7', icon: GlobeEuropeAfricaIcon, abbr: 'EU' },
  'asia':          { color: '#06b6d4', icon: GlobeAsiaAustraliaIcon, abbr: 'AP' },
  'africa':        { color: '#eab308', icon: GlobeEuropeAfricaIcon, abbr: 'AF' },
};

const categoryConfig = {
  seismic: {
    icon: GlobeAltIcon,
    color: 'text-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-secondary)]',
    border: 'border-[var(--border-light)]',
    label: 'Seismic',
  },
  weather: {
    icon: CloudIcon,
    color: 'text-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-secondary)]',
    border: 'border-[var(--border-light)]',
    label: 'Weather',
  },
  fires: {
    icon: FireIcon,
    color: 'text-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-secondary)]',
    border: 'border-[var(--border-light)]',
    label: 'Fires',
  },
  travel: {
    icon: MapPinIcon,
    color: 'text-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-secondary)]',
    border: 'border-[var(--border-light)]',
    label: 'Travel Advisories',
  },
  outages: {
    icon: WifiIcon,
    color: 'text-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-secondary)]',
    border: 'border-[var(--border-light)]',
    label: 'Outages',
  },
  tfrs: {
    icon: NoSymbolIcon,
    color: 'text-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-secondary)]',
    border: 'border-[var(--border-light)]',
    label: 'Flight Restrictions',
  },
};

type CategoryKey = keyof typeof categoryConfig;

const severityOrder = { critical: 0, severe: 1, moderate: 2, minor: 3 };

const severityConfig = {
  critical: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  severe: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  moderate: { dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  minor: { dot: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function ConditionsPage() {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [activityData, setActivityData] = useState<Record<string, RegionActivity> | null>(null);
  const [trendsData, setTrendsData] = useState<Record<string, { terms: TrendTerm[] }> | null>(null);
  const [commoditiesData, setCommoditiesData] = useState<CommodityData[] | null>(null);
  const [wikiData, setWikiData] = useState<WikiPage[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConditions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [conditionsRes, newsRes, trendsRes, commoditiesRes, wikiRes] = await Promise.all([
        fetch('/api/conditions'),
        fetch('/api/news?limit=1').catch(() => null),
        fetch('/api/google-trends').catch(() => null),
        fetch('/api/commodities').catch(() => null),
        fetch('/api/wikipedia-views').catch(() => null),
      ]);
      if (!conditionsRes.ok) throw new Error('Failed to fetch conditions');
      const result = await conditionsRes.json();
      setData(result);

      if (newsRes?.ok) {
        const newsData = await newsRes.json();
        if (newsData.activity) setActivityData(newsData.activity);
      }
      if (trendsRes?.ok) {
        const td = await trendsRes.json();
        if (td.trends) setTrendsData(td.trends);
      }
      if (commoditiesRes?.ok) {
        const cd = await commoditiesRes.json();
        if (cd.commodities) setCommoditiesData(cd.commodities);
      }
      if (wikiRes?.ok) {
        const wd = await wikiRes.json();
        if (wd.pages) setWikiData(wd.pages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  useEffect(() => {
    const timer = setInterval(fetchConditions, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchConditions]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Sort regions by critical count desc, then total count desc
  const sortedRegions = data
    ? REGIONS.slice().sort((a, b) => {
        const ra = data.byRegion[a.id];
        const rb = data.byRegion[b.id];
        if (!ra || !rb) return 0;
        if (rb.criticalCount !== ra.criticalCount) return rb.criticalCount - ra.criticalCount;
        return rb.totalCount - ra.totalCount;
      })
    : REGIONS;

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-(--background)/95 backdrop-blur-sm border-b border-(--border)">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-(--foreground-light) hover:text-(--foreground) transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-label">Back</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <h1 className="headline text-lg text-(--foreground)">World Conditions</h1>
            </div>
            <button
              onClick={fetchConditions}
              disabled={isLoading}
              className="p-2 text-(--foreground-light) hover:text-(--foreground) transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-(--foreground-light) border-t-transparent rounded-full animate-spin" />
              <span className="text-caption">Loading conditions...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 border-red-500/30!">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-label text-red-400">Failed to load conditions</p>
                <p className="text-caption text-red-400/70 mt-1">{error}</p>
              </div>
              <button
                onClick={fetchConditions}
                className="px-3 py-1.5 text-micro font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-md transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Summary Card */}
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-4">
                {/* Headline stat + update time */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--foreground)]">
                      {data.summary.totalThreats}
                    </span>
                    <span className="text-label text-[var(--foreground-muted)]">active events</span>
                  </div>
                  <span className="text-caption whitespace-nowrap">
                    Updated {formatTimeAgo(data.fetchedAt)}
                  </span>
                </div>

                {/* Severity distribution bar */}
                {data.summary.totalThreats > 0 && (
                  <div className="mb-4">
                    <div className="flex h-2 rounded-full overflow-hidden bg-[var(--background-secondary)]">
                      {data.summary.criticalCount > 0 && (
                        <div
                          className="bg-red-500 transition-all duration-500"
                          style={{ width: `${(data.summary.criticalCount / data.summary.totalThreats) * 100}%` }}
                        />
                      )}
                      {data.summary.severeCount > 0 && (
                        <div
                          className="bg-amber-500 transition-all duration-500"
                          style={{ width: `${(data.summary.severeCount / data.summary.totalThreats) * 100}%` }}
                        />
                      )}
                      <div
                        className="bg-slate-600 transition-all duration-500"
                        style={{
                          width: `${((data.summary.totalThreats - data.summary.criticalCount - data.summary.severeCount) / data.summary.totalThreats) * 100}%`,
                        }}
                      />
                    </div>
                    {/* Severity legend */}
                    <div className="flex gap-4 mt-2">
                      {data.summary.criticalCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-micro text-red-400 font-medium tabular-nums">{data.summary.criticalCount} critical</span>
                        </div>
                      )}
                      {data.summary.severeCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-micro text-amber-400 font-medium tabular-nums">{data.summary.severeCount} severe</span>
                        </div>
                      )}
                      {(data.summary.totalThreats - data.summary.criticalCount - data.summary.severeCount) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          <span className="text-micro text-[var(--foreground-light)] tabular-nums">
                            {data.summary.totalThreats - data.summary.criticalCount - data.summary.severeCount} other
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Type breakdown grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.entries(data.summary.byType) as [CategoryKey, number][])
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => {
                      const config = categoryConfig[type];
                      const Icon = config.icon;
                      return (
                        <div
                          key={type}
                          className="flex flex-col items-center gap-1 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-light)]"
                        >
                          <Icon className="w-4 h-4 text-[var(--foreground-muted)]" />
                          <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">{count}</span>
                          <span className="text-micro text-[var(--foreground-light)]">{config.label}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Map with post counts */}
            {activityData && (
              <div className="card overflow-hidden">
                <div className="h-[200px] sm:h-[240px]">
                  <WorldMap
                    watchpoints={REGIONS.map((r, i) => ({
                      id: r.id as WatchpointId,
                      name: r.name,
                      shortName: r.name,
                      priority: i,
                      activityLevel: (activityData[r.id]?.level || 'normal') as Watchpoint['activityLevel'],
                      color: activityData[r.id]?.level === 'critical'
                        ? '#ef4444'
                        : activityData[r.id]?.level === 'elevated'
                          ? '#f97316'
                          : '#22c55e',
                    }))}
                    selected="all"
                    onSelect={() => {}}
                    activity={activityData}
                    showTimes={false}
                    showZoomControls={false}
                    regionCounts={Object.fromEntries(
                      REGIONS.map(r => [r.id, activityData[r.id]?.count ?? 0])
                    )}
                  />
                </div>
              </div>
            )}

            {/* Section: Activity */}
            <div className="section-header">
              <span className="section-label">Activity</span>
            </div>
            <ActivityChart />

            {/* Section: Markets */}
            {commoditiesData && commoditiesData.length > 0 && (
              <div className="section-header">
                <span className="section-label">Markets</span>
              </div>
            )}
            {commoditiesData && commoditiesData.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyDollarIcon className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <span className="text-label text-[var(--foreground-muted)]">Markets</span>
                    <span className="text-caption">30-day</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {commoditiesData.map((c) => (
                      <CommodityCard key={c.id} commodity={c} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section: Regional Breakdown */}
            <div className="section-header">
              <span className="section-label">Regional Breakdown</span>
            </div>
            <div className="space-y-4">
              {sortedRegions.map((region, index) => {
                const rd = data.byRegion[region.id];
                if (!rd) return null;

                return (
                  <div
                    key={region.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
                  >
                    <RegionCard
                      regionId={region.id}
                      name={region.name}
                      data={rd}
                      activity={activityData?.[region.id] ?? null}
                      trends={trendsData?.[region.id]?.terms ?? null}
                      wikiPages={wikiData?.filter(p => p.region === region.id) ?? null}
                      formatTimeAgo={formatTimeAgo}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// REGION CARD
// =============================================================================

interface RegionCardProps {
  regionId: string;
  name: string;
  data: RegionThreats;
  activity: RegionActivity | null;
  trends: TrendTerm[] | null;
  wikiPages: WikiPage[] | null;
  formatTimeAgo: (dateStr: string) => string;
}

function RegionCard({ regionId, name, data, activity, trends, wikiPages, formatTimeAgo }: RegionCardProps) {
  const hasTrends = trends && trends.length > 0;
  const hasWiki = wikiPages && wikiPages.length > 0;
  const isEmpty = data.totalCount === 0 && (!activity || activity.level === 'normal') && !hasTrends && !hasWiki;

  const categories = (['seismic', 'weather', 'fires', 'travel', 'outages', 'tfrs'] as CategoryKey[]).filter(
    (cat) => data[cat] && data[cat].length > 0,
  );

  const regionColor = REGION_COLORS[regionId] || { color: '#6c757d', icon: GlobeAltIcon, abbr: '??' };
  const RegionIcon = regionColor.icon;

  // Count severities across all categories
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, severe: 0, moderate: 0, minor: 0 };
    for (const cat of ['seismic', 'weather', 'fires', 'travel', 'outages', 'tfrs'] as CategoryKey[]) {
      for (const item of (data[cat] || [])) {
        const sev = (item as any).severity as keyof typeof counts;
        if (sev in counts) counts[sev]++;
      }
    }
    return counts;
  }, [data]);

  const activityColor = activity?.level === 'critical'
    ? 'text-red-400'
    : activity?.level === 'elevated'
      ? 'text-orange-400'
      : 'text-emerald-400';

  const activityBadge = activity?.level === 'critical'
    ? { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400' }
    : activity?.level === 'elevated'
      ? { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400' }
      : { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' };

  const activityBadgeText = activity
    ? activity.percentChange > 0
      ? `+${activity.percentChange}%`
      : activity.percentChange < 0
        ? `${activity.percentChange}%`
        : 'Normal'
    : null;

  return (
    <div className="card overflow-hidden">
      {/* Accent top line — region color, red when critical */}
      <div
        className={`${data.criticalCount > 0 ? 'h-[2px]' : 'h-px'}`}
        style={{
          backgroundColor: data.criticalCount > 0
            ? '#ef4444'
            : data.totalCount > 0
              ? regionColor.color
              : 'var(--border)',
        }}
      />

      {/* Region header */}
      <div className="px-4 sm:px-5 pt-3.5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Region icon badge */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${regionColor.color}15` }}
          >
            <RegionIcon className="w-4.5 h-4.5" style={{ color: regionColor.color }} />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="headline text-base sm:text-lg">{name}</h2>
            {activity && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-micro font-semibold rounded-md ${activityBadge.bg} ${activityBadge.border} border ${activityBadge.text}`}>
                <SignalIcon className="w-3 h-3" />
                {activity.count} posts
              </span>
            )}
            {data.criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-micro font-semibold bg-red-500/15 text-red-400 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {data.criticalCount} critical
              </span>
            )}
            {data.totalCount > 0 && data.criticalCount === 0 && (
              <span className="text-caption">{data.totalCount} events</span>
            )}
          </div>
        </div>
      </div>

      {/* Severity distribution bar */}
      {data.totalCount > 0 && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--background-secondary)]">
            {severityCounts.critical > 0 && (
              <div className="bg-red-500" style={{ width: `${(severityCounts.critical / data.totalCount) * 100}%` }} />
            )}
            {severityCounts.severe > 0 && (
              <div className="bg-amber-500" style={{ width: `${(severityCounts.severe / data.totalCount) * 100}%` }} />
            )}
            {severityCounts.moderate > 0 && (
              <div className="bg-yellow-500" style={{ width: `${(severityCounts.moderate / data.totalCount) * 100}%` }} />
            )}
            {severityCounts.minor > 0 && (
              <div className="bg-slate-600" style={{ width: `${(severityCounts.minor / data.totalCount) * 100}%` }} />
            )}
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="px-4 sm:px-5 pb-4 flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-500/60" />
          <p className="text-caption">No active conditions</p>
        </div>
      ) : (
        <div className="border-t border-(--border-light)">
          {/* Signals row — polished layout */}
          {(activity || hasTrends || hasWiki) && (
            <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-light)]">
              <div className="grid gap-2.5">
                {/* Feed Activity — promoted to mini stat row */}
                {activity && (
                  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--background-secondary)]">
                    <div className="flex items-center gap-2">
                      <SignalIcon className={`w-3.5 h-3.5 ${activityColor}`} />
                      <span className="text-micro font-medium text-[var(--foreground-muted)]">Feed Activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-micro font-semibold rounded border ${activityBadge.bg} ${activityBadge.border} ${activityBadge.text}`}>
                        {activityBadgeText}
                      </span>
                      <span className="text-caption tabular-nums">{activity.count} / {activity.baseline} baseline</span>
                    </div>
                  </div>
                )}

                {/* Trends + Wiki side-by-side on desktop */}
                {(hasTrends || hasWiki) && (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {hasTrends && (
                      <div className="px-3 py-2 rounded-lg bg-[var(--background-secondary)]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                          <span className="text-micro font-medium text-[var(--foreground-muted)]">Trending</span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {trends!.slice(0, 5).map((t) => (
                            <a
                              key={t.term}
                              href={t.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-micro text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                              {t.term}
                              {t.traffic && <span className="text-[var(--foreground-light)] ml-0.5">{t.traffic}</span>}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasWiki && (
                      <div className="px-3 py-2 rounded-lg bg-[var(--background-secondary)]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <BookOpenIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                          <span className="text-micro font-medium text-[var(--foreground-muted)]">Wiki Spikes</span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {wikiPages!.slice(0, 3).map((p) => (
                            <a
                              key={p.title}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-micro text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                              {p.title}
                              <span className="text-[var(--foreground-light)] ml-0.5">{p.views.toLocaleString()}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Threat categories */}
          <div className="divide-y divide-(--border-light)">
            {categories.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                items={data[cat]}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CATEGORY SECTION
// =============================================================================

const MAX_ITEMS = 3;

interface CategorySectionProps {
  category: CategoryKey;
  items: any[];
  formatTimeAgo: (dateStr: string) => string;
}

function CategorySection({ category, items, formatTimeAgo }: CategorySectionProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  const sorted = items.slice().sort(
    (a: any, b: any) =>
      (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
      (severityOrder[b.severity as keyof typeof severityOrder] ?? 3),
  );

  const visible = sorted.slice(0, MAX_ITEMS);
  const overflow = sorted.length - MAX_ITEMS;

  return (
    <div className="px-4 sm:px-5 py-3.5">
      {/* Category header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${config.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
        <span className={`text-label ${config.color}`}>{config.label}</span>
        <span className="text-micro text-(--foreground-light) tabular-nums">{items.length}</span>
      </div>

      {/* Items */}
      <div className="space-y-1.5 ml-7">
        {visible.map((item: any, i: number) => (
          <ConditionItem key={`${item.id}-${i}`} item={item} category={category} formatTimeAgo={formatTimeAgo} />
        ))}
        {overflow > 0 && (
          <p className="text-caption">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CONDITION ITEM
// =============================================================================

interface ConditionItemProps {
  item: any;
  category: CategoryKey;
  formatTimeAgo: (dateStr: string) => string;
}

function ConditionItem({ item, category, formatTimeAgo }: ConditionItemProps) {
  const severity: string = item.severity;
  const sev = severityConfig[severity as keyof typeof severityConfig] || severityConfig.minor;

  let label = item.title || item.description;
  if (category === 'seismic') {
    label = `M${item.magnitude?.toFixed(1)} — ${item.description}`;
  } else if (category === 'travel') {
    label = `${item.country} — Level ${item.level}`;
  } else if (category === 'tfrs') {
    label = `${item.state} — ${item.tfrType}`;
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0 group px-1.5 -mx-1.5 py-0.5 rounded hover:bg-[var(--background-secondary)] transition-colors">
      {/* Severity dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
      {/* Label */}
      <span className="text-body text-sm truncate flex-1 group-hover:text-(--foreground) transition-colors">{label}</span>
      {/* Severity badge */}
      <span className={`hidden sm:inline-flex px-1.5 py-0.5 text-micro rounded shrink-0 ${sev.bg} ${sev.text}`}>
        {severity}
      </span>
      {/* Time */}
      <span className="text-caption whitespace-nowrap shrink-0 tabular-nums">
        {formatTimeAgo(item.timestamp)}
      </span>
    </div>
  );
}

// =============================================================================
// COMMODITY CARD WITH SPARKLINE
// =============================================================================

function CommodityCard({ commodity: c }: { commodity: CommodityData }) {
  const isUp = c.changePercent > 0;
  const changeColor = isUp ? 'text-emerald-400' : 'text-red-400';
  const strokeColor = isUp ? '#34d399' : '#f87171';

  const formattedPrice = c.price >= 1000
    ? c.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : c.price.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const sparklinePath = useMemo(() => {
    if (!c.sparkline || c.sparkline.length < 2) return null;
    const prices = c.sparkline.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 100;
    const h = 32;
    const padding = 2;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = padding + (1 - (p - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }, [c.sparkline]);

  return (
    <div className="bg-(--background-secondary) rounded-lg px-3 py-2.5 flex flex-col gap-1 border border-(--border-light)">
      <div className="flex items-center justify-between">
        <span className="text-micro font-medium text-(--foreground-muted) truncate">{c.name}</span>
        <span className={`text-micro font-semibold tabular-nums ${changeColor}`}>
          {isUp ? '+' : ''}{c.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-sm font-semibold text-(--foreground) tabular-nums">
        {c.unit === 'USD' || c.unit.startsWith('USD/') ? '$' : ''}{formattedPrice}
      </div>
      {sparklinePath && (
        <svg viewBox="0 0 100 32" className="w-full h-8 mt-0.5" preserveAspectRatio="none">
          <path
            d={sparklinePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

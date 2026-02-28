'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  CloudIcon,
  FireIcon,
  MapPinIcon,
  WifiIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import ActivityChart from '@/components/ActivityChart';

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

const categoryConfig = {
  seismic: {
    icon: GlobeAltIcon,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'Seismic',
  },
  weather: {
    icon: CloudIcon,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    label: 'Weather',
  },
  fires: {
    icon: FireIcon,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    label: 'Fires',
  },
  travel: {
    icon: MapPinIcon,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'Travel Advisories',
  },
  outages: {
    icon: WifiIcon,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    label: 'Outages',
  },
  tfrs: {
    icon: NoSymbolIcon,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
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
            {/* Summary stats */}
            <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-1">
              <StatPill
                value={data.summary.totalThreats}
                label="events"
                color="text-(--foreground)"
              />
              {data.summary.criticalCount > 0 && (
                <StatPill
                  value={data.summary.criticalCount}
                  label="critical"
                  color="text-red-400"
                />
              )}
              {data.summary.severeCount > 0 && (
                <StatPill
                  value={data.summary.severeCount}
                  label="severe"
                  color="text-amber-400"
                />
              )}
              <span className="ml-auto text-caption whitespace-nowrap">
                Updated {formatTimeAgo(data.fetchedAt)}
              </span>
            </div>

            {/* Type breakdown - mini pills */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(data.summary.byType) as [CategoryKey, number][])
                .filter(([, count]) => count > 0)
                .map(([type, count]) => {
                  const config = categoryConfig[type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={type}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg} ${config.border}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      <span className={`text-micro font-medium ${config.color}`}>{count}</span>
                      <span className="text-micro text-(--foreground-light)">{config.label}</span>
                    </div>
                  );
                })}
            </div>

            {/* Feed Activity History */}
            <ActivityChart />

            {/* Markets — global signal with sparklines */}
            {commoditiesData && commoditiesData.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyDollarIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-label text-emerald-400">Markets</span>
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

            {/* Region cards */}
            <div className="space-y-4">
              {sortedRegions.map((region) => {
                const rd = data.byRegion[region.id];
                if (!rd) return null;

                return (
                  <RegionCard
                    key={region.id}
                    regionId={region.id}
                    name={region.name}
                    data={rd}
                    activity={activityData?.[region.id] ?? null}
                    trends={trendsData?.[region.id]?.terms ?? null}
                    wikiPages={wikiData?.filter(p => p.region === region.id) ?? null}
                    formatTimeAgo={formatTimeAgo}
                  />
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
// STAT PILL
// =============================================================================

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={`text-lg font-semibold tabular-nums font-[family-name:var(--font-geist-mono)] ${color}`}>
        {value}
      </span>
      <span className="text-caption">{label}</span>
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

function RegionCard({ name, data, activity, trends, wikiPages, formatTimeAgo }: RegionCardProps) {
  const hasTrends = trends && trends.length > 0;
  const hasWiki = wikiPages && wikiPages.length > 0;
  const isEmpty = data.totalCount === 0 && (!activity || activity.level === 'normal') && !hasTrends && !hasWiki;

  const categories = (['seismic', 'weather', 'fires', 'travel', 'outages', 'tfrs'] as CategoryKey[]).filter(
    (cat) => data[cat] && data[cat].length > 0,
  );

  const activityColor = activity?.level === 'critical'
    ? 'text-red-400'
    : activity?.level === 'elevated'
      ? 'text-amber-400'
      : 'text-emerald-400';

  const activityBadge = activity?.level === 'critical'
    ? { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400' }
    : activity?.level === 'elevated'
      ? { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' }
      : { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' };

  const activityText = activity
    ? activity.level === 'normal'
      ? 'Typical pace'
      : `${activity.count} posts vs ${activity.baseline} baseline`
    : null;

  const activityBadgeText = activity
    ? activity.level === 'normal'
      ? 'Normal'
      : `+${activity.percentChange}%`
    : null;

  // Accent line color based on severity
  const accentColor = data.criticalCount > 0
    ? 'bg-red-500'
    : data.totalCount > 0
      ? 'bg-amber-500'
      : 'bg-(--border)';

  return (
    <div className="card overflow-hidden">
      {/* Accent top line */}
      <div className={`h-0.5 ${accentColor}`} />

      {/* Region header */}
      <div className="px-4 sm:px-5 pt-3.5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="headline text-base sm:text-lg">{name}</h2>
          {data.criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-micro font-semibold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {data.criticalCount} critical
            </span>
          )}
          {data.totalCount > 0 && data.criticalCount === 0 && (
            <span className="text-caption">{data.totalCount} events</span>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="px-4 sm:px-5 pb-4">
          <p className="text-caption italic">No active conditions</p>
        </div>
      ) : (
        <div className="border-t border-(--border-light)">
          {/* Signals row — Feed Activity, Trends, Wiki in a compact strip */}
          {(activity || hasTrends || hasWiki) && (
            <div className="px-4 sm:px-5 py-3 space-y-2.5 border-b border-(--border-light)">
              {/* Feed Activity */}
              {activity && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <SignalIcon className={`w-3.5 h-3.5 ${activityColor}`} />
                    <span className={`text-micro font-medium ${activityColor}`}>Feed Activity</span>
                  </div>
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-micro font-semibold rounded border ${activityBadge.bg} ${activityBadge.border} ${activityBadge.text}`}>
                    {activityBadgeText}
                  </span>
                  <span className="text-caption">{activityText}</span>
                </div>
              )}

              {/* Google Trends */}
              {hasTrends && (
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                    <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-micro font-medium text-sky-400">Trending</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trends!.slice(0, 5).map((t) => (
                      <a
                        key={t.term}
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-micro bg-sky-500/8 text-sky-300 hover:bg-sky-500/15 border border-sky-500/15 hover:border-sky-500/30 rounded transition-colors"
                      >
                        {t.term}
                        {t.traffic && <span className="text-sky-400/50">{t.traffic}</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Wikipedia spikes */}
              {hasWiki && (
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                    <BookOpenIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-micro font-medium text-violet-400">Wiki spikes</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {wikiPages!.slice(0, 3).map((p) => (
                      <a
                        key={p.title}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-micro text-(--foreground-muted) hover:text-violet-300 transition-colors"
                      >
                        {p.title} <span className="text-(--foreground-light)">{p.views.toLocaleString()}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
    <div className="px-4 sm:px-5 py-3">
      {/* Category header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${config.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
        <span className={`text-label ${config.color}`}>{config.label}</span>
        <span className="text-micro text-(--foreground-light) font-[family-name:var(--font-geist-mono)]">{items.length}</span>
      </div>

      {/* Items */}
      <div className="space-y-1.5 ml-7">
        {visible.map((item: any) => (
          <ConditionItem key={item.id} item={item} category={category} formatTimeAgo={formatTimeAgo} />
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
    <div className="flex items-center gap-2.5 min-w-0 group">
      {/* Severity dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
      {/* Label */}
      <span className="text-body text-sm truncate flex-1 group-hover:text-(--foreground) transition-colors">{label}</span>
      {/* Severity badge */}
      <span className={`hidden sm:inline-flex px-1.5 py-0.5 text-micro uppercase tracking-wider rounded shrink-0 ${sev.bg} ${sev.text} border ${sev.border}`}>
        {severity}
      </span>
      {/* Time */}
      <span className="text-caption whitespace-nowrap shrink-0 tabular-nums font-[family-name:var(--font-geist-mono)]">
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
  const isSignificant = Math.abs(c.changePercent) >= 3;
  const changeColor = isSignificant
    ? isUp ? 'text-red-400' : 'text-emerald-400'
    : isUp ? 'text-emerald-400/70' : 'text-red-400/70';
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
        <span className={`text-micro font-semibold tabular-nums font-[family-name:var(--font-geist-mono)] ${changeColor}`}>
          {isUp ? '+' : ''}{c.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-sm font-semibold text-(--foreground) tabular-nums font-[family-name:var(--font-geist-mono)]">
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

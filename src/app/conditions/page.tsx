'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from '@heroicons/react/24/outline';

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

interface RegionThreats {
  seismic: SeismicThreat[];
  weather: WeatherThreat[];
  fires: FireThreat[];
  travel: TravelThreat[];
  outages: OutageThreat[];
  totalCount: number;
  criticalCount: number;
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
];

const categoryConfig = {
  seismic: {
    icon: GlobeAltIcon,
    color: 'text-blue-400',
    label: 'Seismic',
  },
  weather: {
    icon: CloudIcon,
    color: 'text-purple-400',
    label: 'Weather',
  },
  fires: {
    icon: FireIcon,
    color: 'text-orange-400',
    label: 'Fires',
  },
  travel: {
    icon: MapPinIcon,
    color: 'text-rose-400',
    label: 'Travel',
  },
  outages: {
    icon: WifiIcon,
    color: 'text-cyan-400',
    label: 'Outages',
  },
};

type CategoryKey = keyof typeof categoryConfig;

const severityOrder = { critical: 0, severe: 1, moderate: 2, minor: 3 };

// =============================================================================
// COMPONENT
// =============================================================================

export default function ConditionsPage() {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConditions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/conditions');
      if (!response.ok) throw new Error('Failed to fetch conditions');
      const result = await response.json();
      setData(result);
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
    <div className="min-h-screen bg-black text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <GlobeAltIcon className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-semibold text-white">World Conditions</h1>
            </div>
            <button
              onClick={fetchConditions}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Loading */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400">Loading conditions...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Failed to load conditions</p>
                <p className="text-red-400/70 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={fetchConditions}
                className="px-3 py-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-400 px-1">
              <span>
                <span className="text-white font-semibold">{data.summary.totalThreats}</span> active events
              </span>
              {data.summary.criticalCount > 0 && (
                <span>
                  <span className="text-red-400 font-semibold">{data.summary.criticalCount}</span> critical
                </span>
              )}
              {data.summary.severeCount > 0 && (
                <span>
                  <span className="text-amber-400 font-semibold">{data.summary.severeCount}</span> severe
                </span>
              )}
              <span className="ml-auto text-xs text-slate-600">
                Updated {formatTimeAgo(data.fetchedAt)}
              </span>
            </div>

            {/* Region cards */}
            <div className="space-y-3">
              {sortedRegions.map((region) => {
                const rd = data.byRegion[region.id];
                if (!rd) return null;

                return (
                  <RegionCard
                    key={region.id}
                    name={region.name}
                    data={rd}
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
// REGION CARD
// =============================================================================

interface RegionCardProps {
  name: string;
  data: RegionThreats;
  formatTimeAgo: (dateStr: string) => string;
}

function RegionCard({ name, data, formatTimeAgo }: RegionCardProps) {
  const isEmpty = data.totalCount === 0;

  const categories = (['seismic', 'weather', 'fires', 'travel', 'outages'] as CategoryKey[]).filter(
    (cat) => data[cat].length > 0,
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Region header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-white">{name}</h2>
          {data.criticalCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 rounded">
              {data.criticalCount} critical
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          {data.totalCount} {data.totalCount === 1 ? 'event' : 'events'}
        </span>
      </div>

      {isEmpty ? (
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-600">No active conditions</p>
        </div>
      ) : (
        <div className="border-t border-slate-800">
          {categories.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              items={data[cat]}
              formatTimeAgo={formatTimeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CATEGORY SECTION (inside a region card)
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
    <div className="px-4 py-2.5 border-b border-slate-800/50 last:border-b-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        <span className="text-[10px] text-slate-600">{items.length}</span>
      </div>

      <div className="space-y-1.5 ml-6">
        {visible.map((item: any) => (
          <ConditionItem key={item.id} item={item} category={category} formatTimeAgo={formatTimeAgo} />
        ))}
        {overflow > 0 && (
          <p className="text-xs text-slate-600">+{overflow} more</p>
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

  const severityBadge = (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded flex-shrink-0 ${
        severity === 'critical'
          ? 'bg-red-500/20 text-red-400'
          : severity === 'severe'
            ? 'bg-amber-500/20 text-amber-400'
            : severity === 'moderate'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-slate-500/20 text-slate-400'
      }`}
    >
      {severity}
    </span>
  );

  let label = item.title || item.description;
  if (category === 'seismic') {
    label = `M${item.magnitude?.toFixed(1)} — ${item.description}`;
  } else if (category === 'travel') {
    label = `${item.country} — Level ${item.level}`;
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {severityBadge}
      <span className="text-sm text-slate-300 truncate flex-1">{label}</span>
      <span className="text-[10px] text-slate-600 whitespace-nowrap flex-shrink-0">
        {formatTimeAgo(item.timestamp)}
      </span>
    </div>
  );
}

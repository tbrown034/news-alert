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
  ShieldExclamationIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// Types matching the API response
interface ThreatSummary {
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
}

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

interface ThreatsData {
  threats: {
    seismic: SeismicThreat[];
    weather: WeatherThreat[];
    fires: FireThreat[];
    travel: TravelThreat[];
    outages: OutageThreat[];
  };
  summary: ThreatSummary;
  fetchedAt: string;
}

// Region options for filtering
const REGIONS = [
  { id: 'all', name: 'All Regions' },
  { id: 'us', name: 'United States' },
  { id: 'latam', name: 'Latin America' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'europe-russia', name: 'Europe & Russia' },
  { id: 'asia', name: 'Asia-Pacific' },
];

// Severity badge styles
const severityStyles = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  elevated: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  normal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

// Category icons and colors
const categoryConfig = {
  seismic: {
    icon: GlobeAltIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Seismic Activity',
  },
  weather: {
    icon: CloudIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    label: 'Weather Alerts',
  },
  fires: {
    icon: FireIcon,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Active Fires',
  },
  travel: {
    icon: MapPinIcon,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    label: 'Travel Advisories',
  },
  outages: {
    icon: WifiIcon,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    label: 'Internet Outages',
  },
};

export default function ThreatsPage() {
  const [data, setData] = useState<ThreatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('all');

  const fetchThreats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/threats?region=${selectedRegion}`);

      if (!response.ok) {
        throw new Error('Failed to fetch threat data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(fetchThreats, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchThreats]);

  // Format relative time
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

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <ShieldExclamationIcon className="w-5 h-5 text-red-400" />
              <h1 className="text-lg font-semibold text-white">Threat Assessments</h1>
            </div>
            <button
              onClick={fetchThreats}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Region Filter */}
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-4 h-4 text-slate-500" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400">Loading threat data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Failed to load threat data</p>
                <p className="text-red-400/70 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={fetchThreats}
                className="px-3 py-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {data && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Global Threat Overview</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Last updated: {formatTimeAgo(data.fetchedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{data.summary.totalThreats}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Total Threats</p>
                  </div>
                  <div className="w-px h-12 bg-slate-700" />
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${data.summary.criticalCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {data.summary.criticalCount}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Critical</p>
                  </div>
                  <div className="w-px h-12 bg-slate-700" />
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${data.summary.severeCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {data.summary.severeCount}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Severe</p>
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(data.summary.byType).map(([category, count]) => {
                    const config = categoryConfig[category as keyof typeof categoryConfig];
                    const Icon = config.icon;
                    return (
                      <div
                        key={category}
                        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 text-center`}
                      >
                        <Icon className={`w-5 h-5 ${config.color} mx-auto mb-1`} />
                        <p className="text-lg font-semibold text-white">{count}</p>
                        <p className="text-xs text-slate-400">{config.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Threat Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seismic */}
              <ThreatCard
                category="seismic"
                title={categoryConfig.seismic.label}
                icon={categoryConfig.seismic.icon}
                color={categoryConfig.seismic.color}
                bgColor={categoryConfig.seismic.bgColor}
                borderColor={categoryConfig.seismic.borderColor}
                count={data.threats.seismic.length}
              >
                {data.threats.seismic.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No significant seismic activity</p>
                ) : (
                  <div className="space-y-3">
                    {data.threats.seismic.slice(0, 5).map((eq) => (
                      <div key={eq.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                              eq.magnitude >= 6 ? 'bg-red-500/20 text-red-400' :
                              eq.magnitude >= 5 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              M{eq.magnitude.toFixed(1)}
                            </span>
                            {eq.tsunami && (
                              <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                                Tsunami
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mt-1 truncate">{eq.description}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(eq.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ThreatCard>

              {/* Weather */}
              <ThreatCard
                category="weather"
                title={categoryConfig.weather.label}
                icon={categoryConfig.weather.icon}
                color={categoryConfig.weather.color}
                bgColor={categoryConfig.weather.bgColor}
                borderColor={categoryConfig.weather.borderColor}
                count={data.threats.weather.length}
              >
                {data.threats.weather.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No active weather alerts</p>
                ) : (
                  <div className="space-y-3">
                    {data.threats.weather.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${
                              event.severity === 'critical' ? severityStyles.critical :
                              event.severity === 'severe' ? severityStyles.elevated :
                              severityStyles.normal
                            }`}>
                              {event.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-400">{event.eventType}</span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1 truncate">{event.title}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ThreatCard>

              {/* Fires */}
              <ThreatCard
                category="fires"
                title={categoryConfig.fires.label}
                icon={categoryConfig.fires.icon}
                color={categoryConfig.fires.color}
                bgColor={categoryConfig.fires.bgColor}
                borderColor={categoryConfig.fires.borderColor}
                count={data.threats.fires.length}
              >
                {data.threats.fires.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No significant fire activity</p>
                ) : (
                  <div className="space-y-3">
                    {data.threats.fires.slice(0, 5).map((fire) => (
                      <div key={fire.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              fire.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                              fire.severity === 'severe' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {fire.severity.toUpperCase()}
                            </span>
                            {fire.confidence && <span className="text-xs text-slate-400">{fire.confidence} conf.</span>}
                          </div>
                          <p className="text-sm text-slate-300 mt-1 truncate">{fire.title}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(fire.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ThreatCard>

              {/* Travel */}
              <ThreatCard
                category="travel"
                title={categoryConfig.travel.label}
                icon={categoryConfig.travel.icon}
                color={categoryConfig.travel.color}
                bgColor={categoryConfig.travel.bgColor}
                borderColor={categoryConfig.travel.borderColor}
                count={data.threats.travel.length}
              >
                {data.threats.travel.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No travel advisories</p>
                ) : (
                  <div className="space-y-3">
                    {data.threats.travel.slice(0, 5).map((advisory) => (
                      <div key={advisory.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                              advisory.level === 4 ? 'bg-red-500/20 text-red-400' :
                              advisory.level === 3 ? 'bg-orange-500/20 text-orange-400' :
                              advisory.level === 2 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              Level {advisory.level}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1 font-medium">{advisory.country}</p>
                          <p className="text-xs text-slate-500 truncate">{advisory.levelText}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(advisory.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ThreatCard>

              {/* Outages */}
              <ThreatCard
                category="outages"
                title={categoryConfig.outages.label}
                icon={categoryConfig.outages.icon}
                color={categoryConfig.outages.color}
                bgColor={categoryConfig.outages.bgColor}
                borderColor={categoryConfig.outages.borderColor}
                count={data.threats.outages.length}
              >
                {data.threats.outages.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No reported internet outages</p>
                ) : (
                  <div className="space-y-3">
                    {data.threats.outages.slice(0, 5).map((outage) => (
                      <div key={outage.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${
                              outage.severity === 'critical' ? severityStyles.critical :
                              outage.severity === 'severe' ? severityStyles.elevated :
                              severityStyles.normal
                            }`}>
                              {outage.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1 font-medium">{outage.title}</p>
                          <p className="text-xs text-slate-500">{outage.country}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(outage.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ThreatCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Reusable threat card component
interface ThreatCardProps {
  category: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
  children: React.ReactNode;
}

function ThreatCard({ title, icon: Icon, color, bgColor, borderColor, count, children }: ThreatCardProps) {
  return (
    <div className={`bg-slate-900 border ${borderColor} rounded-xl overflow-hidden`}>
      <div className={`${bgColor} px-4 py-3 border-b ${borderColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-medium text-white">{title}</h3>
        </div>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bgColor} ${color}`}>
          {count}
        </span>
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
    </div>
  );
}

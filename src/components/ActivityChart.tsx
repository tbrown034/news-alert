'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { SignalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const REGION_CONFIG: Record<string, { color: string; label: string }> = {
  'us':            { color: '#3b82f6', label: 'United States' },
  'middle-east':   { color: '#f97316', label: 'Middle East' },
  'europe-russia': { color: '#a855f7', label: 'Europe & Russia' },
  'latam':         { color: '#22c55e', label: 'Latin America' },
  'asia':          { color: '#06b6d4', label: 'Asia-Pacific' },
  'africa':        { color: '#eab308', label: 'Africa' },
};

const TIME_RANGES = [
  { label: '24h', days: 1 },
  { label: '3d', days: 3 },
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
];

interface DataPoint {
  timestamp: string;
  total: number;
  regions: Record<string, number>;
}

interface ActivityHistoryData {
  dataPoints: DataPoint[];
  baselines: Record<string, number>;
  meta: { generatedAt: string; days: number; bucketSizeHours: number };
}

export default function ActivityChart() {
  const [data, setData] = useState<ActivityHistoryData | null>(null);
  const [selectedRange, setSelectedRange] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(['us', 'middle-east', 'europe-russia'])
  );

  const [fetchError, setFetchError] = useState(false);

  const fetchData = useCallback(async (days: number) => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/analytics/activity?view=history&days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setFetchError(true);
      }
    } catch (err) {
      console.error('Failed to fetch activity history:', err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedRange);
  }, [selectedRange, fetchData]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.dataPoints.map(dp => ({
      time: new Date(dp.timestamp).getTime(),
      ...dp.regions,
    }));
  }, [data]);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        if (next.size > 1) next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (selectedRange <= 1) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (selectedRange <= 3) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', hour12: false });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const date = new Date(label);
    const hour = date.getUTCHours();
    const endHour = (hour + 6) % 24;
    const bucketLabel = `${String(hour).padStart(2, '0')}:00\u2013${String(endHour).padStart(2, '0')}:00 UTC`;

    return (
      <div className="bg-[var(--background-card)] border border-[var(--border-card)] rounded-lg px-3 py-2 shadow-lg">
        <p className="text-micro text-[var(--foreground-muted)] mb-1">
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {bucketLabel}
        </p>
        {payload
          .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          .map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--foreground-muted)]">
              {REGION_CONFIG[entry.name]?.label || entry.name}
            </span>
            <span className="font-semibold text-[var(--foreground)] ml-auto tabular-nums font-[family-name:var(--font-geist-mono)]">
              {entry.value ?? 0}
            </span>
          </div>
        ))}
      </div>
    );
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <div className="bg-[var(--background-card)] border border-[var(--border-card)] rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SignalIcon className="w-4 h-4 text-sky-400" />
            <span className="text-label text-sky-400">Feed Activity</span>
          </div>
          <div className="flex items-center gap-1 bg-[var(--background)] rounded-md p-0.5">
            {TIME_RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setSelectedRange(r.days)}
                className={`px-2 py-0.5 text-micro font-medium rounded transition-colors cursor-pointer ${
                  selectedRange === r.days
                    ? 'bg-[var(--background-card)] text-[var(--foreground)]'
                    : 'text-[var(--foreground-light)] hover:text-[var(--foreground-muted)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region toggles */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(REGION_CONFIG).map(([id, config]) => (
            <button
              key={id}
              onClick={() => toggleRegion(id)}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-micro rounded-md border transition-colors cursor-pointer ${
                selectedRegions.has(id)
                  ? 'border-current opacity-100'
                  : 'border-[var(--border-card)] opacity-40'
              }`}
              style={{ color: config.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              {config.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {isLoading && !data ? (
          <div className="flex items-center justify-center h-48">
            <ArrowPathIcon className="w-5 h-5 text-[var(--foreground-light)] animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-caption text-red-400/70">Failed to load activity data</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-caption">No activity data yet — check back after a few hours</span>
          </div>
        ) : (
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={formatXAxis}
                  stroke="var(--foreground-light)"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--foreground-light)"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Baseline reference lines */}
                {data && Object.entries(data.baselines)
                  .filter(([region]) => selectedRegions.has(region))
                  .map(([region, baseline]) => (
                    <ReferenceLine
                      key={`baseline-${region}`}
                      y={baseline}
                      stroke={REGION_CONFIG[region]?.color || '#666'}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                  ))
                }

                {/* Area for each selected region */}
                {Object.entries(REGION_CONFIG)
                  .filter(([id]) => selectedRegions.has(id))
                  .map(([id, config]) => (
                    <Area
                      key={id}
                      type="monotone"
                      dataKey={id}
                      stroke={config.color}
                      fill={config.color}
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))
                }
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

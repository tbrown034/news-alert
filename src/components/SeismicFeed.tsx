'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { Earthquake } from '@/types';

interface SeismicFeedProps {
  onBack?: () => void;
}

interface SeismicStats {
  total: number;
  significant: number;
  withTsunami: number;
  maxMagnitude: number;
  alertCounts: {
    red: number;
    orange: number;
    yellow: number;
    green: number;
  };
}

// Generate AI-style summary based on earthquake data
function generateSeismicSummary(earthquakes: Earthquake[], stats: SeismicStats): {
  status: 'normal' | 'elevated' | 'significant' | 'critical';
  summary: string;
  highlights: string[];
} {
  const now = new Date();
  const last6h = earthquakes.filter(eq => (now.getTime() - eq.time.getTime()) < 6 * 60 * 60 * 1000);
  const majorQuakes = earthquakes.filter(eq => eq.magnitude >= 5.5);
  const significantQuakes = earthquakes.filter(eq => eq.magnitude >= 6.0);

  const highlights: string[] = [];

  // Determine overall status
  let status: 'normal' | 'elevated' | 'significant' | 'critical' = 'normal';

  if (stats.alertCounts.red > 0 || stats.withTsunami > 0) {
    status = 'critical';
  } else if (significantQuakes.length > 0 || stats.alertCounts.orange > 0) {
    status = 'significant';
  } else if (majorQuakes.length >= 2 || stats.alertCounts.yellow > 0) {
    status = 'elevated';
  }

  // Build summary
  let summary = '';

  if (status === 'critical') {
    if (stats.withTsunami > 0) {
      summary = `ALERT: ${stats.withTsunami} earthquake${stats.withTsunami > 1 ? 's' : ''} with tsunami warning detected. `;
    }
    if (stats.alertCounts.red > 0) {
      summary += `Red alert issued for potential significant damage or casualties.`;
    }
  } else if (status === 'significant') {
    const strongest = earthquakes[0];
    if (strongest && strongest.magnitude >= 6.0) {
      summary = `A magnitude ${strongest.magnitude.toFixed(1)} earthquake struck ${strongest.place || 'an unspecified location'}. Monitoring for aftershocks and damage reports.`;
    } else {
      summary = `Elevated seismic activity detected with ${significantQuakes.length} significant event${significantQuakes.length !== 1 ? 's' : ''} in the last 24 hours.`;
    }
  } else if (status === 'elevated') {
    summary = `Above-normal seismic activity with ${majorQuakes.length} notable earthquake${majorQuakes.length !== 1 ? 's' : ''} (M5.5+) in the past 24 hours. No major damage reported.`;
  } else {
    summary = `Global seismic activity within normal parameters. ${stats.total} earthquakes (M2.5+) recorded in the past 24 hours.`;
  }

  // Build highlights
  if (significantQuakes.length > 0) {
    const strongest = significantQuakes[0];
    highlights.push(`Strongest: M${strongest.magnitude.toFixed(1)} near ${strongest.place?.split(',')[0] || 'unknown location'}`);
  }

  if (stats.withTsunami > 0) {
    highlights.push(`${stats.withTsunami} tsunami warning${stats.withTsunami > 1 ? 's' : ''} issued`);
  }

  if (stats.alertCounts.red > 0) {
    highlights.push(`${stats.alertCounts.red} red alert${stats.alertCounts.red > 1 ? 's' : ''} - potential casualties`);
  } else if (stats.alertCounts.orange > 0) {
    highlights.push(`${stats.alertCounts.orange} orange alert${stats.alertCounts.orange > 1 ? 's' : ''} - potential damage`);
  }

  if (last6h.length > 10 && status !== 'critical') {
    highlights.push(`${last6h.length} earthquakes in the last 6 hours`);
  }

  // Add normal context if no dramatic highlights
  if (highlights.length === 0 && stats.total > 0) {
    const avgDepth = earthquakes.reduce((sum, eq) => sum + eq.depth, 0) / earthquakes.length;
    highlights.push(`Average depth: ${avgDepth.toFixed(0)}km`);
    if (earthquakes.some(eq => eq.felt && eq.felt > 100)) {
      const feltCount = earthquakes.filter(eq => eq.felt && eq.felt > 100).length;
      highlights.push(`${feltCount} widely felt event${feltCount > 1 ? 's' : ''}`);
    }
  }

  return { status, summary, highlights };
}

const statusStyles = {
  normal: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'NORMAL',
  },
  elevated: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    label: 'ELEVATED',
  },
  significant: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'SIGNIFICANT',
  },
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'CRITICAL',
  },
};

export function SeismicFeed({ onBack }: SeismicFeedProps) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [stats, setStats] = useState<SeismicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarthquakes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seismic?period=day&minMag=2.5');

      if (!response.ok) {
        throw new Error('Failed to fetch earthquake data');
      }

      const data = await response.json();

      // Parse dates
      const parsedEarthquakes = data.earthquakes.map((eq: any) => ({
        ...eq,
        time: new Date(eq.time),
      }));

      setEarthquakes(parsedEarthquakes);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarthquakes();
  }, [fetchEarthquakes]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const timer = setInterval(fetchEarthquakes, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchEarthquakes]);

  // Loading state
  if (isLoading && earthquakes.length === 0) {
    return (
      <div className="mx-4 my-3 px-4 py-4 border border-gray-800/50 rounded-lg bg-gray-900/30">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Analyzing seismic activity...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-4 my-3 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">Failed to load seismic data</p>
            <p className="text-red-400/70 text-xs mt-1">{error}</p>
          </div>
          <button
            onClick={fetchEarthquakes}
            className="px-3 py-1.5 text-xs font-medium bg-red-800/50 hover:bg-red-800 text-red-200 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Generate AI summary
  const analysis = stats ? generateSeismicSummary(earthquakes, stats) : null;

  if (!analysis || !stats) {
    return null;
  }

  const style = statusStyles[analysis.status];

  return (
    <div className={`mx-4 my-3 border ${style.border} rounded-lg overflow-hidden ${style.bg}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GlobeAltIcon className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Seismic Monitor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <button
            onClick={fetchEarthquakes}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-300 leading-relaxed">
          {analysis.summary}
        </p>

        {/* Highlights */}
        {analysis.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.highlights.map((highlight, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-black/20 text-gray-400 rounded"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        {/* Stats footer */}
        <div className="mt-3 pt-3 border-t border-gray-800/30 flex items-center justify-between text-[10px] text-gray-500">
          <span>{stats.total} earthquakes (M2.5+) in 24h</span>
          <span>Max: M{stats.maxMagnitude.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

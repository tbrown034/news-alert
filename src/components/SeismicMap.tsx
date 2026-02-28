'use client';

import { memo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { ArrowPathIcon, PlusIcon, MinusIcon, ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { Earthquake } from '@/types';
import { useMapTheme, mapDimensions } from '@/lib/mapTheme';

// Default zoom settings
const DEFAULT_CENTER: [number, number] = [0, 15];
const DEFAULT_ZOOM = 1;

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface SeismicMapProps {
  earthquakes: Earthquake[];
  selected: Earthquake | null;
  onSelect: (eq: Earthquake | null) => void;
  isLoading?: boolean;
  focusOnId?: string; // If provided, center on this specific earthquake
  lastFetched?: Date | null;
  onRefresh?: () => void;
}

// Get circle radius based on magnitude (exponential scaling)
function getMagnitudeRadius(mag: number): number {
  // More visible scaling: mag 2.5 = 6px, mag 5 = 16px, mag 7 = 40px
  return Math.pow(2, mag - 1) * 1.5;
}

// Get color based on magnitude
function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return '#dc2626'; // Red - major
  if (mag >= 6) return '#ea580c'; // Orange - strong
  if (mag >= 5) return '#f59e0b'; // Amber - moderate
  if (mag >= 4) return '#eab308'; // Yellow - light
  return '#22c55e'; // Green - minor
}

// Get alert color
function getAlertColor(alert: Earthquake['alert']): string {
  switch (alert) {
    case 'red': return '#dc2626';
    case 'orange': return '#ea580c';
    case 'yellow': return '#eab308';
    case 'green': return '#22c55e';
    default: return '#6b7280';
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

type FilterMode = 'all' | 'major';

function SeismicMapComponent({ earthquakes, selected, onSelect, isLoading, focusOnId, lastFetched, onRefresh }: SeismicMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ coordinates: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  const [filterMode, setFilterMode] = useState<FilterMode>('major'); // Default to major only
  const [hasAutoFocused, setHasAutoFocused] = useState(false);
  const [showStats, setShowStats] = useState(false); // Collapsed by default
  const { theme } = useMapTheme();

  // Auto-focus on largest earthquake (or specific one if focusOnId provided) when data loads
  useEffect(() => {
    if (hasAutoFocused || earthquakes.length === 0) return;

    let targetQuake: Earthquake | undefined;

    if (focusOnId) {
      // Focus on specific earthquake
      targetQuake = earthquakes.find(eq => eq.id === focusOnId);
    } else {
      // Focus on largest magnitude earthquake
      targetQuake = [...earthquakes].sort((a, b) => b.magnitude - a.magnitude)[0];
    }

    if (targetQuake) {
      // Center on the earthquake with gentle zoom to maintain global context
      // Lower zoom keeps more of the world visible (1.0 = full view, 2.0 = 2x zoom)
      const zoom = targetQuake.magnitude >= 6 ? 1.3 : 1.15;
      setPosition({
        coordinates: [targetQuake.coordinates[0], targetQuake.coordinates[1]],
        zoom,
      });
      // Auto-select it to show the info panel
      onSelect(targetQuake);
      setHasAutoFocused(true);
    }
  }, [earthquakes, focusOnId, hasAutoFocused, onSelect]);

  // Reset auto-focus when focusOnId changes (allows re-focusing on new target)
  useEffect(() => {
    setHasAutoFocused(false);
  }, [focusOnId]);

  // Filter earthquakes based on mode
  // Filter: 'major' = M5+, 'all' = M4+ (USGS data is typically M4+ anyway)
  const filteredEarthquakes = filterMode === 'major'
    ? earthquakes.filter(eq => eq.magnitude >= 5.0)
    : earthquakes.filter(eq => eq.magnitude >= 4.0);

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.5) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`relative w-full ${theme.water} overflow-hidden`}>
        <div className={`relative ${mapDimensions.height} flex items-center justify-center`}>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Loading seismic map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${theme.water} overflow-hidden`}>
      <div className={`relative ${mapDimensions.height}`}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{
            scale: 220,
            center: [0, 0],
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={0.5}
            maxZoom={4}
          >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={theme.land}
                  stroke={theme.stroke}
                  strokeWidth={theme.strokeWidth}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: theme.landHover },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Earthquake markers */}
          {filteredEarthquakes.map((eq) => {
            const isSelected = selected?.id === eq.id;
            const radius = getMagnitudeRadius(eq.magnitude);
            const color = getMagnitudeColor(eq.magnitude);

            return (
              <Marker
                key={eq.id}
                coordinates={[eq.coordinates[0], eq.coordinates[1]]}
                onClick={() => onSelect(isSelected ? null : eq)}
                style={{ default: { cursor: 'pointer' } }}
              >
                {/* Outer glow for significant quakes */}
                {eq.magnitude >= 5 && (
                  <circle
                    r={radius * 1.6}
                    fill={color}
                    fillOpacity={0.25}
                    className={eq.magnitude >= 6 ? 'animate-ping' : ''}
                  />
                )}

                {/* Main marker */}
                <circle
                  r={radius}
                  fill={color}
                  fillOpacity={0.8}
                  stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={isSelected ? 3 : 1}
                  className="transition-all duration-200 hover:fill-opacity-100"
                />

                {/* Magnitude label for large quakes */}
                {eq.magnitude >= 5 && (
                  <text
                    y={radius + 16}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                  >
                    M{eq.magnitude.toFixed(1)}
                  </text>
                )}
              </Marker>
            );
          })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom Controls */}
        <div className="absolute top-14 left-3 flex flex-col gap-1 z-10">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Zoom in"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Zoom out"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Reset view"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Stats badge with filter toggle */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg font-medium shadow-sm border border-slate-200 dark:border-slate-700">
              {filteredEarthquakes.length} quakes {filterMode === 'major' ? 'M5+' : 'M4+'} <span className="text-slate-500 dark:text-slate-400">(24h)</span>
            </div>
            <div className="flex bg-white/90 dark:bg-slate-800/90 rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFilterMode('major')}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filterMode === 'major'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                M5+
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                M4+
              </button>
            </div>
            {/* Refresh with last updated time */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                title="Refresh earthquake data"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {lastFetched && !isLoading && (
                  <span>{formatTimeAgo(lastFetched)}</span>
                )}
              </button>
            )}
            {/* Stats toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Toggle stats"
            >
              Stats
              <ChevronDownIcon className={`w-3 h-3 transition-transform ${showStats ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {/* Expandable stats row */}
          {showStats && filteredEarthquakes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-2xs">
              {(() => {
                const largest = Math.max(...filteredEarthquakes.map(eq => eq.magnitude));
                const majorCount = filteredEarthquakes.filter(eq => eq.magnitude >= 6).length;
                const tsunamiCount = filteredEarthquakes.filter(eq => eq.tsunami).length;
                const depths = filteredEarthquakes.map(eq => eq.depth);
                const avgDepth = Math.round(depths.reduce((a, b) => a + b, 0) / depths.length);
                return (
                  <>
                    <span className="px-2 py-1 bg-white/90 dark:bg-slate-800/90 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      Max <span className="font-semibold text-amber-600 dark:text-amber-400">M{largest.toFixed(1)}</span>
                    </span>
                    {majorCount > 0 && (
                      <span className="px-2 py-1 bg-white/90 dark:bg-slate-800/90 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-red-500">{majorCount}</span> major
                      </span>
                    )}
                    {tsunamiCount > 0 && (
                      <span className="px-2 py-1 bg-blue-50/90 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300">
                        <span className="font-semibold">{tsunamiCount}</span> tsunami
                      </span>
                    )}
                    <span className="px-2 py-1 bg-white/90 dark:bg-slate-800/90 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      ~{avgDepth}km deep
                    </span>
                    <a
                      href="https://earthquake.usgs.gov/earthquakes/map/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-slate-800/90 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <GlobeAltIcon className="w-3 h-3" />
                      USGS
                    </a>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Selected earthquake details */}
      {selected && (
        <div className="px-3 sm:px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="px-2.5 py-1 text-sm font-bold rounded-md"
                  style={{
                    backgroundColor: `${getMagnitudeColor(selected.magnitude)}20`,
                    color: getMagnitudeColor(selected.magnitude),
                  }}
                >
                  M{selected.magnitude.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{formatTimeAgo(selected.time)}</span>
                {selected.tsunami && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                    TSUNAMI
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">{selected.place}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Depth: {selected.depth.toFixed(1)}km
                {selected.felt && ` · ${selected.felt.toLocaleString()} felt reports`}
              </p>
            </div>
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 whitespace-nowrap font-medium flex-shrink-0 cursor-pointer"
            >
              USGS →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export const SeismicMap = memo(SeismicMapComponent);

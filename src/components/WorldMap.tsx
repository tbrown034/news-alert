'use client';

import { memo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { Watchpoint, WatchpointId } from '@/types';

// World map TopoJSON - using a CDN for the geography data
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  watchpoints: Watchpoint[];
  selected: WatchpointId;
  onSelect: (id: WatchpointId) => void;
  regionCounts?: Record<string, number>;
}

// Activity level colors
const activityColors: Record<string, { fill: string; glow: string; text: string }> = {
  critical: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', text: 'text-red-400' },
  high: { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', text: 'text-orange-400' },
  elevated: { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' },
  normal: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', text: 'text-blue-400' },
  low: { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' },
};

// Region marker positions (longitude, latitude)
const regionMarkers: Record<string, { coordinates: [number, number]; label: string }> = {
  'middle-east': { coordinates: [51.4, 32.4], label: 'Middle East' }, // Iran area
  'ukraine-russia': { coordinates: [37.6, 50.4], label: 'Ukraine' }, // Eastern Ukraine
  'china-taiwan': { coordinates: [121.5, 25.0], label: 'Taiwan' },
  'venezuela': { coordinates: [-66.9, 10.5], label: 'Venezuela' },
  'us-domestic': { coordinates: [-98.5, 39.8], label: 'United States' },
};

function WorldMapComponent({ watchpoints, selected, onSelect, regionCounts = {} }: WorldMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getActivityLevel = (id: string) => {
    const wp = watchpoints.find(w => w.id === id);
    return wp?.activityLevel || 'normal';
  };

  // Show loading placeholder during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="relative w-full bg-[#0a0d12] border-b border-gray-800/60 overflow-hidden">
        <div className="relative h-[200px] sm:h-[240px] flex items-center justify-center">
          <div className="text-gray-600 text-sm">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0a0d12] border-b border-gray-800/60 overflow-hidden">
      {/* Map Container */}
      <div className="relative h-[200px] sm:h-[240px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [30, 30], // Center on Middle East / Europe area
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1a1f2e"
                    stroke="#2d3748"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#252d3d' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Region Markers */}
            {Object.entries(regionMarkers).map(([id, marker]) => {
              const activityLevel = getActivityLevel(id);
              const colors = activityColors[activityLevel];
              const isSelected = selected === id;
              const isHot = activityLevel === 'critical' || activityLevel === 'high';
              const count = regionCounts[id] || 0;

              return (
                <Marker
                  key={id}
                  coordinates={marker.coordinates}
                  onClick={() => onSelect(id as WatchpointId)}
                  style={{ default: { cursor: 'pointer' } }}
                >
                  {/* Pulse ring for hot regions */}
                  {isHot && (
                    <circle
                      r={20}
                      fill="none"
                      stroke={colors.fill}
                      strokeWidth={2}
                      opacity={0.4}
                      className="animate-ping"
                    />
                  )}

                  {/* Outer glow */}
                  <circle
                    r={isSelected ? 14 : 10}
                    fill={colors.glow}
                    opacity={0.5}
                  />

                  {/* Main marker */}
                  <circle
                    r={isSelected ? 8 : 6}
                    fill={colors.fill}
                    stroke={isSelected ? '#fff' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                    className={isHot ? 'animate-pulse' : ''}
                  />

                  {/* Count badge */}
                  {count > 0 && (
                    <>
                      <circle
                        cx={10}
                        cy={-10}
                        r={8}
                        fill="#0a0d12"
                      />
                      <text
                        x={10}
                        y={-6}
                        textAnchor="middle"
                        fill={colors.fill}
                        fontSize={8}
                        fontWeight="bold"
                      >
                        {count > 99 ? '99+' : count}
                      </text>
                    </>
                  )}

                  {/* Label */}
                  <text
                    y={20}
                    textAnchor="middle"
                    fill={isSelected ? '#fff' : '#9ca3af'}
                    fontSize={10}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    style={{
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      pointerEvents: 'none',
                    }}
                  >
                    {marker.label}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* "All Regions" button */}
        <button
          onClick={() => onSelect('all')}
          className={`
            absolute bottom-3 left-4 px-3 py-1.5 rounded-full text-xs font-medium
            transition-all duration-200 z-10
            ${selected === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 hover:text-gray-200'
            }
          `}
        >
          All Regions
        </button>

        {/* Legend */}
        <div className="absolute bottom-3 right-4 flex items-center gap-3 text-[10px] text-gray-500 z-10">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Normal</span>
          </div>
        </div>
      </div>

      {/* Selected Region Info Bar */}
      {selected !== 'all' && (
        <div className="px-4 py-2 bg-black/30 border-t border-gray-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activityColors[getActivityLevel(selected)].fill }}
            />
            <span className="text-sm font-medium text-gray-200">
              {regionMarkers[selected]?.label || selected}
            </span>
            <span className={`text-xs ${activityColors[getActivityLevel(selected)].text}`}>
              {getActivityLevel(selected).charAt(0).toUpperCase() + getActivityLevel(selected).slice(1)} Activity
            </span>
          </div>
          {regionCounts[selected] && regionCounts[selected] > 0 && (
            <span className="text-xs text-gray-400">
              {regionCounts[selected]} updates
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const WorldMap = memo(WorldMapComponent);

'use client';

import { memo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { PlusIcon, MinusIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Watchpoint, WatchpointId, Earthquake } from '@/types';
import { RegionActivity } from '@/lib/activityDetection';
import { useMapTheme, mapDimensions } from '@/lib/mapTheme';

export interface TFRMarker {
  id: string;
  title: string;
  coordinates: [number, number]; // centroid [lon, lat]
  tfrType: string;
  state: string;
  severity: string;
}

export interface FireMarker {
  id: string;
  title: string;
  coordinates: [number, number]; // [lon, lat]
  severity: string;
  brightness: number;
  source: string;
}

// World map TopoJSON - using a CDN for the geography data
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/**
 * Get time at a given longitude with city name
 * @param now - Current time (passed in to trigger React re-renders)
 * @param useUTC - If true, shows UTC time instead of estimated local time
 */
function getTimeDisplay(longitude: number, city: string, now: Date, useUTC: boolean): string {
  if (useUTC) {
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
    return `${time} UTC`;
  }

  // Approximate timezone offset from longitude (15 degrees = 1 hour)
  const offsetHours = Math.round(longitude / 15);
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utcTime + offsetHours * 3600000);

  const time = localTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${time} ${city}`;
}

interface WorldMapProps {
  watchpoints: Watchpoint[];
  selected: WatchpointId;
  onSelect: (id: WatchpointId) => void;
  activity?: Record<string, RegionActivity>;
  significantQuakes?: Earthquake[]; // 6.0+ earthquakes for Main view
  hoursWindow?: number; // Time window in hours
  hotspotsOnly?: boolean; // Only show elevated/critical regions
  useUTC?: boolean; // Display times in UTC instead of local
  initialFocus?: WatchpointId; // Focus map here on load (without filtering feed)
  showTimes?: boolean; // Show local time under region labels (default: true)
  showZoomControls?: boolean; // Show zoom +/- and globe buttons (default: true)
  tfrs?: TFRMarker[]; // Active TFRs for map markers
  fires?: FireMarker[]; // Active wildfire detections
}

// Activity level colors - visual language:
// Green = Normal, Orange = Elevated, Red = Critical
const activityColors: Record<string, { fill: string; glow: string; text: string }> = {
  critical: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', text: 'text-red-400' },      // Red - critical
  elevated: { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', text: 'text-orange-400' },  // Orange - elevated
  normal: { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)', text: 'text-green-400' },      // Green - normal
};

// Region marker positions (longitude, latitude) - positioned for visual balance
const regionMarkers: Record<string, { coordinates: [number, number]; label: string; city: string; zoom: number }> = {
  'us': { coordinates: [-77.04, 38.91], label: 'United States', city: 'DC', zoom: 2.2 },
  'latam': { coordinates: [-66.90, 10.48], label: 'Latin America', city: 'Caracas', zoom: 1.8 },
  'middle-east': { coordinates: [51.39, 35.69], label: 'Middle East', city: 'Tehran', zoom: 2.5 },
  'europe-russia': { coordinates: [30.52, 50.45], label: 'Europe-Russia', city: 'Kyiv', zoom: 2.2 },
  'asia': { coordinates: [116.40, 39.90], label: 'Asia-Pacific', city: 'Beijing', zoom: 1.6 },
  'africa': { coordinates: [17.11, 1.66], label: 'Africa', city: 'Kinshasa', zoom: 1.6 },
};

// Default zoom settings - zoomed in for tighter view while showing all regions
const DEFAULT_CENTER: [number, number] = [20, 30];
const DEFAULT_ZOOM = 1.6;

function WorldMapComponent({ watchpoints, selected, onSelect, activity = {}, significantQuakes = [], hoursWindow = 6, hotspotsOnly = false, useUTC = false, initialFocus, showTimes = true, showZoomControls = true, tfrs = [], fires = [] }: WorldMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasAppliedInitialFocus, setHasAppliedInitialFocus] = useState(false);

  // Start focused on initialFocus region if provided, otherwise default center
  const [position, setPosition] = useState(() => {
    if (initialFocus && initialFocus !== 'all' && regionMarkers[initialFocus]) {
      const marker = regionMarkers[initialFocus];
      return { coordinates: marker.coordinates, zoom: marker.zoom };
    }
    return { coordinates: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  });
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [hoveredQuake, setHoveredQuake] = useState<string | null>(null);
  const [hoveredTFR, setHoveredTFR] = useState<string | null>(null);
  const [hoveredFire, setHoveredFire] = useState<string | null>(null);
  const { theme } = useMapTheme();

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.5) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  // Reset to world view AND clear region filter
  const handleShowAll = () => {
    setPosition({ coordinates: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    onSelect('all');
  };

  // Get earthquake marker color based on magnitude
  const getQuakeColor = (magnitude: number) => {
    if (magnitude >= 7) return '#ef4444'; // Red
    if (magnitude >= 6.5) return '#f97316'; // Orange
    return '#eab308'; // Yellow
  };

  // Marker sizing reflects real-world frequency & significance:
  // M6+ ~weekly, M7+ ~monthly, M7.5+ few/year → scale accordingly
  const getQuakeRadius = (magnitude: number) => {
    if (magnitude >= 7.5) return 16; // Rare, catastrophic
    if (magnitude >= 7) return 11;   // Major, ~monthly
    if (magnitude >= 6.5) return 7;  // Strong, bi-weekly
    return 4;                         // M6+, ~weekly — modest
  };

  // Fires: many detections, only critical fires deserve visual weight
  const getFireRadius = (severity: string) => {
    if (severity === 'critical') return 3;
    if (severity === 'severe') return 1.5;
    return 1;
  };

  // TFRs: dozens active at any time, background noise unless security/VIP
  const getTfrRadius = (tfrType: string) => {
    if (tfrType === 'Security' || tfrType === 'VIP') return 2;
    return 1;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update time every minute for local times display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Zoom to selected region (but preserve initial focus on first render)
  useEffect(() => {
    // Skip the first effect if we have an initial focus and selected is 'all'
    // This preserves the "camera pointed at hotspot" while showing global feed
    if (!hasAppliedInitialFocus && initialFocus && selected === 'all') {
      setHasAppliedInitialFocus(true);
      return; // Keep the initial focus position
    }

    if (selected === 'all') {
      setPosition({ coordinates: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    } else if (regionMarkers[selected]) {
      const marker = regionMarkers[selected];
      setPosition({ coordinates: marker.coordinates, zoom: marker.zoom });
    }
  }, [selected, hasAppliedInitialFocus, initialFocus]);

  const getActivityLevel = (id: string) => {
    const wp = watchpoints.find(w => w.id === id);
    return wp?.activityLevel || 'normal';
  };

  // Show loading placeholder during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className={`relative w-full ${theme.water} overflow-hidden`}>
        <div className={`relative ${mapDimensions.height} flex items-center justify-center`}>
          <div className="text-gray-500 dark:text-gray-600 text-sm">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${theme.water} overflow-hidden`}>
      {/* Map Container */}
      <div className={`relative ${mapDimensions.height}`}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{
            scale: 280,
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
          {/* Ocean click catcher - clicking empty water resets to all regions */}
          <rect
            x={-1000}
            y={-1000}
            width={3000}
            height={2000}
            fill="transparent"
            onClick={handleShowAll}
            style={{ cursor: selected !== 'all' ? 'pointer' : 'default' }}
          />
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={theme.land}
                  stroke={theme.stroke}
                  strokeWidth={0.5}
                  onClick={(e) => e.stopPropagation()} // Prevent land clicks from triggering ocean reset
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: theme.landHover },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Region Markers */}
          {Object.entries(regionMarkers)
            .filter(([id]) => {
              // In hotspots mode, only show elevated or critical regions
              if (hotspotsOnly) {
                const level = getActivityLevel(id);
                return level === 'elevated' || level === 'critical';
              }
              return true;
            })
            .map(([id, marker]) => {
            const activityLevel = getActivityLevel(id);
            const colors = activityColors[activityLevel] || activityColors.normal;
            const isSelected = selected === id;
            const isHovered = hoveredMarker === id;
            const isCritical = activityLevel === 'critical';

            return (
              <Marker
                key={id}
                coordinates={marker.coordinates}
                onClick={() => onSelect(id as WatchpointId)}
                onMouseEnter={() => setHoveredMarker(id)}
                onMouseLeave={() => setHoveredMarker(null)}
                style={{ default: { cursor: 'pointer' } }}
              >
                {/* Selection ring animation */}
                {isSelected && (
                  <circle
                    r={24}
                    fill="none"
                    stroke={theme.markerStroke}
                    strokeWidth={2}
                    opacity={0.5}
                    strokeDasharray="4 4"
                    className="animate-spin-slow"
                  />
                )}

                {/* Pulse ring for hot regions - very subdued */}
                {isCritical && (
                  <circle
                    r={22}
                    fill="none"
                    stroke={colors.fill}
                    strokeWidth={1.5}
                    opacity={0.25}
                    className="animate-ping-subtle"
                  />
                )}

                {/* Outer glow - grows on hover */}
                <circle
                  r={isSelected ? 20 : isHovered ? 18 : 16}
                  fill={colors.glow}
                  opacity={isHovered ? theme.glowOpacityHover : theme.glowOpacity}
                  style={{ transition: 'r 150ms ease, opacity 150ms ease' }}
                />

                {/* Main marker - scales on hover */}
                <circle
                  r={isSelected ? 12 : isHovered ? 11 : 10}
                  fill={colors.fill}
                  stroke={isSelected ? theme.markerStroke : isHovered ? theme.markerStrokeHover : theme.markerStrokeDefault}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                  className={isCritical ? 'animate-pulse-subtle' : ''}
                  style={{ transition: 'r 150ms ease, stroke-width 150ms ease' }}
                />

                {/* Label */}
                <text
                  y={34}
                  textAnchor="middle"
                  fill={isSelected || isHovered ? theme.labelActive : theme.labelDefault}
                  fontSize={20}
                  fontWeight={isSelected || isHovered ? '700' : '600'}
                  style={{
                    textShadow: theme.textShadow,
                    pointerEvents: 'none',
                    transition: 'fill 150ms ease',
                  }}
                >
                  {marker.label}
                </text>

                {/* Local Time with City */}
                {showTimes && (
                  <text
                    y={58}
                    textAnchor="middle"
                    fill={theme.timeLabel}
                    fontSize={16}
                    fontWeight="500"
                    fontFamily="monospace"
                    style={{
                      textShadow: theme.textShadow,
                      pointerEvents: 'none',
                    }}
                  >
                    {getTimeDisplay(marker.coordinates[0], marker.city, currentTime, useUTC)}
                  </text>
                )}

                {/* Hover tooltip - activity level */}
                {isHovered && !isSelected && (
                  <g>
                    <rect
                      x={-40}
                      y={-45}
                      width={80}
                      height={24}
                      rx={4}
                      fill="rgba(0,0,0,0.8)"
                    />
                    <text
                      y={-28}
                      textAnchor="middle"
                      fill={colors.fill}
                      fontSize={11}
                      fontWeight="600"
                      style={{ pointerEvents: 'none' }}
                    >
                      {activityLevel.toUpperCase()}
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}

          {/* Significant Earthquake Markers (6.0+) */}
          {significantQuakes.map((quake) => {
            const qRadius = getQuakeRadius(quake.magnitude);
            return (
            <Marker
              key={quake.id}
              coordinates={[quake.coordinates[0], quake.coordinates[1]]}
              onMouseEnter={() => setHoveredQuake(quake.id)}
              onMouseLeave={() => setHoveredQuake(null)}
            >
              {/* Outer pulse ring — scales with magnitude */}
              <circle
                r={qRadius * 2.5}
                fill="none"
                stroke={getQuakeColor(quake.magnitude)}
                strokeWidth={quake.magnitude >= 7 ? 2.5 : 1.5}
                opacity={0.3}
                className="animate-ping-subtle"
              />
              {/* Inner pulse ring */}
              <circle
                r={qRadius * 1.6}
                fill="none"
                stroke={getQuakeColor(quake.magnitude)}
                strokeWidth={1.5}
                opacity={0.5}
                className="animate-pulse"
              />
              {/* Main marker — size by magnitude */}
              <circle
                r={hoveredQuake === quake.id ? qRadius + 1.5 : qRadius}
                fill={getQuakeColor(quake.magnitude)}
                stroke="#fff"
                strokeWidth={quake.magnitude >= 7 ? 2.5 : 1.5}
                style={{ cursor: 'pointer', transition: 'r 150ms ease' }}
              />
              {/* Tooltip on hover */}
              {hoveredQuake === quake.id && (
                <g>
                  <rect
                    x={-50}
                    y={-35}
                    width={100}
                    height={26}
                    rx={4}
                    fill="rgba(0,0,0,0.9)"
                  />
                  <text
                    y={-18}
                    textAnchor="middle"
                    fill={getQuakeColor(quake.magnitude)}
                    fontSize={11}
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    M{quake.magnitude.toFixed(1)} - {quake.place?.split(',')[0] || 'Unknown'}
                  </text>
                </g>
              )}
            </Marker>
            );
          })}

          {/* Fire Markers (Wildfire detections) */}
          {fires.map((fire) => {
            const isHovered = hoveredFire === fire.id;
            const isCritical = fire.severity === 'critical';
            const markerColor = isCritical ? '#ef4444' : '#f97316'; // red for critical, orange for severe
            const fRadius = getFireRadius(fire.severity);
            return (
              <Marker
                key={fire.id}
                coordinates={fire.coordinates}
                onMouseEnter={() => setHoveredFire(fire.id)}
                onMouseLeave={() => setHoveredFire(null)}
              >
                {/* Outer glow — pulsing for critical, scaled by severity */}
                <circle
                  r={fRadius * 2.5}
                  fill={markerColor}
                  opacity={isHovered ? 0.3 : 0.15}
                  style={{ transition: 'opacity 150ms ease' }}
                >
                  {isCritical && (
                    <animate attributeName="r" values={`${fRadius * 2.5};${fRadius * 3.5};${fRadius * 2.5}`} dur="2s" repeatCount="indefinite" />
                  )}
                </circle>
                {/* Main dot — size by severity */}
                <circle
                  r={isHovered ? fRadius + 1 : fRadius}
                  fill={markerColor}
                  stroke="#fff"
                  strokeWidth={isCritical ? 1 : 0.5}
                  style={{ cursor: 'pointer', transition: 'r 150ms ease' }}
                />
                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={-60}
                      y={-38}
                      width={120}
                      height={26}
                      rx={4}
                      fill="rgba(0,0,0,0.9)"
                    />
                    <text
                      y={-26}
                      textAnchor="middle"
                      fill={markerColor}
                      fontSize={10}
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      {fire.title.length > 25 ? fire.title.slice(0, 25) + '…' : fire.title}
                    </text>
                    <text
                      y={-16}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize={9}
                      style={{ pointerEvents: 'none' }}
                    >
                      {fire.source} · {fire.brightness > 0 ? `${fire.brightness.toFixed(0)}K` : fire.severity}
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}

          {/* TFR Markers (Flight Restrictions) */}
          {tfrs.map((tfr) => {
            const isHovered = hoveredTFR === tfr.id;
            const tRadius = getTfrRadius(tfr.tfrType);
            return (
              <Marker
                key={tfr.id}
                coordinates={tfr.coordinates}
                onMouseEnter={() => setHoveredTFR(tfr.id)}
                onMouseLeave={() => setHoveredTFR(null)}
              >
                {/* Dashed outer ring — scaled by type */}
                <circle
                  r={tRadius * 3}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  opacity={isHovered ? 0.8 : 0.3}
                  style={{ transition: 'opacity 150ms ease' }}
                />
                {/* Main marker — size by type */}
                <circle
                  r={isHovered ? tRadius + 1 : tRadius}
                  fill="#22d3ee"
                  stroke="#fff"
                  strokeWidth={1}
                  style={{ cursor: 'pointer', transition: 'r 150ms ease' }}
                />
                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={-65}
                      y={-40}
                      width={130}
                      height={28}
                      rx={4}
                      fill="rgba(0,0,0,0.9)"
                    />
                    <text
                      y={-28}
                      textAnchor="middle"
                      fill="#22d3ee"
                      fontSize={10}
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      {tfr.tfrType} TFR
                    </text>
                    <text
                      y={-17}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize={9}
                      style={{ pointerEvents: 'none' }}
                    >
                      {tfr.state} — {tfr.title.split(',')[0]}
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom Controls */}
        {showZoomControls && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            <button
              onClick={handleShowAll}
              className={`p-2 rounded-lg transition-colors ${
                selected === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white'
              }`}
              title="Show all regions"
            >
              <GlobeAltIcon className="w-4 h-4" />
            </button>
            <div className="h-px bg-white/20 my-0.5" />
            <button
              onClick={handleZoomIn}
              className="p-2 bg-black/60 hover:bg-black/80 rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Zoom in"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-black/60 hover:bg-black/80 rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Zoom out"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const WorldMap = memo(WorldMapComponent);

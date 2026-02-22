/**
 * THREAT ASSESSMENTS API
 * ======================
 * Consolidates data from multiple threat sources (seismic, weather, fires, travel, outages)
 * into a unified threat assessment response, grouped by region with severity levels.
 */

import { NextResponse } from 'next/server';
import type { WatchpointId } from '@/types';

export const dynamic = 'force-dynamic';

// =============================================================================
// TYPES
// =============================================================================

type SeverityLevel = 'critical' | 'severe' | 'moderate' | 'minor';

interface BaseThreat {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  coordinates: [number, number];
  timestamp: Date;
  source: string;
  url?: string;
  region: WatchpointId;
}

interface SeismicThreat extends BaseThreat {
  type: 'seismic';
  magnitude: number;
  depth: number;
  tsunami: boolean;
}

interface WeatherThreat extends BaseThreat {
  type: 'weather';
  eventType: string;
  affectedAreas?: string[];
}

interface FireThreat extends BaseThreat {
  type: 'fire';
  brightness?: number;
  confidence?: string;
}

interface TravelThreat extends BaseThreat {
  type: 'travel';
  country: string;
  countryCode: string;
  level: 1 | 2 | 3 | 4;
  levelText: string;
  risks: string[];
}

interface OutageThreat extends BaseThreat {
  type: 'outage';
  country: string;
  countryCode: string;
  percentDown: number;
}

interface TFRThreat extends BaseThreat {
  type: 'tfr';
  tfrType: string;
  state: string;
  notamKey: string;
}

type Threat = SeismicThreat | WeatherThreat | FireThreat | TravelThreat | OutageThreat | TFRThreat;

interface ThreatsByType {
  seismic: SeismicThreat[];
  weather: WeatherThreat[];
  fires: FireThreat[];
  travel: TravelThreat[];
  outages: OutageThreat[];
  tfrs: TFRThreat[];
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

interface ThreatsResponse {
  threats: ThreatsByType;
  byRegion: Record<WatchpointId, RegionThreats>;
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
// REGION DETECTION
// =============================================================================

/**
 * Determine region from coordinates [lon, lat]
 */
function getRegionFromCoordinates(lon: number, lat: number): WatchpointId {
  // US (continental, Alaska, Hawaii)
  if (
    (lon >= -125 && lon <= -66 && lat >= 24 && lat <= 50) || // Continental US
    (lon >= -170 && lon <= -130 && lat >= 51 && lat <= 72) || // Alaska
    (lon >= -161 && lon <= -154 && lat >= 18 && lat <= 23) // Hawaii
  ) {
    return 'us';
  }

  // Latin America (Mexico, Central America, South America, Caribbean)
  if (
    (lon >= -118 && lon <= -86 && lat >= 14 && lat <= 33) || // Mexico
    (lon >= -92 && lon <= -59 && lat >= 7 && lat <= 24) || // Central America & Caribbean
    (lon >= -82 && lon <= -34 && lat >= -56 && lat <= 13) // South America
  ) {
    return 'latam';
  }

  // Middle East
  if (lon >= 24 && lon <= 63 && lat >= 12 && lat <= 42) {
    return 'middle-east';
  }

  // Europe-Russia
  if (
    (lon >= -10 && lon <= 40 && lat >= 35 && lat <= 72) || // Europe
    (lon >= 40 && lon <= 180 && lat >= 41 && lat <= 82) || // Russia
    (lon >= -180 && lon <= -168 && lat >= 64 && lat <= 72) // Eastern Russia (wraps)
  ) {
    return 'europe-russia';
  }

  // Asia
  if (
    (lon >= 60 && lon <= 150 && lat >= -10 && lat <= 55) || // Asia
    (lon >= 95 && lon <= 180 && lat >= -50 && lat <= 30) // Southeast Asia & Oceania
  ) {
    return 'asia';
  }

  return 'all';
}

/**
 * Determine region from country code
 */
function getRegionFromCountryCode(code: string): WatchpointId {
  const regionMap: Record<string, WatchpointId> = {
    // US
    'US': 'us',
    // Latin America
    'MX': 'latam', 'BR': 'latam', 'AR': 'latam', 'CO': 'latam', 'VE': 'latam',
    'PE': 'latam', 'CL': 'latam', 'EC': 'latam', 'BO': 'latam', 'PY': 'latam',
    'UY': 'latam', 'GY': 'latam', 'SR': 'latam', 'CU': 'latam', 'HT': 'latam',
    'DO': 'latam', 'JM': 'latam', 'PA': 'latam', 'CR': 'latam', 'NI': 'latam',
    'HN': 'latam', 'SV': 'latam', 'GT': 'latam', 'BZ': 'latam', 'PR': 'latam',
    // Middle East
    'IR': 'middle-east', 'IQ': 'middle-east', 'SA': 'middle-east', 'AE': 'middle-east',
    'IL': 'middle-east', 'JO': 'middle-east', 'LB': 'middle-east', 'SY': 'middle-east',
    'YE': 'middle-east', 'OM': 'middle-east', 'KW': 'middle-east', 'QA': 'middle-east',
    'BH': 'middle-east', 'PS': 'middle-east', 'EG': 'middle-east', 'TR': 'middle-east',
    // Europe-Russia
    'RU': 'europe-russia', 'UA': 'europe-russia', 'BY': 'europe-russia',
    'DE': 'europe-russia', 'FR': 'europe-russia', 'GB': 'europe-russia',
    'IT': 'europe-russia', 'ES': 'europe-russia', 'PL': 'europe-russia',
    'NL': 'europe-russia', 'BE': 'europe-russia', 'SE': 'europe-russia',
    'NO': 'europe-russia', 'FI': 'europe-russia', 'DK': 'europe-russia',
    'AT': 'europe-russia', 'CH': 'europe-russia', 'CZ': 'europe-russia',
    'HU': 'europe-russia', 'RO': 'europe-russia', 'BG': 'europe-russia',
    'GR': 'europe-russia', 'PT': 'europe-russia', 'IE': 'europe-russia',
    'SK': 'europe-russia', 'HR': 'europe-russia', 'SI': 'europe-russia',
    'RS': 'europe-russia', 'LT': 'europe-russia', 'LV': 'europe-russia',
    'EE': 'europe-russia', 'MD': 'europe-russia', 'GE': 'europe-russia',
    'AM': 'europe-russia', 'AZ': 'europe-russia',
    // Asia
    'CN': 'asia', 'JP': 'asia', 'KR': 'asia', 'KP': 'asia', 'TW': 'asia',
    'IN': 'asia', 'PK': 'asia', 'BD': 'asia', 'ID': 'asia', 'TH': 'asia',
    'VN': 'asia', 'PH': 'asia', 'MY': 'asia', 'SG': 'asia', 'MM': 'asia',
    'KH': 'asia', 'LA': 'asia', 'NP': 'asia', 'LK': 'asia', 'AF': 'asia',
    'AU': 'asia', 'NZ': 'asia',
  };

  return regionMap[code] || 'all';
}

// =============================================================================
// SEVERITY MAPPING
// =============================================================================

/**
 * Map earthquake magnitude to severity
 */
function magnitudeToSeverity(magnitude: number): SeverityLevel {
  if (magnitude >= 7.0) return 'critical';
  if (magnitude >= 6.0) return 'severe';
  if (magnitude >= 5.0) return 'moderate';
  return 'minor';
}

/**
 * Map travel advisory level to severity
 */
function travelLevelToSeverity(level: 1 | 2 | 3 | 4): SeverityLevel {
  switch (level) {
    case 4: return 'critical';
    case 3: return 'severe';
    case 2: return 'moderate';
    default: return 'minor';
  }
}

// =============================================================================
// DATA FETCHING
// =============================================================================

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (Internal API)',
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchSeismicData(): Promise<SeismicThreat[]> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/seismic?period=day&minMag=4.0`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.earthquakes || []).slice(0, 50).map((eq: any) => ({
      id: `seismic-${eq.id}`,
      type: 'seismic' as const,
      title: `M${eq.magnitude.toFixed(1)} Earthquake`,
      description: eq.place || 'Unknown location',
      severity: magnitudeToSeverity(eq.magnitude),
      coordinates: [eq.coordinates[0], eq.coordinates[1]] as [number, number],
      timestamp: new Date(eq.time),
      source: 'USGS',
      url: eq.url,
      region: getRegionFromCoordinates(eq.coordinates[0], eq.coordinates[1]),
      magnitude: eq.magnitude,
      depth: eq.depth,
      tsunami: eq.tsunami,
    }));
  } catch (error) {
    console.error('Error fetching seismic data:', error);
    return [];
  }
}

async function fetchWeatherData(): Promise<WeatherThreat[]> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/weather`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.events || []).slice(0, 50).map((event: any) => ({
      id: `weather-${event.id}`,
      type: 'weather' as const,
      title: event.name,
      description: event.description || '',
      severity: event.severity as SeverityLevel,
      coordinates: event.coordinates as [number, number],
      timestamp: new Date(event.startTime),
      source: event.source,
      url: event.url,
      region: getRegionFromCoordinates(event.coordinates[0], event.coordinates[1]),
      eventType: event.type,
      affectedAreas: event.affectedAreas,
    }));
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return [];
  }
}

async function fetchFiresData(): Promise<FireThreat[]> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/fires`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.fires || []).slice(0, 50).map((fire: any) => ({
      id: `fire-${fire.id}`,
      type: 'fire' as const,
      title: fire.title,
      description: fire.description || '',
      severity: fire.severity as SeverityLevel,
      coordinates: fire.coordinates as [number, number],
      timestamp: new Date(fire.date),
      source: fire.source,
      url: fire.url,
      region: getRegionFromCoordinates(fire.coordinates[0], fire.coordinates[1]),
      brightness: fire.brightness,
      confidence: fire.confidence,
    }));
  } catch (error) {
    console.error('Error fetching fires data:', error);
    return [];
  }
}

async function fetchTravelData(): Promise<TravelThreat[]> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/travel`);
    if (!response.ok) return [];

    const data = await response.json();
    // Only include level 3 and 4 advisories as threats
    return (data.advisories || [])
      .filter((advisory: any) => advisory.level >= 3)
      .slice(0, 50)
      .map((advisory: any) => ({
        id: `travel-${advisory.id}`,
        type: 'travel' as const,
        title: `${advisory.country}: ${advisory.levelText}`,
        description: advisory.description || '',
        severity: travelLevelToSeverity(advisory.level),
        coordinates: advisory.coordinates as [number, number],
        timestamp: new Date(advisory.updatedAt),
        source: 'US State Department',
        url: advisory.url,
        region: getRegionFromCountryCode(advisory.countryCode),
        country: advisory.country,
        countryCode: advisory.countryCode,
        level: advisory.level,
        levelText: advisory.levelText,
        risks: advisory.risks || [],
      }));
  } catch (error) {
    console.error('Error fetching travel data:', error);
    return [];
  }
}

async function fetchOutagesData(): Promise<OutageThreat[]> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/outages`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.outages || []).slice(0, 50).map((outage: any) => ({
      id: `outage-${outage.id}`,
      type: 'outage' as const,
      title: `Internet Outage: ${outage.country}`,
      description: outage.description || '',
      severity: outage.severity as SeverityLevel,
      coordinates: outage.coordinates as [number, number],
      timestamp: new Date(outage.startTime),
      source: outage.source,
      url: outage.url,
      region: getRegionFromCountryCode(outage.countryCode),
      country: outage.country,
      countryCode: outage.countryCode,
      percentDown: outage.percentDown,
    }));
  } catch (error) {
    console.error('Error fetching outages data:', error);
    return [];
  }
}

async function fetchTFRData(): Promise<TFRThreat[]> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/tfr`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.tfrs || []).slice(0, 50).map((tfr: any) => ({
      id: `tfr-${tfr.notamKey}`,
      type: 'tfr' as const,
      title: `TFR: ${tfr.title}`,
      description: `${tfr.tfrType} — ${tfr.state}`,
      severity: tfr.severity,
      coordinates: tfr.coordinates as [number, number],
      timestamp: new Date(tfr.lastModified),
      source: 'FAA',
      url: tfr.url,
      region: getRegionFromCoordinates(tfr.coordinates[0], tfr.coordinates[1]),
      tfrType: tfr.tfrType,
      state: tfr.state,
      notamKey: tfr.notamKey,
    }));
  } catch (error) {
    console.error('Error fetching TFR data:', error);
    return [];
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

// In-memory cache for 5 minutes
let cachedResponse: ThreatsResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();

  // Return cached response if still valid
  if (cachedResponse && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'HIT',
      },
    });
  }

  // Fetch all data sources in parallel
  const [seismic, weather, fires, travel, outages, tfrs] = await Promise.all([
    fetchSeismicData(),
    fetchWeatherData(),
    fetchFiresData(),
    fetchTravelData(),
    fetchOutagesData(),
    fetchTFRData(),
  ]);

  // Organize threats by type
  const threats: ThreatsByType = {
    seismic,
    weather,
    fires,
    travel,
    outages,
    tfrs,
  };

  // Initialize region structure
  const regions: WatchpointId[] = ['us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa', 'all'];
  const byRegion: Record<WatchpointId, RegionThreats> = {} as Record<WatchpointId, RegionThreats>;

  for (const region of regions) {
    byRegion[region] = {
      seismic: [],
      weather: [],
      fires: [],
      travel: [],
      outages: [],
      tfrs: [],
      totalCount: 0,
      criticalCount: 0,
    };
  }

  // Group threats by region
  const allThreats: Threat[] = [
    ...seismic,
    ...weather,
    ...fires,
    ...travel,
    ...outages,
    ...tfrs,
  ];

  for (const threat of allThreats) {
    const region = threat.region || 'all';

    // Add to specific region
    if (region !== 'all' && byRegion[region]) {
      switch (threat.type) {
        case 'seismic':
          byRegion[region].seismic.push(threat as SeismicThreat);
          break;
        case 'weather':
          byRegion[region].weather.push(threat as WeatherThreat);
          break;
        case 'fire':
          byRegion[region].fires.push(threat as FireThreat);
          break;
        case 'travel':
          byRegion[region].travel.push(threat as TravelThreat);
          break;
        case 'outage':
          byRegion[region].outages.push(threat as OutageThreat);
          break;
        case 'tfr':
          byRegion[region].tfrs.push(threat as TFRThreat);
          break;
      }
      byRegion[region].totalCount++;
      if (threat.severity === 'critical') {
        byRegion[region].criticalCount++;
      }
    }

    // Always add to 'all' region
    switch (threat.type) {
      case 'seismic':
        byRegion['all'].seismic.push(threat as SeismicThreat);
        break;
      case 'weather':
        byRegion['all'].weather.push(threat as WeatherThreat);
        break;
      case 'fire':
        byRegion['all'].fires.push(threat as FireThreat);
        break;
      case 'travel':
        byRegion['all'].travel.push(threat as TravelThreat);
        break;
      case 'outage':
        byRegion['all'].outages.push(threat as OutageThreat);
        break;
      case 'tfr':
        byRegion['all'].tfrs.push(threat as TFRThreat);
        break;
    }
    byRegion['all'].totalCount++;
    if (threat.severity === 'critical') {
      byRegion['all'].criticalCount++;
    }
  }

  // Calculate summary statistics
  const totalThreats = allThreats.length;
  const criticalCount = allThreats.filter(t => t.severity === 'critical').length;
  const severeCount = allThreats.filter(t => t.severity === 'severe').length;

  const response: ThreatsResponse = {
    threats,
    byRegion,
    summary: {
      totalThreats,
      criticalCount,
      severeCount,
      byType: {
        seismic: seismic.length,
        weather: weather.length,
        fires: fires.length,
        travel: travel.length,
        outages: outages.length,
        tfrs: tfrs.length,
      },
      lastUpdated: new Date().toISOString(),
    },
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  cachedResponse = response;
  cacheTimestamp = now;

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Cache': 'MISS',
    },
  });
}

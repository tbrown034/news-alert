/**
 * FAA TEMPORARY FLIGHT RESTRICTIONS (TFRs) API
 * =============================================
 * Fetches active TFRs from FAA GeoServer WFS endpoint.
 * Returns simplified TFR data with centroid coordinates and polygon geometry.
 *
 * Source: https://tfr.faa.gov/geoserver/TFR/ows (WFS GeoJSON)
 * No auth required. US coverage only.
 */

import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// =============================================================================
// TYPES
// =============================================================================

type TFRSeverity = 'critical' | 'severe' | 'moderate' | 'minor';

interface TFR {
  id: string;
  title: string;
  state: string;
  tfrType: string;       // SECURITY, HAZARD, etc.
  notamKey: string;       // e.g. "5/3679"
  facilityId: string;     // e.g. "ZHU"
  coordinates: [number, number]; // Centroid [lon, lat]
  polygon: [number, number][];   // Full polygon vertices [lon, lat][]
  severity: TFRSeverity;
  source: string;
  url: string;
  lastModified: string;   // ISO date
}

interface TFRResponse {
  tfrs: TFR[];
  stats: {
    total: number;
    byType: Record<string, number>;
  };
  fetchedAt: string;
}

// =============================================================================
// FAA GEOSERVER ENDPOINT
// =============================================================================

const FAA_WFS_URL = 'https://tfr.faa.gov/geoserver/TFR/ows?' + new URLSearchParams({
  service: 'WFS',
  version: '1.0.0',
  request: 'GetFeature',
  typeName: 'TFR:V_TFR_LOC',
  outputFormat: 'application/json',
}).toString();

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Map FAA LEGAL field to severity level
 */
function mapSeverity(legal: string): TFRSeverity {
  const normalized = (legal || '').toUpperCase().trim();
  if (normalized === 'SECURITY') return 'severe';
  if (normalized === 'HAZARD' || normalized === 'HAZARDS') return 'moderate';
  if (normalized === 'SPACE OPERATIONS') return 'moderate';
  return 'minor';
}

/**
 * Calculate centroid of a polygon from its coordinate array
 */
function calculateCentroid(coordinates: number[][]): [number, number] {
  if (!coordinates || coordinates.length === 0) return [0, 0];

  let sumLon = 0;
  let sumLat = 0;
  // Skip last point if it duplicates the first (closed polygon)
  const points = coordinates.length > 1 &&
    coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
    coordinates[0][1] === coordinates[coordinates.length - 1][1]
    ? coordinates.slice(0, -1)
    : coordinates;

  for (const [lon, lat] of points) {
    sumLon += lon;
    sumLat += lat;
  }

  return [sumLon / points.length, sumLat / points.length];
}

/**
 * Parse FAA datetime string (YYYYMMDDHHmm) to ISO string
 */
function parseFAADate(dateStr: string): string {
  if (!dateStr || dateStr.length < 12) return new Date().toISOString();
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  const hour = dateStr.slice(8, 10);
  const min = dateStr.slice(10, 12);
  return new Date(`${year}-${month}-${day}T${hour}:${min}:00Z`).toISOString();
}

/**
 * Build TFR detail URL from NOTAM key
 */
function buildTFRUrl(notamKey: string): string {
  const slug = notamKey.replace(/\//g, '_').replace(/-.*$/, '');
  return `https://tfr.faa.gov/tfr3/?page=detail_${slug}`;
}

// =============================================================================
// CACHE
// =============================================================================

let cachedResponse: TFRResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`tfr:${clientIp}`, { maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const now = Date.now();

  // Return cached response if still valid
  if (cachedResponse && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'X-Cache': 'HIT',
      },
    });
  }

  const tfrs: TFR[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(FAA_WFS_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`FAA GeoServer error: ${response.status}`);
    } else {
      const data = await response.json();

      for (const feature of data.features || []) {
        const props = feature.properties || {};
        const geom = feature.geometry || {};
        const fullKey = props.NOTAM_KEY || feature.id?.replace('V_TFR_LOC.', '') || '';
        const notamKey = fullKey.split('-')[0]; // e.g. "5/3679" from "5/3679-1-FDC-F"

        // Extract polygon coordinates (first ring of polygon)
        let polyCoords: number[][] = [];
        if (geom.type === 'Polygon' && geom.coordinates?.[0]) {
          polyCoords = geom.coordinates[0];
        } else if (geom.type === 'MultiPolygon' && geom.coordinates?.[0]?.[0]) {
          polyCoords = geom.coordinates[0][0];
        }

        const centroid = calculateCentroid(polyCoords);
        const polygon: [number, number][] = polyCoords.map(([lon, lat]) => [lon, lat]);

        tfrs.push({
          id: `tfr-${props.GID || fullKey}`,
          title: props.TITLE || 'Unknown TFR',
          state: props.STATE || '',
          tfrType: props.LEGAL || 'UNKNOWN',
          notamKey,
          facilityId: props.CNS_LOCATION_ID || '',
          coordinates: centroid,
          polygon,
          severity: mapSeverity(props.LEGAL),
          source: 'FAA',
          url: buildTFRUrl(notamKey),
          lastModified: parseFAADate(props.LAST_MODIFICATION_DATETIME),
        });
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('FAA GeoServer request timed out');
    } else {
      console.error('FAA GeoServer error:', error);
    }
  }

  // Sort by severity then state
  const severityOrder: Record<string, number> = { critical: 0, severe: 1, moderate: 2, minor: 3 };
  tfrs.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
    return sevDiff !== 0 ? sevDiff : a.state.localeCompare(b.state);
  });

  // Count by type
  const byType: Record<string, number> = {};
  for (const tfr of tfrs) {
    byType[tfr.tfrType] = (byType[tfr.tfrType] || 0) + 1;
  }

  const result: TFRResponse = {
    tfrs,
    stats: {
      total: tfrs.length,
      byType,
    },
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  cachedResponse = result;
  cacheTimestamp = now;

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      'X-Cache': 'MISS',
    },
  });
}

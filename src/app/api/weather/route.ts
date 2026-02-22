/**
 * WEATHER ALERTS API
 * ==================
 * Fetches severe weather data from NOAA and other sources
 */

import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export const dynamic = 'force-dynamic';

// XML parser instance with namespace handling
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true, // Handle gdacs: and geo: prefixes
});

interface WeatherEvent {
  id: string;
  type: 'hurricane' | 'typhoon' | 'storm' | 'wildfire' | 'flood' | 'tornado' | 'extreme_temp';
  name: string;
  description: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  coordinates: [number, number]; // [lon, lat]
  startTime: Date;
  endTime?: Date;
  source: string;
  url?: string;
  windSpeed?: number; // mph for hurricanes
  category?: number; // hurricane category
  affectedAreas?: string[];
}

// NOAA NWS Active Alerts API
const NWS_ALERTS_API = 'https://api.weather.gov/alerts/active';

// EONET (NASA Earth Observatory Natural Events) for global events
const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';

// GDACS (Global Disaster Alert and Coordination System) for international coverage
const GDACS_RSS = 'https://www.gdacs.org/xml/rss.xml';

// Map NWS event types to our categories
function mapNWSEventType(event: string): WeatherEvent['type'] | null {
  const lower = event.toLowerCase();
  if (lower.includes('hurricane') || lower.includes('tropical')) return 'hurricane';
  if (lower.includes('typhoon')) return 'typhoon';
  if (lower.includes('tornado')) return 'tornado';
  if (lower.includes('flood')) return 'flood';
  if (lower.includes('fire') || lower.includes('red flag')) return 'wildfire';
  if (lower.includes('storm') || lower.includes('thunder') || lower.includes('wind')) return 'storm';
  if (lower.includes('heat') || lower.includes('cold') || lower.includes('freeze') || lower.includes('winter')) return 'extreme_temp';
  return null;
}

// Map NWS severity
function mapNWSSeverity(severity: string): WeatherEvent['severity'] {
  switch (severity?.toLowerCase()) {
    case 'extreme': return 'extreme';
    case 'severe': return 'severe';
    case 'moderate': return 'moderate';
    default: return 'minor';
  }
}

// Map EONET category to our type
function mapEONETCategory(categoryId: string): WeatherEvent['type'] | null {
  switch (categoryId) {
    case 'wildfires': return 'wildfire';
    case 'severeStorms': return 'storm';
    case 'floods': return 'flood';
    case 'volcanoes': return null; // Skip volcanoes for now
    default: return null;
  }
}

// Map GDACS event type
function mapGDACSEventType(eventType: string): WeatherEvent['type'] | null {
  switch (eventType?.toUpperCase()) {
    case 'TC': return 'hurricane'; // Tropical cyclone
    case 'FL': return 'flood';
    case 'WF': return 'wildfire';
    case 'DR': return 'extreme_temp'; // Drought
    default: return null; // Skip EQ (earthquakes) - we have seismic tab
  }
}

// Map GDACS alert level to severity
function mapGDACSAlertLevel(level: string): WeatherEvent['severity'] {
  switch (level?.toLowerCase()) {
    case 'red': return 'extreme';
    case 'orange': return 'severe';
    case 'green': return 'moderate';
    default: return 'minor';
  }
}

// US state/territory centroids for geocoding NWS alerts from UGC codes
// UGC format: 2-letter state + Z/C + 3-digit zone/county number
const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [-86.9, 32.8], AK: [-153.5, 64.2], AZ: [-111.1, 34.0], AR: [-92.4, 34.8],
  CA: [-119.4, 36.8], CO: [-105.8, 39.0], CT: [-72.8, 41.6], DE: [-75.5, 39.0],
  FL: [-81.5, 27.7], GA: [-83.5, 32.2], HI: [-155.5, 19.9], ID: [-114.7, 44.1],
  IL: [-89.4, 40.6], IN: [-86.1, 40.3], IA: [-93.1, 41.9], KS: [-98.5, 38.5],
  KY: [-84.3, 37.7], LA: [-91.9, 30.5], ME: [-69.4, 45.3], MD: [-76.6, 39.0],
  MA: [-71.4, 42.4], MI: [-84.5, 44.3], MN: [-94.7, 46.7], MS: [-89.4, 32.7],
  MO: [-91.8, 38.6], MT: [-110.4, 46.9], NE: [-99.9, 41.5], NV: [-116.4, 38.8],
  NH: [-71.6, 43.2], NJ: [-74.4, 40.1], NM: [-105.9, 34.5], NY: [-75.5, 43.0],
  NC: [-79.0, 35.8], ND: [-101.0, 47.5], OH: [-82.9, 40.4], OK: [-97.1, 35.0],
  OR: [-120.6, 43.8], PA: [-77.2, 41.2], RI: [-71.5, 41.6], SC: [-81.2, 34.0],
  SD: [-99.9, 43.9], TN: [-86.6, 35.5], TX: [-99.9, 31.0], UT: [-111.1, 39.3],
  VT: [-72.6, 44.0], VA: [-78.2, 37.8], WA: [-120.7, 47.8], WV: [-80.5, 38.6],
  WI: [-89.6, 43.8], WY: [-107.3, 43.1], DC: [-77.0, 38.9],
  // Territories
  PR: [-66.6, 18.2], VI: [-64.9, 17.7], GU: [144.8, 13.4], AS: [-170.7, -14.3],
  MP: [145.8, 15.2],
  // Marine zones (PK = Alaska marine, PH = Hawaii marine, etc.)
  PK: [-153.5, 57.0], PH: [-155.5, 19.9], PM: [-170.7, -14.3],
  AM: [-65.0, 30.0], AN: [-75.0, 35.0], GM: [-90.0, 27.0], // Atlantic/Gulf marine
  LC: [-81.0, 26.0], LE: [-82.0, 42.0], LH: [-85.0, 45.0], LM: [-87.0, 43.0],
  LO: [-79.0, 43.5], LS: [-90.0, 47.0], SL: [-75.0, 44.0], // Great Lakes
  PZ: [-135.0, 45.0], // Pacific marine
};

// Resolve coordinates from UGC zone codes
function resolveNWSCoordinates(ugcCodes: string[]): [number, number] | null {
  if (!ugcCodes || ugcCodes.length === 0) return null;

  const coords: [number, number][] = [];
  for (const ugc of ugcCodes) {
    const stateCode = ugc.substring(0, 2);
    const centroid = STATE_CENTROIDS[stateCode];
    if (centroid) {
      coords.push(centroid);
    }
  }

  if (coords.length === 0) return null;

  // Average all zone centroids for a rough center of the affected area
  const avgLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
  const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  return [avgLon, avgLat];
}

// In-memory cache (weather data updates hourly at most)
let cachedResponse: { events: WeatherEvent[]; stats: object; fetchedAt: string } | null = null;
let cacheTimestamp = 0;
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

  const events: WeatherEvent[] = [];

  // Fetch from NWS (US alerts)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const nwsResponse = await fetch(`${NWS_ALERTS_API}?status=actual&message_type=alert`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
        'Accept': 'application/geo+json',
      },
    });

    clearTimeout(timeoutId);

    if (nwsResponse.ok) {
      const nwsData = await nwsResponse.json();

      // Process NWS alerts - limit to significant ones
      const significantAlerts = (nwsData.features || [])
        .filter((f: any) => {
          const eventType = mapNWSEventType(f.properties?.event || '');
          const severity = f.properties?.severity;
          // Only include severe/extreme events of types we care about
          return eventType && (severity === 'Extreme' || severity === 'Severe');
        })
        .slice(0, 30); // Limit to 30 most recent

      for (const feature of significantAlerts) {
        const props = feature.properties;
        const eventType = mapNWSEventType(props.event);

        if (!eventType) continue;

        // Get coordinates: prefer geometry polygon, fall back to UGC zone centroids
        let coordinates: [number, number] | null = null;

        if (feature.geometry?.coordinates) {
          const coords = feature.geometry.coordinates;
          if (Array.isArray(coords) && coords.length > 0) {
            if (feature.geometry.type === 'Polygon' && coords[0]?.length > 0) {
              const ring = coords[0];
              const avgLon = ring.reduce((sum: number, c: any) => sum + c[0], 0) / ring.length;
              const avgLat = ring.reduce((sum: number, c: any) => sum + c[1], 0) / ring.length;
              coordinates = [avgLon, avgLat];
            } else if (feature.geometry.type === 'Point') {
              coordinates = coords as [number, number];
            }
          }
        }

        // Fall back to UGC zone code geocoding
        if (!coordinates) {
          const ugcCodes = props.geocode?.UGC || [];
          coordinates = resolveNWSCoordinates(ugcCodes);
        }

        // Skip events we can't locate
        if (!coordinates) continue;

        events.push({
          id: props.id || `nws-${Date.now()}-${Math.random()}`,
          type: eventType,
          name: props.event,
          description: props.headline || props.description?.substring(0, 200) || '',
          severity: mapNWSSeverity(props.severity),
          coordinates,
          startTime: new Date(props.onset || props.effective),
          endTime: props.expires ? new Date(props.expires) : undefined,
          source: 'NWS',
          url: props['@id'],
          affectedAreas: props.areaDesc?.split(';').map((a: string) => a.trim()),
        });
      }
    }
  } catch (error) {
    console.error('NWS API error:', error);
  }

  // Fetch from EONET (global natural events)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const eonetResponse = await fetch(`${EONET_API}?status=open&limit=50`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
      },
    });

    clearTimeout(timeoutId);

    if (eonetResponse.ok) {
      const eonetData = await eonetResponse.json();

      for (const event of eonetData.events || []) {
        const category = event.categories?.[0];
        const eventType = mapEONETCategory(category?.id);

        if (!eventType) continue;

        // Get most recent geometry
        const geometry = event.geometry?.[event.geometry.length - 1];
        if (!geometry?.coordinates) continue;

        events.push({
          id: event.id,
          type: eventType,
          name: event.title,
          description: `Active ${category?.title || eventType} event`,
          severity: 'severe', // EONET events are generally significant
          coordinates: geometry.coordinates as [number, number],
          startTime: new Date(geometry.date),
          source: 'NASA EONET',
          url: event.link,
        });
      }
    }
  } catch (error) {
    console.error('EONET API error:', error);
  }

  // Fetch from GDACS (Global Disaster Alerts) for international coverage
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const gdacsResponse = await fetch(GDACS_RSS, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
      },
    });

    clearTimeout(timeoutId);

    if (gdacsResponse.ok) {
      const rssText = await gdacsResponse.text();

      // Parse RSS using fast-xml-parser
      const parsed = xmlParser.parse(rssText);
      const items = parsed?.rss?.channel?.item || [];
      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray.slice(0, 30)) {
        const title = item.title;
        const link = item.link;
        const eventTypeVal = item.eventtype;
        const alertLevel = item.alertlevel;
        const lat = item.lat;
        const lon = item.long;
        const pubDate = item.pubDate;
        const country = item.country;

        if (!title || !eventTypeVal || lat === undefined || lon === undefined) continue;

        const eventType = mapGDACSEventType(String(eventTypeVal));
        if (!eventType) continue;

        const latNum = parseFloat(String(lat));
        const lonNum = parseFloat(String(lon));
        if (isNaN(latNum) || isNaN(lonNum)) continue;

        events.push({
          id: `gdacs-${eventTypeVal}-${latNum}-${lonNum}`,
          type: eventType,
          name: String(title).substring(0, 100),
          description: country ? `${eventType} event in ${country}` : String(title).substring(0, 150),
          severity: mapGDACSAlertLevel(alertLevel ? String(alertLevel) : 'green'),
          coordinates: [lonNum, latNum],
          startTime: pubDate ? new Date(String(pubDate)) : new Date(),
          source: 'GDACS',
          url: link ? String(link) : undefined,
          affectedAreas: country ? [String(country)] : undefined,
        });
      }
    }
  } catch (error) {
    console.error('GDACS API error:', error);
  }

  // Sort by severity then time
  const severityOrder: Record<string, number> = { extreme: 0, severe: 1, moderate: 2, minor: 3 };
  events.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  // Deduplicate: keep one event per state+type combo (most severe wins)
  const seen = new Map<string, WeatherEvent>();
  for (const event of events) {
    // Round coordinates to ~state level for grouping
    const key = `${Math.round(event.coordinates[0])}:${Math.round(event.coordinates[1])}:${event.type}`;
    if (!seen.has(key)) {
      seen.set(key, event);
    }
    // Already sorted by severity, so first one per key is the most severe
  }
  const deduped = Array.from(seen.values());

  const stats = {
    total: events.length,
    displayed: deduped.length,
    byType: {
      hurricane: events.filter(e => e.type === 'hurricane' || e.type === 'typhoon').length,
      storm: events.filter(e => e.type === 'storm' || e.type === 'tornado').length,
      wildfire: events.filter(e => e.type === 'wildfire').length,
      flood: events.filter(e => e.type === 'flood').length,
      extreme_temp: events.filter(e => e.type === 'extreme_temp').length,
    },
    extreme: events.filter(e => e.severity === 'extreme').length,
    severe: events.filter(e => e.severity === 'severe').length,
  };

  const response = {
    events: deduped,
    stats,
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  cachedResponse = response;
  cacheTimestamp = Date.now();

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Cache': 'MISS',
    },
  });
}

/**
 * SEISMIC ACTIVITY API
 * ====================
 * Fetches earthquake data from USGS API
 */

import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { Earthquake } from '@/types';

// USGS GeoJSON feed endpoints
const USGS_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`seismic:${clientIp}`, { maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);

  // Time period: hour, day, week, month
  const period = searchParams.get('period') || 'day';
  const validPeriods = ['hour', 'day', 'week', 'month'];
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }

  // Minimum magnitude filter
  const minMagParam = searchParams.get('minMag') || '2.5';
  const minMagnitude = Math.max(0, Math.min(10, parseFloat(minMagParam) || 2.5));

  // Select appropriate USGS feed based on magnitude
  // USGS provides: significant, 4.5+, 2.5+, 1.0+, all
  let feed: string;
  if (minMagnitude >= 4.5) {
    feed = '4.5';
  } else if (minMagnitude >= 2.5) {
    feed = '2.5';
  } else if (minMagnitude >= 1.0) {
    feed = '1.0';
  } else {
    feed = 'all';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${USGS_API}/${feed}_${period}.geojson`, {
      signal: controller.signal,
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`USGS API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch earthquake data' },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Transform USGS GeoJSON to our Earthquake type
    const earthquakes: Earthquake[] = data.features
      .filter((f: any) => f.properties.mag >= minMagnitude)
      .slice(0, 100) // Limit to 100 earthquakes
      .map((f: any) => ({
        id: f.id,
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: new Date(f.properties.time),
        coordinates: f.geometry.coordinates as [number, number, number],
        url: f.properties.url,
        tsunami: f.properties.tsunami === 1,
        felt: f.properties.felt,
        alert: f.properties.alert,
        significance: f.properties.sig,
        depth: f.geometry.coordinates[2],
      }));

    // Sort by time (most recent first)
    earthquakes.sort((a, b) => b.time.getTime() - a.time.getTime());

    // Calculate summary stats
    const stats = {
      total: earthquakes.length,
      significant: earthquakes.filter(eq => eq.significance >= 600).length,
      withTsunami: earthquakes.filter(eq => eq.tsunami).length,
      maxMagnitude: earthquakes.length > 0 ? Math.max(...earthquakes.map(eq => eq.magnitude)) : 0,
      alertCounts: {
        red: earthquakes.filter(eq => eq.alert === 'red').length,
        orange: earthquakes.filter(eq => eq.alert === 'orange').length,
        yellow: earthquakes.filter(eq => eq.alert === 'yellow').length,
        green: earthquakes.filter(eq => eq.alert === 'green').length,
      },
    };

    return NextResponse.json({
      earthquakes,
      stats,
      period,
      minMagnitude,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('USGS API timeout');
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    console.error('Seismic API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earthquake data' },
      { status: 500 }
    );
  }
}

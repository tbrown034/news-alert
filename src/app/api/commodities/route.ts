/**
 * COMMODITY & MARKET PRICES API
 * ==============================
 * Fetches key commodity/index prices from Yahoo Finance with 30-day sparkline data.
 * Daily % change is the primary signal — spikes indicate geopolitical stress.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cache — 10 min TTL
let cachedResponse: CommoditiesResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000;

interface SparklinePoint {
  date: string;
  price: number;
}

interface Commodity {
  id: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  unit: string;
  source: string;
  sparkline: SparklinePoint[];
}

interface CommoditiesResponse {
  commodities: Commodity[];
  fetchedAt: string;
}

const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const SYMBOLS: readonly { symbol: string; id: string; name: string; unit: string }[] = [
  { symbol: 'CL=F', id: 'wti-oil', name: 'WTI Crude', unit: 'USD/bbl' },
  { symbol: 'BZ=F', id: 'brent-oil', name: 'Brent Crude', unit: 'USD/bbl' },
  { symbol: 'GC=F', id: 'gold', name: 'Gold', unit: 'USD/oz' },
  { symbol: 'NG=F', id: 'nat-gas', name: 'Natural Gas', unit: 'USD/MMBtu' },
  { symbol: 'DX-Y.NYB', id: 'usd-index', name: 'USD Index', unit: 'Index' },
  { symbol: 'BTC-USD', id: 'bitcoin', name: 'Bitcoin', unit: 'USD' },
  { symbol: '^DJI', id: 'dow', name: 'Dow Jones', unit: 'Index' },
  { symbol: '^GSPC', id: 'sp500', name: 'S&P 500', unit: 'Index' },
];

async function fetchCommodity(
  symbol: typeof SYMBOLS[number]
): Promise<Commodity | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Fetch 30 days of daily data for sparkline
    const url = `${YAHOO_FINANCE_BASE}/${symbol.symbol}?interval=1d&range=1mo`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Yahoo Finance error for ${symbol.symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose;

    if (price == null || previousClose == null) return null;

    const change = price - previousClose;
    const changePercent = previousClose !== 0
      ? (change / previousClose) * 100
      : 0;

    // Build sparkline from historical close prices
    const sparkline: SparklinePoint[] = [];
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    for (let i = 0; i < timestamps.length; i++) {
      const closePrice = closes[i];
      if (closePrice == null) continue;
      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
      sparkline.push({
        date,
        price: Math.round(closePrice * 100) / 100,
      });
    }

    return {
      id: symbol.id,
      name: symbol.name,
      price: Math.round(price * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      unit: symbol.unit,
      source: 'Yahoo Finance',
      sparkline,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Yahoo Finance timeout for ${symbol.symbol}`);
    } else {
      console.error(`Yahoo Finance error for ${symbol.symbol}:`, error);
    }
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached response if still valid
  if (cachedResponse && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'X-Cache': 'HIT',
      },
    });
  }

  // Fetch all in parallel
  const results = await Promise.allSettled(
    SYMBOLS.map((symbol) => fetchCommodity(symbol))
  );

  const commodities: Commodity[] = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((c): c is Commodity => c !== null);

  const response: CommoditiesResponse = {
    commodities,
    fetchedAt: new Date().toISOString(),
  };

  cachedResponse = response;
  cacheTimestamp = Date.now();

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'X-Cache': 'MISS',
    },
  });
}

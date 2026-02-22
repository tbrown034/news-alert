/**
 * INTERNET OUTAGES API
 * ====================
 * Monitors internet connectivity disruptions by country
 * Uses multiple sources: NetBlocks, news RSS, and known outages
 */

import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export const dynamic = 'force-dynamic';

// XML parser instance
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

interface CountryOutage {
  id: string;
  country: string;
  countryCode: string;
  capital: string;
  coordinates: [number, number]; // Capital [lon, lat]
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  percentDown: number;
  startTime: Date;
  description: string;
  source: string;
  url?: string;
}

// Capital city coordinates for key countries
const CAPITAL_COORDS: Record<string, { capital: string; coords: [number, number]; country: string }> = {
  'IR': { capital: 'Tehran', coords: [51.39, 35.69], country: 'Iran' },
  'RU': { capital: 'Moscow', coords: [37.62, 55.75], country: 'Russia' },
  'UA': { capital: 'Kyiv', coords: [30.52, 50.45], country: 'Ukraine' },
  'CN': { capital: 'Beijing', coords: [116.40, 39.90], country: 'China' },
  'KP': { capital: 'Pyongyang', coords: [125.75, 39.03], country: 'North Korea' },
  'SY': { capital: 'Damascus', coords: [36.29, 33.51], country: 'Syria' },
  'VE': { capital: 'Caracas', coords: [-66.90, 10.49], country: 'Venezuela' },
  'CU': { capital: 'Havana', coords: [-82.37, 23.11], country: 'Cuba' },
  'MM': { capital: 'Naypyidaw', coords: [96.13, 19.75], country: 'Myanmar' },
  'BY': { capital: 'Minsk', coords: [27.57, 53.90], country: 'Belarus' },
  'PK': { capital: 'Islamabad', coords: [73.04, 33.69], country: 'Pakistan' },
  'AF': { capital: 'Kabul', coords: [69.17, 34.53], country: 'Afghanistan' },
  'IQ': { capital: 'Baghdad', coords: [44.37, 33.31], country: 'Iraq' },
  'YE': { capital: 'Sanaa', coords: [44.21, 15.35], country: 'Yemen' },
  'SD': { capital: 'Khartoum', coords: [32.53, 15.50], country: 'Sudan' },
  'ET': { capital: 'Addis Ababa', coords: [38.75, 9.03], country: 'Ethiopia' },
  'EG': { capital: 'Cairo', coords: [31.24, 30.04], country: 'Egypt' },
  'TR': { capital: 'Ankara', coords: [32.86, 39.93], country: 'Turkey' },
  'IL': { capital: 'Jerusalem', coords: [35.22, 31.77], country: 'Israel' },
  'SA': { capital: 'Riyadh', coords: [46.72, 24.69], country: 'Saudi Arabia' },
  'LB': { capital: 'Beirut', coords: [35.50, 33.89], country: 'Lebanon' },
  'JO': { capital: 'Amman', coords: [35.93, 31.95], country: 'Jordan' },
  'PS': { capital: 'Ramallah', coords: [35.20, 31.90], country: 'Palestine' },
  'TW': { capital: 'Taipei', coords: [121.56, 25.03], country: 'Taiwan' },
  'IN': { capital: 'New Delhi', coords: [77.21, 28.61], country: 'India' },
  'BD': { capital: 'Dhaka', coords: [90.41, 23.81], country: 'Bangladesh' },
  'NG': { capital: 'Abuja', coords: [7.49, 9.06], country: 'Nigeria' },
  'ZA': { capital: 'Pretoria', coords: [28.19, -25.75], country: 'South Africa' },
  'BR': { capital: 'Brasília', coords: [-47.93, -15.78], country: 'Brazil' },
  'MX': { capital: 'Mexico City', coords: [-99.13, 19.43], country: 'Mexico' },
  'AR': { capital: 'Buenos Aires', coords: [-58.38, -34.60], country: 'Argentina' },
  'GA': { capital: 'Libreville', coords: [9.45, 0.39], country: 'Gabon' },
};

// Known ongoing outages (manually maintained for accuracy)
// Updated based on credible reports from NetBlocks, OONI, news
const KNOWN_OUTAGES: Omit<CountryOutage, 'id'>[] = [];

// Outage-related keywords
const OUTAGE_KEYWORDS = [
  'internet shutdown', 'internet blackout', 'internet cut',
  'connectivity disruption', 'network outage', 'power outage',
  'communications blackout', 'internet blocked', 'social media blocked',
];

// Country name to code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'iran': 'IR', 'russia': 'RU', 'ukraine': 'UA', 'china': 'CN',
  'north korea': 'KP', 'syria': 'SY', 'latam': 'VE', 'cuba': 'CU',
  'myanmar': 'MM', 'burma': 'MM', 'belarus': 'BY', 'pakistan': 'PK',
  'afghanistan': 'AF', 'iraq': 'IQ', 'yemen': 'YE', 'sudan': 'SD',
  'ethiopia': 'ET', 'egypt': 'EG', 'turkey': 'TR', 'israel': 'IL',
  'saudi arabia': 'SA', 'lebanon': 'LB', 'jordan': 'JO', 'palestine': 'PS',
  'gaza': 'PS', 'taiwan': 'TW', 'india': 'IN', 'bangladesh': 'BD',
  'nigeria': 'NG', 'south africa': 'ZA', 'brazil': 'BR', 'mexico': 'MX',
  'argentina': 'AR', 'gabon': 'GA',
};

function detectCountryInText(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (lowerText.includes(name)) {
      return code;
    }
  }
  return null;
}

function hasOutageKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return OUTAGE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// In-memory cache (outage data from flaky Nitter instances — cache to avoid repeated timeouts)
let cachedResponse: { outages: CountryOutage[]; stats: object; fetchedAt: string } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  const nowMs = Date.now();

  // Return cached response if still valid
  if (cachedResponse && (nowMs - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'X-Cache': 'HIT',
      },
    });
  }

  const outages: CountryOutage[] = [];
  const now = new Date();

  // Add known ongoing outages
  for (const known of KNOWN_OUTAGES) {
    // Only include if started within last 14 days
    const daysSinceStart = (now.getTime() - known.startTime.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceStart <= 14) {
      outages.push({
        ...known,
        id: `known-${known.countryCode}-${known.startTime.getTime()}`,
      });
    }
  }

  // Try to fetch from NetBlocks Twitter/X feed via RSS bridge (if available)
  const nitterInstances = [
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
  ];

  for (const instance of nitterInstances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${instance}/netblocks/rss`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PulseAlert/1.0 (OSINT Dashboard)' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        // Parse RSS using fast-xml-parser
        const parsed = xmlParser.parse(text);
        const items = parsed?.rss?.channel?.item || [];
        const itemArray = Array.isArray(items) ? items : [items];

        for (const item of itemArray.slice(0, 10)) {
          const title = item.title;
          const desc = item.description;
          const pubDateStr = item.pubDate;

          if (title && desc) {
            const fullText = `${title} ${desc}`;
            const countryCode = detectCountryInText(fullText);

            if (countryCode && hasOutageKeywords(fullText) && CAPITAL_COORDS[countryCode]) {
              const info = CAPITAL_COORDS[countryCode];
              const pubDate = pubDateStr ? new Date(String(pubDateStr)) : now;

              // Only include if within last 7 days
              const daysAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
              if (daysAgo <= 7) {
                outages.push({
                  id: `netblocks-${countryCode}-${pubDate.getTime()}`,
                  country: info.country,
                  countryCode,
                  capital: info.capital,
                  coordinates: info.coords,
                  severity: 'severe',
                  percentDown: 60,
                  startTime: pubDate,
                  description: String(title).substring(0, 200),
                  source: 'NetBlocks',
                  url: 'https://netblocks.org',
                });
              }
            }
          }
        }
        break; // Successfully got data, don't try other instances
      }
    } catch {
      // Try next instance
    }
  }

  // Deduplicate by country (keep most severe)
  const uniqueOutages = Object.values(
    outages.reduce((acc, outage) => {
      const existing = acc[outage.countryCode];
      if (!existing || outage.percentDown > existing.percentDown) {
        acc[outage.countryCode] = outage;
      }
      return acc;
    }, {} as Record<string, CountryOutage>)
  );

  // Sort by severity
  const severityOrder = { critical: 0, severe: 1, moderate: 2, minor: 3 };
  uniqueOutages.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Stats
  const stats = {
    total: uniqueOutages.length,
    critical: uniqueOutages.filter(o => o.severity === 'critical').length,
    severe: uniqueOutages.filter(o => o.severity === 'severe').length,
    moderate: uniqueOutages.filter(o => o.severity === 'moderate').length,
  };

  const response = {
    outages: uniqueOutages,
    stats,
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  cachedResponse = response;
  cacheTimestamp = Date.now();

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'X-Cache': 'MISS',
    },
  });
}

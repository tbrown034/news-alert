/**
 * WIKIPEDIA PAGEVIEWS API
 * =======================
 * Fetches top Wikipedia pageviews and filters for geopolitically relevant articles.
 * Uses the Wikimedia Pageviews API (free, no key needed).
 */

import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// In-memory cache — 30min TTL since this is daily data
let cachedResponse: WikipediaViewsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000;

interface WikipediaPage {
  title: string;
  views: number;
  url: string;
  region: string;
}

interface WikipediaViewsResponse {
  pages: WikipediaPage[];
  date: string;
  fetchedAt: string;
}

// Geopolitical keyword mapping per region
const GEOPOLITICAL_TERMS: Record<string, { region: string; keywords: string[] }> = {
  us: {
    region: 'us',
    keywords: [
      'United States', 'Donald Trump', 'Joe Biden', 'Pentagon', 'CIA', 'FBI',
      'NATO', 'US Congress', 'White House', 'American', 'United_States',
      'Secret Service', 'National Guard', 'Department of Defense',
      'Department of State', 'FEMA', 'Capitol', 'Senate', 'House of Representatives',
      'Supreme Court of the United States', 'Kamala Harris', 'Mike Pence',
      'JD Vance', 'MAGA', 'Republican Party', 'Democratic Party',
    ],
  },
  'middle-east': {
    region: 'middle-east',
    keywords: [
      'Iran', 'Iraq', 'Israel', 'Palestine', 'Gaza', 'Hamas', 'Hezbollah',
      'Syria', 'Saudi Arabia', 'Yemen', 'Houthi', 'Lebanon', 'Tehran',
      'Jerusalem', 'West Bank', 'Strait of Hormuz', 'IRGC', 'Islamic Jihad',
      'Mossad', 'Netanyahu', 'Khamenei', 'Kurdistan', 'Baghdad',
      'Bashar al-Assad', 'Al-Qaeda', 'Islamic State',
    ],
  },
  'europe-russia': {
    region: 'europe-russia',
    keywords: [
      'Russia', 'Ukraine', 'Putin', 'Zelensky', 'European Union', 'Kremlin',
      'Moscow', 'Kyiv', 'Belarus', 'Wagner', 'Crimea', 'Donbas',
      'Volodymyr Zelenskyy', 'Vladimir Putin', 'FSB', 'GRU',
      'European Commission', 'European Parliament', 'Brexit',
      'Emmanuel Macron', 'Olaf Scholz', 'Recep Tayyip', 'Erdogan',
      'Minsk', 'Kaliningrad', 'Donetsk', 'Luhansk', 'Bakhmut',
    ],
  },
  asia: {
    region: 'asia',
    keywords: [
      'China', 'Taiwan', 'North Korea', 'Kim Jong', 'Japan', 'India',
      'Pakistan', 'Afghanistan', 'South China Sea', 'Xi Jinping', 'ASEAN',
      'Myanmar', 'People\'s Liberation Army', 'Xinjiang', 'Tibet',
      'Hong Kong', 'Narendra Modi', 'Duterte', 'Korean Peninsula',
      'Pyongyang', 'Taliban', 'Kabul',
    ],
  },
  latam: {
    region: 'latam',
    keywords: [
      'Venezuela', 'Brazil', 'Mexico', 'Colombia', 'Cuba', 'Maduro',
      'Lula', 'Cartel', 'Nicaragua', 'Argentina', 'Milei', 'El Salvador',
      'Bukele', 'FARC', 'Guantanamo',
    ],
  },
  africa: {
    region: 'africa',
    keywords: [
      'Sudan', 'Ethiopia', 'Somalia', 'Libya', 'Nigeria', 'Congo',
      'Sahel', 'Boko Haram', 'Al-Shabaab', 'Tigray', 'Darfur',
      'South Sudan', 'Wagner Group', 'Mozambique', 'Mali',
    ],
  },
};

// Patterns that indicate non-geopolitical content — skip these articles
const SKIP_PATTERNS = [
  /\(film\)/i,
  /\(TV series\)/i,
  /\(song\)/i,
  /\(album\)/i,
  /\(band\)/i,
  /\(footballer\)/i,
  /\(actor\)/i,
  /\(actress\)/i,
  /\(singer\)/i,
  /\(rapper\)/i,
  /\(musician\)/i,
  /\(comics?\)/i,
  /\(video game\)/i,
  /\(game\)/i,
  /\(novel\)/i,
  /\(book\)/i,
  /Season \d/i,
  /Episode \d/i,
  /^List of /i,
  /^Deaths in /i,
  /^Main_Page$/,
  /^Special:/,
  /^Wikipedia:/,
  /^Portal:/,
  /^File:/,
  /^Help:/,
  /^Category:/,
  /^Template:/,
  /^Talk:/,
];

function shouldSkipArticle(title: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(title));
}

function classifyArticle(title: string): string | null {
  const displayTitle = title.replace(/_/g, ' ');

  for (const [, { region, keywords }] of Object.entries(GEOPOLITICAL_TERMS)) {
    for (const keyword of keywords) {
      // Case-insensitive check: article title contains the keyword
      if (displayTitle.toLowerCase().includes(keyword.toLowerCase())) {
        return region;
      }
    }
  }

  return null;
}

function formatDate(date: Date): { year: string; month: string; day: string } {
  return {
    year: date.getFullYear().toString(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

async function fetchTopPages(date: Date): Promise<any | null> {
  const { year, month, day } = formatDate(date);
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseNews/1.0 (news monitoring dashboard; contact@example.com)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Wikipedia API error: ${response.status} for date ${year}/${month}/${day}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Wikipedia API timeout');
    } else {
      console.error('Wikipedia API error:', error);
    }
    return null;
  }
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`wikipedia-views:${clientIp}`, { maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const now = Date.now();

  // Return cached response if still valid
  if (cachedResponse && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  // Try yesterday first, then day before if not available
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let data = await fetchTopPages(yesterday);
  let usedDate = yesterday;

  if (!data) {
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    data = await fetchTopPages(dayBefore);
    usedDate = dayBefore;
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Failed to fetch Wikipedia pageview data' },
      { status: 502 }
    );
  }

  // Extract articles from the response
  const articles: Array<{ title: string; views: number }> = [];
  const items = data?.items?.[0]?.articles || [];

  for (const item of items) {
    const title = item.article;
    const views = item.views;

    if (!title || !views) continue;
    if (shouldSkipArticle(title)) continue;

    articles.push({ title, views });
  }

  // Classify and collect per-region, top 5 each
  const regionBuckets: Record<string, WikipediaPage[]> = {};

  for (const article of articles) {
    const region = classifyArticle(article.title);
    if (!region) continue;

    if (!regionBuckets[region]) {
      regionBuckets[region] = [];
    }

    // Only keep top 5 per region
    if (regionBuckets[region].length >= 5) continue;

    const displayTitle = article.title.replace(/_/g, ' ');
    regionBuckets[region].push({
      title: displayTitle,
      views: article.views,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
      region,
    });
  }

  // Flatten all regions into one array, sorted by views descending
  const pages = Object.values(regionBuckets)
    .flat()
    .sort((a, b) => b.views - a.views);

  const { year, month, day } = formatDate(usedDate);
  const response: WikipediaViewsResponse = {
    pages,
    date: `${year}-${month}-${day}`,
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  cachedResponse = response;
  cacheTimestamp = Date.now();

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'X-Cache': 'MISS',
    },
  });
}

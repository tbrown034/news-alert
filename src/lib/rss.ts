import { NewsItem, Source, VerificationStatus, WatchpointId } from '@/types';
import { classifyRegion, isBreakingNews } from './sources';

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid?: string;
}

// Parse RSS XML to items
function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Simple regex-based parser for RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, 'title');
    const description = extractTag(itemXml, 'description');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const guid = extractTag(itemXml, 'guid');

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        description: decodeHtmlEntities(stripHtml(description || '')),
        link,
        pubDate: pubDate || new Date().toISOString(),
        guid: guid || link,
      });
    }
  }

  return items;
}

// Extract content from XML tag
function extractTag(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// Strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

// Fetch and parse RSS feed
export async function fetchRssFeed(
  source: Source & { feedUrl: string }
): Promise<NewsItem[]> {
  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: 60 }, // Cache for 1 minute
      headers: {
        'User-Agent': 'newsAlert/1.0 (+https://github.com/newsalert)',
      },
    });

    if (!response.ok) {
      console.error(`RSS fetch failed for ${source.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const items = parseRssXml(xml);

    return items.map((item) => {
      const region = source.region !== 'all'
        ? source.region
        : classifyRegion(item.title, item.description);

      return {
        id: `${source.id}-${hashString(item.guid || item.link)}`,
        title: item.title,
        content: item.description || item.title,
        source,
        timestamp: new Date(item.pubDate),
        region,
        verificationStatus: getVerificationStatus(source.tier, source.confidence),
        url: item.link,
        isBreaking: isBreakingNews(item.title, item.description),
      };
    });
  } catch (error) {
    console.error(`RSS fetch error for ${source.name}:`, error);
    return [];
  }
}

// Determine verification status based on source tier and confidence
function getVerificationStatus(
  tier: Source['tier'],
  confidence: number
): VerificationStatus {
  if (tier === 'official' || confidence >= 90) return 'confirmed';
  if (tier === 'reporter' || confidence >= 75) return 'multiple-sources';
  return 'unverified';
}

// Simple hash function for generating IDs
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Fetch multiple RSS feeds in parallel
export async function fetchAllRssFeeds(
  sources: (Source & { feedUrl: string })[]
): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    sources.map((source) => fetchRssFeed(source))
  );

  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  // Sort by timestamp, newest first
  return allItems.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

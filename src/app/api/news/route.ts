import { NextResponse } from 'next/server';
import { fetchAllRssFeeds } from '@/lib/rss';
import { rssSources, blueskySources, getSourcesByRegion } from '@/lib/sources';
import { WatchpointId } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get('region') || 'all') as WatchpointId;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    // Get sources for the requested region
    // For MVP, start with RSS feeds (more reliable)
    // Bluesky RSS endpoints may have different rate limits
    const sources = region === 'all'
      ? [...rssSources, ...blueskySources.slice(0, 3)] // Limit Bluesky to avoid rate limits
      : getSourcesByRegion(region);

    // Fetch all feeds
    const newsItems = await fetchAllRssFeeds(sources);

    // Filter by region if specified
    const filtered = region === 'all'
      ? newsItems
      : newsItems.filter((item) => item.region === region || item.region === 'all');

    // Return limited results
    const limited = filtered.slice(0, limit);

    // Calculate activity levels per region
    const activityByRegion = calculateActivityLevels(newsItems);

    return NextResponse.json({
      items: limited,
      activity: activityByRegion,
      fetchedAt: new Date().toISOString(),
      totalItems: filtered.length,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', items: [], activity: {} },
      { status: 500 }
    );
  }
}

// Calculate activity levels based on recent news volume
function calculateActivityLevels(
  items: { region: WatchpointId; isBreaking?: boolean; timestamp: Date }[]
): Record<WatchpointId, { level: string; count: number; breaking: number }> {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const regions: WatchpointId[] = [
    'middle-east',
    'ukraine-russia',
    'china-taiwan',
    'venezuela',
    'us-domestic',
  ];

  const activity: Record<WatchpointId, { level: string; count: number; breaking: number }> = {} as any;

  for (const region of regions) {
    const regionItems = items.filter(
      (item) => item.region === region &&
        now - item.timestamp.getTime() < oneHour
    );
    const breakingCount = regionItems.filter((item) => item.isBreaking).length;
    const totalCount = regionItems.length;

    let level: string;
    if (breakingCount >= 3 || totalCount >= 15) level = 'critical';
    else if (breakingCount >= 2 || totalCount >= 10) level = 'high';
    else if (breakingCount >= 1 || totalCount >= 5) level = 'elevated';
    else if (totalCount >= 2) level = 'normal';
    else level = 'low';

    activity[region] = {
      level,
      count: totalCount,
      breaking: breakingCount,
    };
  }

  return activity;
}

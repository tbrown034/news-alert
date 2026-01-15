import { NextResponse } from 'next/server';
import { fetchAllRssFeeds } from '@/lib/rss';
import { allSources } from '@/lib/sources';
import { generateSummary, getCachedSummary, cacheSummary, canRequestSummary } from '@/lib/aiSummary';
import { WatchpointId } from '@/types';

// Valid regions for validation
const VALID_REGIONS: WatchpointId[] = ['all', 'middle-east', 'ukraine-russia', 'china-taiwan', 'venezuela', 'us-domestic', 'seismic'];

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionParam = searchParams.get('region') || 'all';
  const hours = Math.min(Math.max(1, parseInt(searchParams.get('hours') || '4', 10)), 24);
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Validate region parameter
  if (!VALID_REGIONS.includes(regionParam as WatchpointId)) {
    return NextResponse.json(
      { error: 'Invalid region parameter' },
      { status: 400 }
    );
  }
  const region = regionParam as WatchpointId;

  // Rate limiting - prevent expensive API abuse
  if (forceRefresh && !canRequestSummary(region)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait 60 seconds between refresh requests.' },
      { status: 429 }
    );
  }

  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedSummary(region);
      if (cached) {
        return NextResponse.json({
          ...cached,
          fromCache: true,
        });
      }
    }

    // Fetch recent posts
    const allPosts = await fetchAllRssFeeds(allSources);

    // Filter by region and time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const filteredPosts = allPosts.filter(post => {
      // Time filter
      if (post.timestamp < cutoffTime) return false;

      // Region filter
      if (region === 'all') return true;
      return post.region === region;
    });

    // Sort by timestamp (newest first) and limit
    const sortedPosts = filteredPosts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Limit to 50 most recent for context window

    // Generate summary
    const briefing = await generateSummary(sortedPosts, region, hours);

    // Cache the result
    cacheSummary(briefing);

    return NextResponse.json({
      ...briefing,
      fromCache: false,
    });
  } catch (error) {
    console.error('Summary generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

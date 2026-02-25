import { NextResponse } from 'next/server';
import { getCachedNews, getAllCachedNews } from '@/lib/newsCache';
import { generateSummary, getCachedSummary, cacheSummary, canRequestSummary } from '@/lib/aiSummary';
import { regionDisplayNames } from '@/lib/regionDetection';
import { WatchpointId } from '@/types';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rateLimit';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Valid regions for validation
const VALID_REGIONS: WatchpointId[] = ['all', 'us', 'latam', 'middle-east', 'europe-russia', 'asia', 'africa', 'seismic'];

// Model tiers
type ModelTier = 'quick' | 'advanced' | 'pro';
const MODEL_MAP: Record<ModelTier, string> = {
  quick: 'claude-haiku-4-5-20251001',
  advanced: 'claude-sonnet-4-20250514',
  pro: 'claude-opus-4-5-20250131',
};

import { ADMIN_EMAILS } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for AI generation (requires Vercel Pro)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionParam = searchParams.get('region') || 'all';
  const hours = Math.min(Math.max(1, parseInt(searchParams.get('hours') || '6', 10)), 24);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const tierParam = (searchParams.get('tier') || 'quick') as ModelTier;

  // Validate region parameter
  if (!VALID_REGIONS.includes(regionParam as WatchpointId)) {
    return NextResponse.json(
      { error: 'Invalid region parameter' },
      { status: 400 }
    );
  }
  const region = regionParam as WatchpointId;

  // Validate tier parameter
  if (!['quick', 'advanced', 'pro'].includes(tierParam)) {
    return NextResponse.json(
      { error: 'Invalid tier parameter. Must be quick, advanced, or pro.' },
      { status: 400 }
    );
  }

  // Rate limiting per IP - different limits per tier
  const clientIp = getClientIp(request);
  const rateLimits: Record<ModelTier, { windowMs: number; maxRequests: number }> = {
    quick: { windowMs: 60000, maxRequests: 30 },     // 30 per minute (auto-load friendly)
    advanced: { windowMs: 60000, maxRequests: 10 },  // 10 per minute
    pro: { windowMs: 60000, maxRequests: 5 },        // 5 per minute
  };

  const rateLimitResult = checkRateLimit(`summary:${tierParam}:${clientIp}`, rateLimits[tierParam]);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before requesting another summary.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  // Pro tier requires admin authentication
  if (tierParam === 'pro') {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      const userEmail = session?.user?.email?.toLowerCase();
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        return NextResponse.json(
          { error: 'Pro tier requires admin access. Please sign in with an authorized account.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Authentication required for Pro tier.' },
        { status: 401 }
      );
    }
  }

  // Legacy rate limiting - prevent expensive API abuse
  if (forceRefresh && !canRequestSummary(region)) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait 60 seconds between refresh requests.' },
      { status: 429 }
    );
  }

  // Get the model for this tier
  const model = MODEL_MAP[tierParam];

  try {
    // Check summary cache first (unless force refresh)
    // Cache is keyed by region+tier so each tier has its own cache
    if (!forceRefresh) {
      const cached = getCachedSummary(region, tierParam);
      if (cached) {
        return NextResponse.json({
          ...cached,
          tier: tierParam,
          fromCache: true,
        }, {
          headers: {
            // Edge cache - shorter for quick tier (auto-loads), longer for premium tiers
            'Cache-Control': tierParam === 'quick'
              ? 'public, s-maxage=180, stale-while-revalidate=60'
              : 'public, s-maxage=600, stale-while-revalidate=120',
          },
        });
      }
    }

    // Get posts from the NEWS CACHE instead of re-fetching
    // This is the key fix - we use cached news data
    let allPosts;

    if (region === 'all') {
      // Get all cached news across all regions
      allPosts = getAllCachedNews();
    } else {
      // Get cached news for specific region
      const cachedNews = getCachedNews(region);
      if (cachedNews) {
        allPosts = cachedNews.items;
      } else {
        // Fallback: check all cached news and filter by region
        allPosts = getAllCachedNews().filter(post =>
          post.region === region || post.region === 'all'
        );
      }
    }

    // If no cached news available, return a minimal response (not an error)
    // The client can retry as more data loads
    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({
        region,
        timeWindowHours: hours,
        generatedAt: new Date().toISOString(),
        summary: 'Waiting for news data to load...',
        tensionScore: 3,
        keyDevelopments: [],
        watchIndicators: [],
        sourcesAnalyzed: 0,
        topSources: [],
        fromCache: false,
        pending: true, // Signal to client that more data is coming
      });
    }

    // Filter by time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const filteredPosts = allPosts.filter(post => {
      // Time filter
      if (post.timestamp < cutoffTime) return false;

      // Region filter (already applied for non-all regions above, but double-check)
      if (region !== 'all' && post.region !== region && post.region !== 'all') return false;

      return true;
    });

    // Sort by timestamp (newest first) and limit
    const sortedPosts = filteredPosts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Limit to 50 most recent for context window

    // If very few posts, still generate a summary but note it's limited
    // This allows briefings to appear quickly with whatever data is available
    if (sortedPosts.length < 3) {
      // With 1-2 posts, generate a quick summary without AI
      const quickSummary = sortedPosts.length === 0
        ? `No recent activity in ${regionDisplayNames[region]} in the past ${hours} hours.`
        : sortedPosts.length === 1
          ? `One update from ${sortedPosts[0].source.name}: ${sortedPosts[0].title.slice(0, 150)}...`
          : `${sortedPosts.length} updates in the past ${hours} hours. Latest from ${sortedPosts[0].source.name}.`;

      return NextResponse.json({
        region,
        timeWindowHours: hours,
        generatedAt: new Date().toISOString(),
        summary: quickSummary,
        tensionScore: 2,
        keyDevelopments: [],
        watchIndicators: [],
        sourcesAnalyzed: sortedPosts.length,
        topSources: sortedPosts.map(p => p.source.name).slice(0, 3),
        fromCache: false,
        limited: true, // Signal that this is a limited summary
      }, {
        headers: {
          // Shorter cache for limited summaries - will be replaced when more data available
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      });
    }

    // Generate summary with the selected model tier
    const briefing = await generateSummary(sortedPosts, region, hours, model);

    if (!briefing) {
      return NextResponse.json(
        { error: 'Failed to generate summary. AI returned invalid response.' },
        { status: 502 }
      );
    }

    // Cache the result - keyed by region+tier
    cacheSummary(briefing, tierParam);

    return NextResponse.json({
      ...briefing,
      tier: tierParam,
      fromCache: false,
    }, {
      headers: {
        // Edge cache - shorter for quick tier (auto-loads), longer for premium tiers
        'Cache-Control': tierParam === 'quick'
          ? 'public, s-maxage=180, stale-while-revalidate=60'  // 3 min for quick
          : 'public, s-maxage=600, stale-while-revalidate=120', // 10 min for advanced/pro
      },
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

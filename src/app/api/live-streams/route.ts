/**
 * YOUTUBE LIVE STREAMS API
 * ========================
 * Checks if monitored YouTube channels are currently live streaming
 * Useful for breaking news coverage (severe weather, geopolitical events)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// MONITORED CHANNELS
// Add YouTube channel IDs here for channels you want to monitor
// To find a channel ID: go to channel page -> View Page Source -> search "channelId"
// Or use: https://www.youtube.com/channel/{CHANNEL_ID}
// ============================================================================
const MONITORED_CHANNELS = [
  {
    channelId: 'UCzNpqbNkfBPqrshpEUXWppQ', // Max Velocity / Lookner - Severe Weather
    name: 'Max Velocity / Lookner',
    category: 'weather',
  },
  {
    channelId: 'UCQGqX5Ndpm4snE0NTjyOJnA', // The Weather Channel
    name: 'The Weather Channel',
    category: 'weather',
  },
  {
    channelId: 'UCupvZG-5ko_eiXAupbDfxWw', // CNN Live
    name: 'CNN',
    category: 'news',
  },
  {
    channelId: 'UCeY0bbntWzzVIaj2z3QigXg', // NBC News
    name: 'NBC News',
    category: 'news',
  },
  {
    channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', // ABC News
    name: 'ABC News',
    category: 'news',
  },
  {
    channelId: 'UC8p1vwvWtl6T73JiExfWs1g', // CBS News
    name: 'CBS News',
    category: 'news',
  },
  {
    channelId: 'UCaXkIU1QidjPwiAYu6GcHjg', // MSNBC
    name: 'MSNBC',
    category: 'news',
  },
  {
    channelId: 'UCXIJgqnII2ZOINSWNOGFThA', // Fox News
    name: 'Fox News',
    category: 'news',
  },
  {
    channelId: 'UC16niRr50-MSBwiO3YDb3RA', // BBC News
    name: 'BBC News',
    category: 'news',
  },
  {
    channelId: 'UCknLrEdhRCp1aegoMqRaCZg', // Al Jazeera English
    name: 'Al Jazeera English',
    category: 'news',
  },
  {
    channelId: 'UCef1-8eOpJgud7szVPlZQAQ', // Reuters
    name: 'Reuters',
    category: 'news',
  },
  {
    channelId: 'UC52X5wxOL_s5yw0dQk7NtgA', // Sky News
    name: 'Sky News',
    category: 'news',
  },
];

// ============================================================================
// CACHE
// 2 minute cache - live status changes frequently
// ============================================================================
interface CacheEntry {
  data: LiveStreamResponse;
  timestamp: number;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let cache: CacheEntry | null = null;

// ============================================================================
// TYPES
// ============================================================================
interface LiveStream {
  channelId: string;
  channelName: string;
  category: string;
  isLive: boolean;
  currentStream?: {
    title: string;
    videoId: string;
    viewerCount: number;
    startedAt: string;
    thumbnailUrl: string;
  };
  lastKnownLive?: string; // ISO timestamp - tracked in memory (resets on deploy)
}

interface LiveStreamResponse {
  streams: LiveStream[];
  checkedAt: string;
  liveCount: number;
}

// Track last known live times (persists in memory only)
const lastKnownLiveTimes = new Map<string, string>();

// ============================================================================
// YOUTUBE API HELPERS
// ============================================================================

/**
 * Check if a channel is currently live using YouTube Data API v3
 */
async function checkChannelLiveStatus(
  channelId: string,
  apiKey: string,
  signal: AbortSignal
): Promise<{
  isLive: boolean;
  videoId?: string;
  title?: string;
  thumbnailUrl?: string;
}> {
  // Search for live videos on this channel
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('eventType', 'live');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('key', apiKey);

  const response = await fetch(searchUrl.toString(), {
    signal,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      console.error(`[Live Streams] YouTube API quota exceeded or key invalid`);
    }
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const liveVideo = data.items[0];
    return {
      isLive: true,
      videoId: liveVideo.id.videoId,
      title: liveVideo.snippet.title,
      thumbnailUrl: liveVideo.snippet.thumbnails?.high?.url ||
                    liveVideo.snippet.thumbnails?.medium?.url ||
                    liveVideo.snippet.thumbnails?.default?.url,
    };
  }

  return { isLive: false };
}

/**
 * Get live video statistics (viewer count, start time)
 */
async function getVideoStatistics(
  videoId: string,
  apiKey: string,
  signal: AbortSignal
): Promise<{
  viewerCount: number;
  startedAt: string;
}> {
  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  statsUrl.searchParams.set('part', 'liveStreamingDetails,statistics');
  statsUrl.searchParams.set('id', videoId);
  statsUrl.searchParams.set('key', apiKey);

  const response = await fetch(statsUrl.toString(), {
    signal,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const video = data.items[0];
    return {
      viewerCount: parseInt(video.liveStreamingDetails?.concurrentViewers || '0', 10),
      startedAt: video.liveStreamingDetails?.actualStartTime || new Date().toISOString(),
    };
  }

  return {
    viewerCount: 0,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Fetch live status for all monitored channels
 */
async function fetchAllLiveStreams(apiKey: string): Promise<LiveStreamResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s total timeout

  try {
    const streams: LiveStream[] = [];

    // Process channels in parallel with individual error handling
    const results = await Promise.allSettled(
      MONITORED_CHANNELS.map(async (channel) => {
        try {
          const liveStatus = await checkChannelLiveStatus(
            channel.channelId,
            apiKey,
            controller.signal
          );

          const stream: LiveStream = {
            channelId: channel.channelId,
            channelName: channel.name,
            category: channel.category,
            isLive: liveStatus.isLive,
            lastKnownLive: lastKnownLiveTimes.get(channel.channelId),
          };

          if (liveStatus.isLive && liveStatus.videoId) {
            // Update last known live time
            const now = new Date().toISOString();
            lastKnownLiveTimes.set(channel.channelId, now);
            stream.lastKnownLive = now;

            // Fetch detailed statistics
            try {
              const stats = await getVideoStatistics(
                liveStatus.videoId,
                apiKey,
                controller.signal
              );

              stream.currentStream = {
                title: liveStatus.title || 'Live Stream',
                videoId: liveStatus.videoId,
                viewerCount: stats.viewerCount,
                startedAt: stats.startedAt,
                thumbnailUrl: liveStatus.thumbnailUrl || '',
              };
            } catch (statsError) {
              // Still return stream info even if stats fail
              console.warn(`[Live Streams] Failed to get stats for ${channel.name}:`, statsError);
              stream.currentStream = {
                title: liveStatus.title || 'Live Stream',
                videoId: liveStatus.videoId,
                viewerCount: 0,
                startedAt: new Date().toISOString(),
                thumbnailUrl: liveStatus.thumbnailUrl || '',
              };
            }
          }

          return stream;
        } catch (error) {
          console.warn(`[Live Streams] Failed to check ${channel.name}:`, error);
          // Return channel with unknown status on error
          return {
            channelId: channel.channelId,
            channelName: channel.name,
            category: channel.category,
            isLive: false,
            lastKnownLive: lastKnownLiveTimes.get(channel.channelId),
          } as LiveStream;
        }
      })
    );

    // Collect successful results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        streams.push(result.value);
      }
    }

    // Sort: live streams first, then by category, then by name
    streams.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.channelName.localeCompare(b.channelName);
    });

    const liveCount = streams.filter(s => s.isLive).length;

    return {
      streams,
      checkedAt: new Date().toISOString(),
      liveCount,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// API ROUTE
// ============================================================================
export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Handle missing API key gracefully
  if (!apiKey) {
    console.warn('[Live Streams] YOUTUBE_API_KEY not configured');
    return NextResponse.json({
      streams: MONITORED_CHANNELS.map(channel => ({
        channelId: channel.channelId,
        channelName: channel.name,
        category: channel.category,
        isLive: false,
        lastKnownLive: lastKnownLiveTimes.get(channel.channelId),
      })),
      checkedAt: new Date().toISOString(),
      liveCount: 0,
      error: 'YOUTUBE_API_KEY not configured - live status unavailable',
    });
  }

  // Check cache
  if (cache && (Date.now() - cache.timestamp) < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cache.data,
      fromCache: true,
    });
  }

  try {
    const data = await fetchAllLiveStreams(apiKey);

    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      ...data,
      fromCache: false,
    });
  } catch (error) {
    console.error('[Live Streams] API error:', error);

    // Return stale cache if available
    if (cache) {
      return NextResponse.json({
        ...cache.data,
        fromCache: true,
        stale: true,
        error: 'Failed to refresh - returning cached data',
      });
    }

    // Return empty state on complete failure
    return NextResponse.json({
      streams: MONITORED_CHANNELS.map(channel => ({
        channelId: channel.channelId,
        channelName: channel.name,
        category: channel.category,
        isLive: false,
        lastKnownLive: lastKnownLiveTimes.get(channel.channelId),
      })),
      checkedAt: new Date().toISOString(),
      liveCount: 0,
      error: 'Failed to fetch live stream status',
    }, { status: 500 });
  }
}

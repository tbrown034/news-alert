import HomeClient from './HomeClient';
import { WatchpointId, NewsItem } from '@/types';
import { RegionActivity } from '@/lib/activityDetection';

// Don't statically generate - this page fetches live data
export const dynamic = 'force-dynamic';

interface ApiResponse {
  items: NewsItem[];
  activity: Record<string, RegionActivity>;
  fetchedAt: string;
  totalItems: number;
}

// Regions that participate in "hottest region" calculation
// LATAM and Asia excluded due to low source coverage
const SCORED_REGIONS = ['us', 'middle-east', 'europe-russia'];

// Server Component - fetches initial data at request time
export default async function Home() {
  let initialData: ApiResponse | null = null;
  let initialRegion: WatchpointId = 'all';
  let initialMapFocus: WatchpointId | undefined;

  try {
    // Server-side fetch with timeout - don't block page render for too long
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Abort if SSR fetch takes longer than 15s - client will fetch fresh
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Fetch all sources (no tier separation - simplified architecture)
    const response = await fetch(`${baseUrl}/api/news?region=all&hours=6&limit=2000`, {
      next: { revalidate: 300 }, // Cache for 5 min (matches server cache TTL)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      initialData = await response.json();

      // Find hottest region to focus map camera (but keep feed global)
      if (initialData?.activity) {
        const activityPriority: Record<string, number> = {
          critical: 3,
          elevated: 2,
          normal: 1,
        };

        const rankedRegions = Object.entries(initialData.activity)
          .filter(([id]) => SCORED_REGIONS.includes(id))
          .map(([id, activity]) => ({
            id: id as WatchpointId,
            priority: activityPriority[activity.level] || 0,
            multiplier: activity.multiplier || 0,
          }))
          // Sort by priority first, then by multiplier for tiebreaker
          .sort((a, b) => b.priority - a.priority || b.multiplier - a.multiplier);

        // Focus map on hottest region if elevated or critical
        if (rankedRegions.length > 0 && rankedRegions[0].priority >= 2) {
          initialMapFocus = rankedRegions[0].id;
        }
      }
    }
  } catch (error) {
    console.error('[Page] Failed to fetch initial data:', error);
  }

  return <HomeClient initialData={initialData} initialRegion={initialRegion} initialMapFocus={initialMapFocus} />;
}

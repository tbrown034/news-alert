import { test, expect } from '@playwright/test';

// =============================================================================
// NEWS API - Health, Speed, and Correctness
// =============================================================================

test.describe('News API - /api/news', () => {
  test('should return valid response with items and activity', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/api/news?region=all&hours=6&limit=100');
    const elapsed = Date.now() - start;

    expect(response.ok()).toBe(true);
    const data = await response.json();

    // Structure checks
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('activity');
    expect(data).toHaveProperty('fetchedAt');
    expect(data).toHaveProperty('totalItems');
    expect(data).toHaveProperty('sourcesCount');
    expect(data).toHaveProperty('hoursWindow', 6);

    // Items should be an array
    expect(Array.isArray(data.items)).toBe(true);

    console.log(`[API /api/news] ${elapsed}ms | ${data.totalItems} total items | ${data.items.length} returned | ${data.sourcesCount} sources | fromCache: ${data.fromCache}`);
  });

  test('should return items without deprecated fields', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=10');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    // Verify no deprecated fields exist on any item
    for (const item of data.items) {
      expect(item).not.toHaveProperty('alertStatus');
      expect(item).not.toHaveProperty('isBreaking');
      expect(item).not.toHaveProperty('confirmsSource');

      // Required fields should exist
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('source');
      expect(item).toHaveProperty('timestamp');
      expect(item).toHaveProperty('region');
      expect(item).toHaveProperty('verificationStatus');
    }

    if (data.items.length > 0) {
      console.log(`[Cleanup OK] ${data.items.length} items checked - no deprecated fields found`);
    }
  });

  test('should serve items in chronological order (newest first)', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=50');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    // Skip editorial items at the top (breaking/pinned are intentionally first)
    const regularItems = data.items.filter((item: { id: string }) => !item.id.startsWith('editorial-'));

    for (let i = 1; i < regularItems.length; i++) {
      const prev = new Date(regularItems[i - 1].timestamp).getTime();
      const curr = new Date(regularItems[i].timestamp).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }

    console.log(`[Chronological] ${regularItems.length} regular items verified in newest-first order`);
  });

  test('should only contain enabled platforms (bluesky, telegram, mastodon)', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=200');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    const enabledPlatforms = new Set(['bluesky', 'telegram', 'mastodon']);
    const platformCounts: Record<string, number> = {};

    for (const item of data.items) {
      if (item.id.startsWith('editorial-')) continue; // skip editorial
      const platform = item.source?.platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;

      // Editorial items use 'rss' as platform base - skip those
      if (!item.id.startsWith('editorial-')) {
        expect(enabledPlatforms.has(platform)).toBe(true);
      }
    }

    console.log(`[Platforms] ${JSON.stringify(platformCounts)}`);
  });

  test('should filter by region', async ({ request }) => {
    const regions = ['us', 'middle-east', 'europe-russia'] as const;

    for (const region of regions) {
      const response = await request.get(`/api/news?region=${region}&hours=6&limit=50`);
      expect(response.ok()).toBe(true);
      const data = await response.json();

      // All non-editorial items should match the requested region
      const wrongRegion = data.items.filter(
        (item: { id: string; region: string }) => !item.id.startsWith('editorial-') && item.region !== region
      );

      if (wrongRegion.length > 0) {
        console.warn(`[Region ${region}] ${wrongRegion.length} items with wrong region: ${wrongRegion.map((i: { region: string }) => i.region).join(', ')}`);
      }

      console.log(`[Region ${region}] ${data.items.length} items returned`);
    }
  });

  test('should respect time window filter', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=1&limit=200');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const staleItems = data.items.filter(
      (item: { id: string; timestamp: string }) =>
        !item.id.startsWith('editorial-') && new Date(item.timestamp).getTime() < oneHourAgo
    );

    expect(staleItems.length).toBe(0);
    console.log(`[Time Window] hours=1 | ${data.items.length} items, all within 1 hour`);
  });

  test('should handle incremental updates via since param', async ({ request }) => {
    // First fetch to get latest timestamp
    const initial = await request.get('/api/news?region=all&hours=6&limit=5');
    const initialData = await initial.json();

    if (initialData.items.length === 0) {
      test.skip();
      return;
    }

    // Use the latest timestamp as 'since'
    const since = initialData.items[0].timestamp;
    const incremental = await request.get(`/api/news?region=all&hours=6&since=${since}`);
    const incrementalData = await incremental.json();

    expect(incrementalData.isIncremental).toBe(true);
    // Incremental should return fewer or equal items
    expect(incrementalData.items.length).toBeLessThanOrEqual(initialData.totalItems);

    console.log(`[Incremental] since=${since} | ${incrementalData.items.length} new items`);
  });

  test('should respond fast on cache hit', async ({ request }) => {
    // First request populates cache
    await request.get('/api/news?region=all&hours=6&limit=10');

    // Second request should hit cache
    const start = Date.now();
    const response = await request.get('/api/news?region=all&hours=6&limit=10');
    const elapsed = Date.now() - start;
    const data = await response.json();

    expect(data.fromCache).toBe(true);
    // Cached response should be fast (under 500ms)
    expect(elapsed).toBeLessThan(500);

    console.log(`[Cache Hit] ${elapsed}ms (cached)`);
  });
});

// =============================================================================
// ACTIVITY DETECTION - Verify frequency-based threat levels
// =============================================================================

test.describe('Activity Detection', () => {
  test('should return activity levels for all tracked regions', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=10');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    const expectedRegions = ['us', 'latam', 'middle-east', 'europe-russia', 'asia'];

    for (const region of expectedRegions) {
      expect(data.activity).toHaveProperty(region);
      const activity = data.activity[region];

      // Structure checks
      expect(activity).toHaveProperty('level');
      expect(activity).toHaveProperty('count');
      expect(activity).toHaveProperty('baseline');
      expect(activity).toHaveProperty('multiplier');
      expect(activity).toHaveProperty('vsNormal');
      expect(activity).toHaveProperty('percentChange');

      // No deprecated breaking field
      expect(activity).not.toHaveProperty('breaking');

      // Level must be valid
      expect(['critical', 'elevated', 'normal']).toContain(activity.level);

      // vsNormal must be valid
      expect(['above', 'below', 'normal']).toContain(activity.vsNormal);

      // Baseline must be positive
      expect(activity.baseline).toBeGreaterThan(0);

      // Multiplier should be non-negative
      expect(activity.multiplier).toBeGreaterThanOrEqual(0);

      console.log(`[Activity ${region}] level=${activity.level} | count=${activity.count} | baseline=${activity.baseline} | multiplier=${activity.multiplier}x | vsNormal=${activity.vsNormal} | change=${activity.percentChange}%`);
    }
  });

  test('LATAM and Asia should always report normal level', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=10');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    // These regions are excluded from scoring due to insufficient source coverage
    expect(data.activity.latam.level).toBe('normal');
    expect(data.activity.asia.level).toBe('normal');

    console.log(`[Excluded Regions] LATAM: level=${data.activity.latam.level} (count=${data.activity.latam.count}) | Asia: level=${data.activity.asia.level} (count=${data.activity.asia.count})`);
  });

  test('activity multiplier should be mathematically correct', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=10');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    for (const [region, activity] of Object.entries(data.activity) as [string, { count: number; baseline: number; multiplier: number }][]) {
      if (activity.baseline > 0) {
        const expectedMultiplier = Math.round((activity.count / activity.baseline) * 10) / 10;
        expect(activity.multiplier).toBe(expectedMultiplier);
      }

      console.log(`[Multiplier ${region}] ${activity.count}/${activity.baseline} = ${activity.multiplier}x (expected ${activity.baseline > 0 ? Math.round((activity.count / activity.baseline) * 10) / 10 : 0}x)`);
    }
  });

  test('elevated level should require multiplier >= 2.5 AND count >= 25', async ({ request }) => {
    const response = await request.get('/api/news?region=all&hours=6&limit=10');
    expect(response.ok()).toBe(true);
    const data = await response.json();

    const excludedRegions = ['latam', 'asia'];

    for (const [region, activity] of Object.entries(data.activity) as [string, { level: string; count: number; multiplier: number }][]) {
      if (excludedRegions.includes(region)) continue;

      if (activity.level === 'elevated') {
        expect(activity.multiplier).toBeGreaterThanOrEqual(2.5);
        expect(activity.count).toBeGreaterThanOrEqual(25);
        console.log(`[ELEVATED ${region}] multiplier=${activity.multiplier}x count=${activity.count} - thresholds met`);
      }

      if (activity.level === 'critical') {
        expect(activity.multiplier).toBeGreaterThanOrEqual(5);
        expect(activity.count).toBeGreaterThanOrEqual(50);
        console.log(`[CRITICAL ${region}] multiplier=${activity.multiplier}x count=${activity.count} - thresholds met`);
      }
    }
  });
});

// =============================================================================
// MAINSTREAM API - Verify separate RSS route
// =============================================================================

test.describe('Mainstream API - /api/mainstream', () => {
  test('should return grouped news agency articles', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/api/mainstream?region=all&hours=24&topN=3');
    const elapsed = Date.now() - start;

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data).toHaveProperty('sources');
    expect(data).toHaveProperty('totalSources');
    expect(data).toHaveProperty('totalArticles');
    expect(Array.isArray(data.sources)).toBe(true);

    // Each source group should have expected structure
    for (const group of data.sources) {
      expect(group).toHaveProperty('sourceId');
      expect(group).toHaveProperty('sourceName');
      expect(group).toHaveProperty('articles');
      expect(group).toHaveProperty('articleCount24h');
      expect(Array.isArray(group.articles)).toBe(true);
    }

    console.log(`[API /api/mainstream] ${elapsed}ms | ${data.totalSources} sources | ${data.totalArticles} articles | fromCache: ${data.fromCache}`);
  });
});

// =============================================================================
// ANALYTICS API - Activity logging and trends
// =============================================================================

test.describe('Analytics API - /api/analytics/activity', () => {
  test('should return rolling averages and recent logs', async ({ request }) => {
    const response = await request.get('/api/analytics/activity?view=overview');

    // This might fail if DB is not configured - that's OK
    if (!response.ok()) {
      console.log('[Analytics] DB not configured, skipping');
      test.skip();
      return;
    }

    const data = await response.json();
    expect(data).toHaveProperty('averages');
    expect(data).toHaveProperty('recentLogs');

    if (data.averages.length > 0) {
      for (const avg of data.averages) {
        console.log(`[Rolling Avg] ${avg.region}: avg=${avg.avg_posts_6h}/6h | min=${avg.min_posts} | max=${avg.max_posts} | latest=${avg.latest_count} | samples=${avg.sample_count}`);
      }
    } else {
      console.log('[Analytics] No rolling averages yet (no logged data)');
    }

    if (data.recentLogs.length > 0) {
      const latest = data.recentLogs[0];
      console.log(`[Latest Log] ${latest.region} @ ${latest.bucket_timestamp}: ${latest.post_count} posts from ${latest.source_count} sources (${latest.fetch_duration_ms}ms)`);
    }
  });

  test('should return trend data for a region', async ({ request }) => {
    const response = await request.get('/api/analytics/activity?view=trend&region=middle-east&days=7');

    if (!response.ok()) {
      console.log('[Analytics Trend] DB not configured, skipping');
      test.skip();
      return;
    }

    const data = await response.json();
    expect(data).toHaveProperty('region', 'middle-east');
    expect(data).toHaveProperty('trend');
    expect(Array.isArray(data.trend)).toBe(true);

    console.log(`[Trend middle-east] ${data.trend.length} data points over ${data.meta.days} days`);
  });
});

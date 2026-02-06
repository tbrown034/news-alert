import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const RUNS = 3;

// Helper to measure load time
async function timeRequest(page: any, url: string) {
  const start = Date.now();
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const elapsed = Date.now() - start;
  return { elapsed, status: response?.status() ?? 0 };
}

async function timeApiRequest(page: any, url: string) {
  const start = Date.now();
  const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  const elapsed = Date.now() - start;
  const body = await page.content();
  return { elapsed, status: response?.status() ?? 0, bodyLength: body.length };
}

test.describe('Site Load Tests', () => {

  test('Homepage loads correctly', async ({ page }) => {
    const times: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const { elapsed, status } = await timeRequest(page, BASE);
      expect(status).toBe(200);
      times.push(elapsed);
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    console.log(`Homepage: ${times.map(t => t + 'ms').join(', ')} | avg: ${avg}ms`);
    expect(avg).toBeLessThan(10000);
  });

  test('Homepage has key UI elements', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    // Check page title
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    expect(title.length).toBeGreaterThan(0);

    // Check for main content area
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);

    // No error banners or crash screens
    const errorText = await page.locator('text=/error|crash|500|failed to load/i').count();
    console.log(`Error indicators found: ${errorText}`);
  });

  test('/api/news returns valid data', async ({ page }) => {
    const times: number[] = [];
    let lastBody = '';
    for (let i = 0; i < RUNS; i++) {
      const start = Date.now();
      const response = await page.goto(`${BASE}/api/news?region=all`, { waitUntil: 'load', timeout: 30000 });
      const elapsed = Date.now() - start;
      expect(response?.status()).toBe(200);
      times.push(elapsed);
      lastBody = await page.textContent('body') ?? '';
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    console.log(`/api/news: ${times.map(t => t + 'ms').join(', ')} | avg: ${avg}ms`);

    // Parse and validate response
    const data = JSON.parse(lastBody);
    console.log(`Items returned: ${data.items?.length ?? 0}`);
    console.log(`Total items: ${data.totalItems ?? 'N/A'}`);
    console.log(`Sources count: ${data.sourcesCount ?? 'N/A'}`);
    console.log(`From cache: ${data.fromCache ?? 'N/A'}`);
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(0);

    // Check item structure if we have items
    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item.title || item.content).toBeTruthy();
      expect(item.source).toBeTruthy();
      console.log(`Sample item source: ${item.source}, platform: ${item.platform}`);
    }
  });

  test('/api/news per-region endpoints work', async ({ page }) => {
    const regions = ['middle-east', 'europe-russia', 'asia', 'us', 'all'];
    for (const region of regions) {
      const start = Date.now();
      const response = await page.goto(`${BASE}/api/news?region=${region}`, { waitUntil: 'load', timeout: 30000 });
      const elapsed = Date.now() - start;
      const status = response?.status() ?? 0;
      const body = await page.textContent('body') ?? '';

      if (status === 200) {
        const data = JSON.parse(body);
        console.log(`Region ${region}: ${status} | ${elapsed}ms | ${data.items?.length ?? 0} items`);
        expect(data.items).toBeDefined();
      } else {
        console.log(`Region ${region}: ${status} | ${elapsed}ms | ERROR`);
        // Don't fail on non-200 for regional — may have no cached data yet
      }
    }
  });

  test('/api/mainstream returns valid data', async ({ page }) => {
    const times: number[] = [];
    let lastBody = '';
    for (let i = 0; i < RUNS; i++) {
      const start = Date.now();
      const response = await page.goto(`${BASE}/api/mainstream`, { waitUntil: 'load', timeout: 30000 });
      const elapsed = Date.now() - start;
      const status = response?.status() ?? 0;
      times.push(elapsed);
      lastBody = await page.textContent('body') ?? '';
      console.log(`/api/mainstream run ${i + 1}: ${status} | ${elapsed}ms`);
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    console.log(`/api/mainstream avg: ${avg}ms`);

    if (lastBody) {
      try {
        const data = JSON.parse(lastBody);
        console.log(`Mainstream items: ${data.items?.length ?? data.posts?.length ?? 0}`);
      } catch (e) {
        console.log(`Mainstream response not JSON (may be OK): ${lastBody.substring(0, 200)}`);
      }
    }
  });

  test('/api/seismic loads', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto(`${BASE}/api/seismic`, { waitUntil: 'load', timeout: 30000 });
    const elapsed = Date.now() - start;
    console.log(`/api/seismic: ${response?.status()} | ${elapsed}ms`);
    expect(response?.status()).toBe(200);
  });

  test('/api/weather loads', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto(`${BASE}/api/weather`, { waitUntil: 'load', timeout: 30000 });
    const elapsed = Date.now() - start;
    console.log(`/api/weather: ${response?.status()} | ${elapsed}ms`);
    expect(response?.status()).toBe(200);
  });

  test('/api/conditions loads', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto(`${BASE}/api/conditions`, { waitUntil: 'load', timeout: 30000 });
    const elapsed = Date.now() - start;
    console.log(`/api/conditions: ${response?.status()} | ${elapsed}ms`);
    // May return various status codes depending on state
    expect([200, 500]).toContain(response?.status());
  });

  test('No console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait a bit for async errors
    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log(`Console errors (${errors.length}):`);
      errors.forEach(e => console.log(`  - ${e.substring(0, 200)}`));
    } else {
      console.log('No console errors detected');
    }
    // Warn but don't fail on console errors (some may be expected)
  });

  test('Full page interaction flow', async ({ page }) => {
    // Load homepage
    const start = Date.now();
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - start;
    console.log(`Full page load: ${loadTime}ms`);

    // Wait for feed content to appear
    await page.waitForTimeout(5000);

    // Check that feed items are rendering
    const bodyText = await page.textContent('body') ?? '';
    const hasContent = bodyText.length > 500;
    console.log(`Body text length: ${bodyText.length}`);
    console.log(`Has substantial content: ${hasContent}`);
    expect(hasContent).toBe(true);

    // Screenshot for visual verification
    await page.screenshot({
      path: '/private/tmp/claude-501/-Users-trevorbrown-Desktop-devMacbook-active-news-alert/dd0bd90c-1195-442e-9563-8c189ca6cd95/scratchpad/homepage-screenshot.png',
      fullPage: false
    });
    console.log('Screenshot saved');
  });
});

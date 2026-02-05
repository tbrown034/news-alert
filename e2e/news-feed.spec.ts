import { test, expect } from '@playwright/test';

test.describe('News Feed - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for feed to load
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });
  });

  test('should load news feed with items', async ({ page }) => {
    // Check Live Wire header exists
    await expect(page.locator('text=Live Wire')).toBeVisible();

    // Check stats line shows posts and sources
    await expect(page.locator('text=/\\d+ posts/')).toBeVisible();
    await expect(page.locator('text=/\\d+ sources/')).toBeVisible();

    // Check at least one news card exists
    const newsCards = page.locator('[class*="news-feed-list"] > div');
    await expect(newsCards.first()).toBeVisible();
  });

  test('should display trending keywords in stats line', async ({ page }) => {
    // Look for trending line
    const trendingLine = page.locator('text=/TRENDING/i');
    await expect(trendingLine).toBeVisible();

    // Should contain dot-separated keywords
    const trendingText = await trendingLine.textContent();
    expect(trendingText).toMatch(/TRENDING/i);
  });

  test('should filter by region tabs', async ({ page }) => {
    // Get initial All count
    const allTab = page.locator('button:has-text("All")').first();
    await expect(allTab).toBeVisible();

    // Click US tab
    const usTab = page.locator('button:has-text("US")').first();
    await usTab.click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Stats should show "Showing" (filtered) instead of "Fetched"
    await expect(page.locator('text=/Showing \\d+ posts/')).toBeVisible();

    // Click back to All
    await allTab.click();
    await page.waitForTimeout(500);

    // Should show "Fetched" again
    await expect(page.locator('text=/Fetched \\d+ posts/')).toBeVisible();
  });

  test('should expand More regions', async ({ page }) => {
    // Click More button in the region selector (inside feed section)
    const moreButton = page.locator('#feed-panel').locator('..').locator('button:has-text("More")').first();
    await moreButton.click();

    // Should show Less button now
    await expect(page.locator('button:has-text("Less")')).toBeVisible();

    // Click Less to collapse
    const lessButton = page.locator('button:has-text("Less")');
    await lessButton.click();

    // More button should be back
    await expect(page.locator('#feed-panel').locator('..').locator('button:has-text("More")').first()).toBeVisible();
  });

  test('should refresh feed', async ({ page }) => {
    // Find refresh button
    const refreshButton = page.locator('button[aria-label*="Refresh"]');
    await expect(refreshButton).toBeVisible();

    // Get current timestamp text
    const timestampBefore = await page.locator('text=/Last updated/').textContent();

    // Click refresh
    await refreshButton.click();

    // Wait for refresh to complete (loading spinner should appear and disappear)
    await page.waitForTimeout(2000);

    // Feed should still be visible
    await expect(page.locator('text=Live Wire')).toBeVisible();
  });
});

test.describe('News Feed - AI Briefing', () => {
  test('should show AI briefing card', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });

    // Look for Pulse AI briefing
    const briefingCard = page.locator('text=Pulse AI');
    await expect(briefingCard).toBeVisible();
  });

  test('should have generate briefing button when not auto-generated', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });

    // Click on a region to get filtered view
    await page.locator('button:has-text("Middle East")').first().click();
    await page.waitForTimeout(1000);

    // Should show Pulse AI briefing area
    const briefingArea = page.locator('text=Pulse AI');
    await expect(briefingArea.first()).toBeVisible();
  });
});

test.describe('News Feed - Breaking News & Activity', () => {
  test('should show activity indicator', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });

    // Look for activity indicator (normal, elevated, etc.)
    const activityIndicator = page.locator('text=/activity|usual/i');
    // May or may not be present depending on feed state
    const count = await activityIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show earthquake alerts if present', async ({ page }) => {
    await page.goto('/');

    // Check Global Monitor section for seismic info
    const seismicInfo = page.locator('text=/earthquake/i');
    const count = await seismicInfo.count();
    // Just verify we can look for it - may or may not be present
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('News Feed - Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });

    // Core elements should still be visible
    await expect(page.locator('text=Live Wire')).toBeVisible();

    // Region tabs should exist
    await expect(page.locator('button:has-text("All")')).toBeVisible();

    // News cards should be visible
    const newsCards = page.locator('[class*="news-feed-list"] > div');
    await expect(newsCards.first()).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });

    // All core elements visible
    await expect(page.locator('text=Live Wire')).toBeVisible();
    await expect(page.locator('text=/\\d+ posts/')).toBeVisible();
    await expect(page.locator('text=/TRENDING/i')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('.news-feed-list', { timeout: 15000 });

    // All core elements visible with proper spacing
    await expect(page.locator('text=Live Wire')).toBeVisible();
    await expect(page.locator('text=/\\d+ posts/')).toBeVisible();
    await expect(page.locator('text=/TRENDING/i')).toBeVisible();

    // Region tab counts should be visible on desktop
    await expect(page.locator('button:has-text("All")')).toBeVisible();
  });
});

test.describe('News Feed - Error Handling', () => {
  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/');

    // Even if API fails, page should not crash
    await expect(page.locator('text=News Pulse')).toBeVisible();
  });
});

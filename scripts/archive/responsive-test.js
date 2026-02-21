const { chromium } = require('playwright');
const path = require('path');

const viewports = [
  { name: 'iphone-se', width: 375, height: 667, label: 'iPhone SE (375x667)' },
  { name: 'iphone-12', width: 390, height: 844, label: 'iPhone 12 (390x844)' },
  { name: 'ipad-mini', width: 768, height: 1024, label: 'iPad Mini (768x1024)' },
  { name: 'ipad-pro', width: 1024, height: 1366, label: 'iPad Pro (1024x1366)' },
  { name: 'desktop', width: 1440, height: 900, label: 'Desktop (1440x900)' },
];

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  console.log('Starting responsive design capture...\n');

  for (const viewport of viewports) {
    console.log(`Capturing ${viewport.label}...`);

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2, // Retina quality
    });

    const page = await context.newPage();

    try {
      // Navigate to the page
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for Live Wire section to load
      await page.waitForSelector('text=Live Wire', { timeout: 10000 });

      // Wait a bit for content to fully render
      await page.waitForTimeout(2000);

      // Try to find and scroll to the filter section
      const filterSection = await page.$('[class*="filter"], [class*="trending"], [class*="sources"]');
      if (filterSection) {
        await filterSection.scrollIntoViewIfNeeded();
      }

      // Take full page screenshot
      const screenshotPath = `/tmp/responsive-${viewport.name}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`  Saved: ${screenshotPath}`);

    } catch (error) {
      console.error(`  Error capturing ${viewport.label}: ${error.message}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured!');
}

captureScreenshots().catch(console.error);

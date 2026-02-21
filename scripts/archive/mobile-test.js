const { chromium, devices } = require('playwright');

const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    console.log(`Testing ${vp.name} (${vp.width}x${vp.height})...`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for Live Wire section
    try {
      await page.waitForSelector('text=Live Wire', { timeout: 15000 });
    } catch (e) {
      console.log(`  Warning: Live Wire not found`);
    }

    await page.waitForTimeout(2000);

    // Scroll to filters
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: `/tmp/responsive-${vp.name}.png`,
      fullPage: false
    });
    console.log(`  Saved /tmp/responsive-${vp.name}.png`);

    await context.close();
  }

  await browser.close();
  console.log('Done!');
})();

import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 200)}`));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log(`[HTTP ${resp.status()}] ${resp.url().substring(0, 120)}`);
  });

  // Login through the UI normally
  console.log('Navigating to login...');
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('Filling login form...');
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');

  // Wait for React to render whatever it can
  console.log('Waiting after login...');
  await page.waitForTimeout(10000);

  console.log('URL:', page.url());
  await page.screenshot({ path: RECORDINGS_DIR + 'debug-11-after-login.png' });

  // Check if page crashed — if so, try reloading
  let rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  console.log('Root HTML length:', rootLen);

  if (rootLen < 100) {
    console.log('Page crashed. Reloading...');
    await page.reload({ waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(8000);
    rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
    console.log('After reload - Root HTML length:', rootLen);
    await page.screenshot({ path: RECORDINGS_DIR + 'debug-12-after-reload.png' });
  }

  if (rootLen < 100) {
    console.log('Still crashed. Trying to inject error boundary override...');
    // Override React error handling to prevent crash
    await page.evaluate(() => {
      // Clear token and reload
      const token = localStorage.getItem('zorbit_token');
      console.log('Token present:', !!token);
    });

    // Navigate to a simpler page
    await page.goto('https://zorbit.scalatics.com/settings', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(8000);
    rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
    console.log('Settings page - Root HTML length:', rootLen);
    await page.screenshot({ path: RECORDINGS_DIR + 'debug-13-settings.png' });
  }

  const asideCount = await page.locator('aside').count();
  console.log('aside count:', asideCount);

  await context.close();
  await browser.close();
})();

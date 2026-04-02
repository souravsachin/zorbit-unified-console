import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Try a real Chrome user agent
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Capture network
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
    }
  });
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 150)}`));

  console.log('Step 1: Navigate to login');
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'networkidle' });

  console.log('Step 2: Login');
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');

  // Block the customer API to prevent the 502 cascade
  await page.route('**/api/customer/**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.click('button[type="submit"]');

  console.log('Step 3: Wait for dashboard');
  await page.waitForTimeout(8000);

  console.log('URL:', page.url());
  await page.screenshot({ path: RECORDINGS_DIR + 'debug-06-blocked-customer.png' });

  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  console.log('Root HTML length:', rootLen);

  const asideCount = await page.locator('aside').count();
  console.log('aside count:', asideCount);

  await context.close();
  await browser.close();
})();

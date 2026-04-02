import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Capture ALL console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[CONSOLE ERROR] ${msg.text().substring(0, 200)}`);
  });
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 200)}`));

  // Capture network responses
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
    }
  });

  console.log('Navigating to login...');
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');

  console.log('Waiting for navigation...');
  await page.waitForURL('**/O/**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
  await page.screenshot({ path: RECORDINGS_DIR + 'debug-05-headed.png' });

  // Check for any rendered content
  const rootHtml = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 3000) : 'NO ROOT';
  });
  console.log('Root HTML length:', rootHtml.length);
  if (rootHtml.length < 100) console.log('Root HTML:', rootHtml);

  await page.waitForTimeout(3000);
  await context.close();
  await browser.close();
})();

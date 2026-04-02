import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  console.log('Navigating to login...');
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');

  console.log('Waiting 10 seconds for dashboard...');
  await page.waitForTimeout(10000);

  console.log('Current URL:', page.url());
  console.log('Errors:', JSON.stringify(errors, null, 2));

  // Check full HTML
  const html = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
  console.log('HTML:', html);

  // Check if it's a React root issue
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 1000) : 'NO ROOT';
  });
  console.log('Root:', rootContent);

  await page.screenshot({ path: RECORDINGS_DIR + 'debug-04-console.png' });

  await context.close();
  await browser.close();
})();

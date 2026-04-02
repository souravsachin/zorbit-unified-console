import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  console.log('Navigating to login...');
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: RECORDINGS_DIR + 'debug-01-login.png' });

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');

  console.log('Waiting 8 seconds...');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: RECORDINGS_DIR + 'debug-02-after-login.png' });

  // Check current URL
  console.log('Current URL:', page.url());

  // Check what's on the page
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body text:', bodyText);

  // Check for aside
  const asideCount = await page.locator('aside').count();
  console.log('aside count:', asideCount);

  // Check all buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent?.trim().substring(0, 50),
      classes: b.className.substring(0, 80),
    }));
  });
  console.log('Buttons:', JSON.stringify(buttons, null, 2));

  // Try clicking the first header button (hamburger)
  const headerButtons = page.locator('header button');
  const hbCount = await headerButtons.count();
  console.log('Header buttons:', hbCount);
  if (hbCount > 0) {
    await headerButtons.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: RECORDINGS_DIR + 'debug-03-after-hamburger.png' });
    const asideCount2 = await page.locator('aside').count();
    console.log('aside count after hamburger:', asideCount2);
  }

  await context.close();
  await browser.close();
  console.log('Screenshots saved to', RECORDINGS_DIR);
})();

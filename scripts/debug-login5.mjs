import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 200)}`));

  console.log('Step 1: Login directly via API to get token');

  // Get token via API first
  const loginResp = await page.request.post('https://zorbit.scalatics.com/api/identity/api/v1/auth/login', {
    data: { email: 's@onezippy.ai', password: 's@2021#cz' },
    headers: { 'Content-Type': 'application/json' },
  });
  const loginData = await loginResp.json();
  console.log('Login response keys:', Object.keys(loginData));
  const token = loginData.access_token || loginData.token;
  console.log('Token:', token ? token.substring(0, 30) + '...' : 'NONE');

  if (!token) {
    console.log('Full login response:', JSON.stringify(loginData).substring(0, 500));
    await browser.close();
    return;
  }

  // Decode JWT to see org
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  console.log('JWT payload:', JSON.stringify(payload).substring(0, 300));

  // Set token in localStorage before navigating to dashboard
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('zorbit_token', t);
  }, token);

  console.log('Step 2: Navigate to dashboard with pre-set token');
  await page.goto('https://zorbit.scalatics.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('URL:', page.url());
  await page.screenshot({ path: RECORDINGS_DIR + 'debug-07-direct-token.png' });

  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  console.log('Root HTML length:', rootLen);

  // If still empty, try checking what the SPA renders on different routes
  if (rootLen < 100) {
    console.log('\nStill broken. Testing if ANY route works...');

    // Try navigating to specific routes
    for (const path of ['/users', '/audit', '/settings', '/demo']) {
      await page.goto(`https://zorbit.scalatics.com${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const len = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
      console.log(`  ${path}: root HTML length = ${len}`);
      if (len > 100) {
        await page.screenshot({ path: RECORDINGS_DIR + `debug-08-${path.replace('/', '')}.png` });
        break;
      }
    }
  }

  await context.close();
  await browser.close();
})();

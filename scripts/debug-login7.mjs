import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 200)}`));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log(`[HTTP ${resp.status()}] ${resp.url().substring(0, 120)}`);
  });

  // Get token via API
  const loginResp = await page.request.post('https://zorbit.scalatics.com/api/identity/api/v1/G/auth/login', {
    data: { email: 's@onezippy.ai', password: 's@2021#cz' },
    headers: { 'Content-Type': 'application/json' },
  });
  const loginData = await loginResp.json();
  const token = loginData.accessToken;
  console.log('Got token:', token ? 'yes' : 'no');

  // Navigate to login page first to get into the domain
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'domcontentloaded' });

  // Set token and user info in localStorage
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  await page.evaluate(({ t, p }) => {
    localStorage.setItem('zorbit_token', t);
    localStorage.setItem('zorbit_user', JSON.stringify({
      id: p.sub,
      email: p.email,
      displayName: p.displayName,
      organizationId: p.org,
    }));
  }, { t: token, p: payload });

  console.log('Token set. Navigating to /...');
  await page.goto('https://zorbit.scalatics.com/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('URL:', page.url());
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  console.log('Root HTML length:', rootLen);

  if (rootLen > 100) {
    await page.screenshot({ path: RECORDINGS_DIR + 'debug-10-success.png' });
    const asideCount = await page.locator('aside').count();
    console.log('aside count:', asideCount);
    console.log('SUCCESS - dashboard loaded');
  } else {
    await page.screenshot({ path: RECORDINGS_DIR + 'debug-10-fail.png' });
    // Dump the exact content
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'EMPTY');
    console.log('Root HTML:', rootHtml.substring(0, 500));
  }

  await context.close();
  await browser.close();
})();

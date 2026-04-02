import { chromium } from 'playwright';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 200)}`));

  // Get token via correct API path
  const loginResp = await page.request.post('https://zorbit.scalatics.com/api/identity/api/v1/G/auth/login', {
    data: { email: 's@onezippy.ai', password: 's@2021#cz' },
    headers: { 'Content-Type': 'application/json' },
  });
  const loginData = await loginResp.json();
  console.log('Login keys:', Object.keys(loginData));
  const token = loginData.access_token || loginData.token;
  console.log('Token:', token ? token.substring(0, 30) + '...' : 'NONE');

  if (!token) {
    console.log('Full response:', JSON.stringify(loginData).substring(0, 500));
    await browser.close();
    return;
  }

  // Decode JWT
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  console.log('JWT org:', payload.org || payload.organizationId || payload.orgId);

  // Set token and navigate
  await page.goto('https://zorbit.scalatics.com/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('zorbit_token', t);
    localStorage.setItem('zorbit_user', JSON.stringify({
      id: 'test',
      email: 's@onezippy.ai',
      displayName: 'Sourav',
      organizationId: 'O-OZPY',
    }));
  }, token);

  console.log('Navigating to dashboard...');
  await page.goto('https://zorbit.scalatics.com/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('URL:', page.url());
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  console.log('Root HTML length:', rootLen);

  await page.screenshot({ path: RECORDINGS_DIR + 'debug-09-token.png' });

  if (rootLen > 0) {
    const bodySnippet = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Body text:', bodySnippet);
  }

  await context.close();
  await browser.close();
})();

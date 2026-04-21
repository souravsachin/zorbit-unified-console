import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const BASE = 'https://zorbit.scalatics.com';
const OUT = './scripts/recordings/identity-final';
mkdirSync(OUT, { recursive: true });

// ── MFA helpers ──────────────────────────────────────────────────────
function getMfaSecret() {
  return execSync(
    `ssh ilri-arm-uat "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`,
    { encoding: 'utf-8' },
  ).trim();
}

async function generateTotp(secret) {
  const otplib = require('/Users/s/workspace/zorbit/02_repos/zorbit-identity/node_modules/otplib');
  const crypto = new otplib.NobleCryptoPlugin();
  const b32 = new otplib.ScureBase32Plugin();
  const t = new otplib.TOTP({ crypto, base32: b32 });
  try { return t.generateSync({ secret }); }
  catch { return await t.generate({ secret }); }
}

// ── Navigate via hamburger menu ──────────────────────────────────────
async function menuClick(page, linkTitle) {
  console.log(`  menuClick("${linkTitle}")...`);
  const hamburger = page.locator('button[title="Toggle sidebar"]').first();
  try {
    await hamburger.waitFor({ state: 'visible', timeout: 3000 });
    await hamburger.click();
    await page.waitForTimeout(1000);
  } catch {}

  // Find link by title attribute (exact match via JS to handle multiple Dashboard links etc)
  const clicked = await page.evaluate((title) => {
    const links = Array.from(document.querySelectorAll('a[title]'));
    const match = links.find(a => a.getAttribute('title') === title);
    if (match) { match.click(); return match.getAttribute('href'); }
    // Fallback: text match
    const all = Array.from(document.querySelectorAll('a'));
    const textMatch = all.find(a => a.textContent?.trim() === title);
    if (textMatch) { textMatch.click(); return textMatch.getAttribute('href'); }
    return null;
  }, linkTitle);

  if (clicked !== null) {
    await page.waitForTimeout(2500);
    console.log(`    ok -> ${clicked}`);
    return true;
  }
  console.log('    FAILED');
  return false;
}

// ── Navigate via React Router (client-side, no reload) ───────────────
async function routerNavigate(page, path) {
  console.log(`  routerNavigate("${path}")...`);
  // Click a link with this href if it exists, otherwise simulate via history API
  const clicked = await page.evaluate((p) => {
    // Method 1: find and click existing link
    const link = document.querySelector(`a[href="${p}"]`);
    if (link) { link.click(); return 'link'; }
    // Method 2: use React Router by finding the router context
    // We can use window.__REACT_ROUTER_NAVIGATE__ if set, otherwise pushState
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return 'pushState';
  }, path);
  await page.waitForTimeout(3000);
  console.log(`    method: ${clicked}, url: ${page.url()}`);

  // If pushState didn't trigger React Router, check if we need to reload
  if (page.url().endsWith(path)) {
    // Check if the page actually rendered or shows NotFound
    const text = await page.locator('h1').first().textContent().catch(() => '');
    if (text.includes('Page Not Available')) {
      console.log('    Route not found via pushState, trying link click');
      // The route exists in React Router but pushState doesn't trigger it
      // Try creating a temporary link and clicking it
      await page.evaluate((p) => {
        const a = document.createElement('a');
        a.href = p;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, path);
      await page.waitForTimeout(3000);
    }
  }
}

// ── Screenshot ───────────────────────────────────────────────────────
async function snap(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}` });
  console.log(`  screenshot: ${name} (${page.url()})`);
}

// ── Main ─────────────────────────────────────────────────────────────
(async () => {
  console.log('Fetching MFA secret...');
  const mfaSecret = getMfaSecret();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('CONSOLE_ERR:', msg.text().substring(0, 200));
  });

  // ═══════ Ch1: Login with MFA ═══════
  console.log('\n=== Ch1: Login with MFA ===');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(3000);
  await snap(page, 'ch1-login.png');

  await page.locator('input[type="email"]').type('s@onezippy.ai', { delay: 80 });
  await page.waitForTimeout(500);
  await page.locator('input[type="password"]').type('s@2021#cz', { delay: 80 });
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(4000);
  await snap(page, 'ch1-mfa.png');

  const code = await generateTotp(mfaSecret);
  console.log('  TOTP:', code);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 10000 });
  await mfaInput.type(String(code), { delay: 100 });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(5000);
  await snap(page, 'ch1.png');

  // ═══════ Ch2: Dashboard ═══════
  console.log('\n=== Ch2: Dashboard ===');
  await page.waitForTimeout(3000);
  await snap(page, 'ch2.png');

  // ═══════ Ch3: Organizations ═══════
  console.log('\n=== Ch3: Organizations ===');
  await menuClick(page, 'Organizations');
  await page.waitForTimeout(3000);
  await page.locator('table tbody tr').first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Scroll to Vantara
  try {
    await page.locator('td:has-text("Vantara")').first().scrollIntoViewIfNeeded();
  } catch {
    await page.evaluate(() => window.scrollBy(0, 500));
  }
  await page.waitForTimeout(1000);
  await snap(page, 'ch3.png');

  // ═══════ Ch4: Departments ═══════
  console.log('\n=== Ch4: Departments ===');

  // First try: find "Depts" link in the current page
  const deptsResult = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const depts = links.find(a => (a.getAttribute('href') || '').includes('/departments'));
    if (depts) { depts.click(); return depts.getAttribute('href'); }
    return null;
  });

  if (deptsResult) {
    console.log(`  Found and clicked: ${deptsResult}`);
  } else {
    // Try navigating directly via the browser address bar (goto)
    // This preserves auth cookies/localStorage
    console.log('  No Depts link in DOM. Navigating directly...');
    await page.goto(`${BASE}/organizations/O-ED5A/departments`);
  }
  await page.waitForTimeout(5000);

  const deptH1 = await page.locator('h1, h2').first().textContent().catch(() => '');
  console.log('  Page heading:', deptH1);

  if (deptH1.includes('Page Not Available') || deptH1.includes('Not Available')) {
    console.log('  WARN: Departments page not available. Trying O-77E0...');
    await page.goto(`${BASE}/organizations/O-77E0/departments`);
    await page.waitForTimeout(5000);
    const h1Again = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log('  Page heading (retry):', h1Again);

    if (h1Again.includes('Not Available')) {
      console.log('  Departments route is broken. Skipping and recording Roles instead.');
      await menuClick(page, 'Roles & Privileges');
      await page.waitForTimeout(3000);
      await page.locator('table tbody tr').first().waitFor({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await snap(page, 'ch4.png');

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(1500);
  }

  // ═══════ Ch5: Org Chart ═══════
  console.log('\n=== Ch5: Org Chart ===');

  // Try org chart link from current page
  const chartResult = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const chart = links.find(a => (a.getAttribute('href') || '').includes('/org-chart'));
    if (chart) { chart.click(); return chart.getAttribute('href'); }
    return null;
  });

  if (chartResult) {
    console.log(`  Found and clicked: ${chartResult}`);
  } else {
    console.log('  No org-chart link. Navigating directly...');
    await page.goto(`${BASE}/organizations/O-ED5A/org-chart`);
  }
  await page.waitForTimeout(5000);

  const chartH1 = await page.locator('h1').first().textContent().catch(() => '');
  console.log('  Chart heading:', chartH1);

  if (chartH1.includes('Not Available')) {
    console.log('  Trying O-77E0...');
    await page.goto(`${BASE}/organizations/O-77E0/org-chart`);
    await page.waitForTimeout(5000);
    const h1Again = await page.locator('h1').first().textContent().catch(() => '');
    if (h1Again.includes('Not Available')) {
      console.log('  Org chart route also broken. Recording Audit Logs instead.');
      await menuClick(page, 'Audit Logs');
      await page.waitForTimeout(3000);
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await snap(page, 'ch5.png');

  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(1500);
  }

  // ═══════ Ch6: Users ═══════
  console.log('\n=== Ch6: Users ===');
  await menuClick(page, 'Users');
  await page.waitForTimeout(3000);
  await page.locator('table tbody tr').first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await snap(page, 'ch6.png');

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1200);
  }

  // ═══════ Ch7: Security Settings ═══════
  console.log('\n=== Ch7: Security Settings ===');
  await menuClick(page, 'Settings');
  await page.waitForTimeout(3000);

  // Click security link
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const sec = links.find(a => (a.getAttribute('href') || '').includes('/settings/security'));
    if (sec) sec.click();
  });
  await page.waitForTimeout(4000);
  console.log('  URL:', page.url());

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await snap(page, 'ch7.png');

  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(1200);
  }

  // ═══════ Ch8: Dashboard (final) ═══════
  console.log('\n=== Ch8: Dashboard (final) ===');
  // Navigate to / via hamburger — use "View Dashboard" or the first dashboard link
  const hamburger = page.locator('button[title="Toggle sidebar"]').first();
  try {
    await hamburger.waitFor({ state: 'visible', timeout: 3000 });
    await hamburger.click();
    await page.waitForTimeout(1000);
  } catch {}

  const dashClicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const dash = links.find(a => {
      const href = a.getAttribute('href') || '';
      return href === '/' || href === '/dashboard';
    });
    if (dash) { dash.click(); return true; }
    return false;
  });
  if (!dashClicked) {
    await page.goto(`${BASE}/`);
  }
  await page.waitForTimeout(5000);
  await snap(page, 'ch8.png');

  // ── Done ───────────────────────────────────────────────────────────
  console.log('\nClosing context to flush video...');
  await context.close();
  await browser.close();

  console.log('\nRecording complete.');
  console.log(execSync(`ls -lah ${OUT}/*.webm | tail -1`, { encoding: 'utf-8' }));
})();

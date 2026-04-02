/**
 * Zorbit Unified Console — QA Menu Walkthrough Screencast
 *
 * Records a 1920x1080 video walking through every sidebar menu item.
 *
 * Known production bugs worked around:
 *  - Dashboard page crashes (audit API returns objects where strings expected)
 *  - SafeLazy infinite recursion on all lazy-loaded routes
 * Strategy: start on /settings, skip routes that crash, recover gracefully.
 *
 * Usage:  node scripts/menu-walkthrough.mjs
 * Output: scripts/recordings/menu-walkthrough.mp4
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { readdirSync } from 'fs';

const RECORDINGS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts/recordings/';
const LOGIN_URL = 'https://zorbit.scalatics.com/login';
const SAFE_URL = 'https://zorbit.scalatics.com/settings';
const BASE = 'https://zorbit.scalatics.com';
const EMAIL = 's@onezippy.ai';
const PASSWORD = 's@2021#cz';
const PAGE_WAIT = 2500;  // ms to wait per page
const TAB_WAIT = 1200;   // ms to wait per tab click

(async () => {
  console.log('[1/8] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // Suppress page crashes — log but don't abort
  page.on('pageerror', err => {
    // silent — we handle recovery below
  });

  // ── Login ──────────────────────────────────────────────────────────
  console.log('[2/8] Logging in...');
  await page.goto(LOGIN_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Navigate to settings (safe page — avoids dashboard crash)
  console.log('[3/8] Loading safe start page...');
  await page.goto(SAFE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Verify
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  if (rootLen < 100) {
    console.error('FATAL: Page did not render. Aborting.');
    await page.screenshot({ path: RECORDINGS_DIR + 'error-no-render.png' });
    await context.close();
    await browser.close();
    process.exit(1);
  }
  console.log('       Page loaded OK.');

  // ── Open sidebar ──────────────────────────────────────────────────
  console.log('[4/8] Opening sidebar...');
  const hamburger = page.locator('header button').first();
  if (await hamburger.isVisible({ timeout: 3000 })) {
    await hamburger.click();
    await page.waitForTimeout(1500);
  }

  // ── Pin sidebar ───────────────────────────────────────────────────
  console.log('[5/8] Pinning sidebar...');
  const pinBtn = page.locator('button[title="Lock sidebar open"]');
  if (await pinBtn.count() > 0 && await pinBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pinBtn.click();
    await page.waitForTimeout(500);
    console.log('       Pinned.');
  } else {
    console.log('       Already pinned or not found.');
  }

  // ── Expand all ────────────────────────────────────────────────────
  console.log('[6/8] Expanding all sections...');
  const expandBtn = page.locator('button[title="Expand all sections"]');
  if (await expandBtn.count() > 0 && await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expandBtn.click();
    await page.waitForTimeout(1500);
    console.log('       Expanded.');
  }

  // ── Collect menu items ────────────────────────────────────────────
  console.log('[7/8] Walking through every menu item...\n');

  const menuItems = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return [];
    const links = aside.querySelectorAll('nav a[title]');
    return Array.from(links).map(el => ({
      label: el.getAttribute('title') || el.textContent?.trim() || '',
      href: el.getAttribute('href') || '',
    }));
  });

  console.log(`  Total menu items: ${menuItems.length}\n`);

  let visited = 0;
  let crashed = 0;
  const crashedRoutes = [];

  for (const item of menuItems) {
    if (!item.label || !item.href) continue;
    visited++;
    const prefix = `  [${String(visited).padStart(2)}/${menuItems.length}]`;

    try {
      // Navigate directly to the route (more reliable than clicking sidebar links
      // which may have been destroyed by a previous crash)
      await page.goto(`${BASE}${item.href}`, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(PAGE_WAIT);

      // Check if page rendered
      const ok = await page.evaluate(() => (document.getElementById('root')?.innerHTML.length || 0) > 100);
      if (!ok) {
        console.log(`${prefix} ${item.label.padEnd(35)} CRASHED`);
        crashed++;
        crashedRoutes.push(item.href);
        // Recover by going to safe page
        await page.goto(SAFE_URL, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
        continue;
      }

      // Check for tabs
      const tabLabels = await page.evaluate(() => {
        const tabs = document.querySelectorAll('main [role="tab"]');
        return Array.from(tabs).map(t => t.textContent?.trim() || '');
      });

      if (tabLabels.length > 1) {
        console.log(`${prefix} ${item.label.padEnd(35)} OK  [${tabLabels.length} tabs: ${tabLabels.join(', ')}]`);
        // Click each tab
        for (let t = 0; t < tabLabels.length; t++) {
          try {
            const tab = page.locator('main [role="tab"]').nth(t);
            if (await tab.isVisible({ timeout: 800 })) {
              await tab.click();
              await page.waitForTimeout(TAB_WAIT);
            }
          } catch {}
        }
      } else {
        console.log(`${prefix} ${item.label.padEnd(35)} OK`);
      }

    } catch (err) {
      console.log(`${prefix} ${item.label.padEnd(35)} ERROR: ${err.message?.slice(0, 60)}`);
      crashed++;
      crashedRoutes.push(item.href);
      await page.goto(SAFE_URL, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────
  console.log(`\n[8/8] Complete!`);
  console.log(`  Visited: ${visited}`);
  console.log(`  Success: ${visited - crashed}`);
  console.log(`  Crashed: ${crashed}`);
  if (crashedRoutes.length > 0) {
    console.log(`  Crashed routes:`);
    crashedRoutes.forEach(r => console.log(`    - ${r}`));
  }

  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  // ── Convert to MP4 ────────────────────────────────────────────────
  console.log('\nConverting webm to mp4...');
  const webmFiles = readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm')).sort();
  if (webmFiles.length > 0) {
    const latest = webmFiles[webmFiles.length - 1];
    const webmPath = RECORDINGS_DIR + latest;
    const mp4Path = RECORDINGS_DIR + 'menu-walkthrough.mp4';
    try {
      execSync(
        `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 23 -movflags +faststart "${mp4Path}"`,
        { stdio: 'pipe', timeout: 300000 },
      );
      console.log(`  Saved: ${mp4Path}`);
    } catch (e) {
      console.log(`  ffmpeg failed. Raw webm at: ${webmPath}`);
    }
  }
})();

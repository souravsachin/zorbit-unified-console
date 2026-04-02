/**
 * PCG4 Video 1: Product Management Overview
 *
 * REAL browser recording using Playwright recordVideo.
 * Navigates through the PCG4 Guide/Hub page tabs, Configurations,
 * Reference Library, and Coverage Mapper.
 *
 * Usage:  node scripts/pcg4-video1-overview.mjs
 * Output: scripts/recordings/pcg4-overview.webm -> pcg4-overview.mp4
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const SCRIPTS_DIR = '/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts';
const RECORDINGS_DIR = path.join(SCRIPTS_DIR, 'recordings', 'pcg4');
const BASE = 'https://zorbit.scalatics.com';
const EMAIL = 's@onezippy.ai';
const PASSWORD = 's@2021#cz';
const PAGE_WAIT = 3000;
const TAB_WAIT = 2000;
const SCROLL_WAIT = 1500;

if (!existsSync(RECORDINGS_DIR)) mkdirSync(RECORDINGS_DIR, { recursive: true });

(async () => {
  console.log('[1/9] Launching browser with video recording...');
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
  page.on('pageerror', () => {}); // suppress errors

  // ── Login ──────────────────────────────────────────────────────────
  console.log('[2/9] Logging in...');
  await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', EMAIL);
  await page.waitForTimeout(500);
  await page.fill('input[type="password"]', PASSWORD);
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Navigate to a safe page first (avoid dashboard crash)
  console.log('[3/9] Navigating to PCG4 Guide page...');
  await page.goto(`${BASE}/app/pcg4/guide`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);

  // Verify page loaded
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  if (rootLen < 100) {
    console.error('FATAL: Page did not render. Aborting.');
    await page.screenshot({ path: path.join(RECORDINGS_DIR, 'error-overview.png') });
    await context.close();
    await browser.close();
    process.exit(1);
  }
  console.log('       Guide page loaded OK.');

  // ── Open & pin sidebar ─────────────────────────────────────────────
  console.log('[4/9] Opening sidebar...');
  const hamburger = page.locator('header button').first();
  if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(1500);
  }
  const pinBtn = page.locator('button[title="Lock sidebar open"]');
  if (await pinBtn.count() > 0 && await pinBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pinBtn.click();
    await page.waitForTimeout(500);
  }

  // ── Tab 1: Introduction ────────────────────────────────────────────
  console.log('[5/9] Showing Introduction tab...');
  // The Introduction tab should be active by default on the hub page.
  // Look for the tab buttons and click Introduction if available.
  const introTab = page.locator('button:has-text("Introduction")').first();
  if (await introTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await introTab.click();
    await page.waitForTimeout(TAB_WAIT);
  }
  // Scroll down to show capabilities
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 400, behavior: 'smooth' });
  });
  await page.waitForTimeout(SCROLL_WAIT);
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 800, behavior: 'smooth' });
  });
  await page.waitForTimeout(SCROLL_WAIT);
  // Scroll back up
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1000);

  // ── Tab 2: Presentation ────────────────────────────────────────────
  console.log('[6/9] Showing Presentation tab...');
  const presTab = page.locator('button:has-text("Presentation")').first();
  if (await presTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await presTab.click();
    await page.waitForTimeout(TAB_WAIT);
  }
  // Click through slides (next button)
  for (let i = 0; i < 7; i++) {
    const nextBtn = page.locator('button[aria-label="Next slide"], button:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(2500); // Linger on each slide
    }
  }

  // ── Tab 3: Lifecycle ───────────────────────────────────────────────
  console.log('[7/9] Showing Lifecycle tab...');
  const lifecycleTab = page.locator('button:has-text("Lifecycle")').first();
  if (await lifecycleTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lifecycleTab.click();
    await page.waitForTimeout(TAB_WAIT);
    // Scroll through lifecycle stages
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo({ top: 400, behavior: 'smooth' });
    });
    await page.waitForTimeout(SCROLL_WAIT);
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
  }

  // ── Navigate to Configurations page ────────────────────────────────
  console.log('[8/9] Navigating to Configurations page...');
  await page.goto(`${BASE}/app/pcg4/configurations`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);
  // Scroll to show configuration cards
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 400, behavior: 'smooth' });
  });
  await page.waitForTimeout(SCROLL_WAIT);
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // ── Navigate to Reference Library ──────────────────────────────────
  console.log('[8b/9] Navigating to Reference Library...');
  await page.goto(`${BASE}/app/pcg4/reference-library`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);
  // Click Organization tab
  const orgTab = page.locator('button:has-text("Organization Library")').first();
  if (await orgTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await orgTab.click();
    await page.waitForTimeout(TAB_WAIT);
  }
  // Click back to Platform tab
  const platTab = page.locator('button:has-text("Platform Library")').first();
  if (await platTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await platTab.click();
    await page.waitForTimeout(TAB_WAIT);
  }

  // ── Navigate to Coverage Mapper ────────────────────────────────────
  console.log('[8c/9] Navigating to Coverage Mapper...');
  await page.goto(`${BASE}/app/pcg4/coverage-mapper`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);
  // Scroll to show the split pane and legend
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 400, behavior: 'smooth' });
  });
  await page.waitForTimeout(SCROLL_WAIT);
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(2000);

  // ── Wrap up ────────────────────────────────────────────────────────
  console.log('[9/9] Finishing recording...');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  // ── Convert to MP4 ────────────────────────────────────────────────
  console.log('\nConverting webm to mp4...');
  const webmFiles = readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm')).sort();
  if (webmFiles.length > 0) {
    const latest = webmFiles[webmFiles.length - 1];
    const webmPath = path.join(RECORDINGS_DIR, latest);
    const mp4Path = path.join(RECORDINGS_DIR, 'pcg4-overview-raw.mp4');
    try {
      execSync(
        `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 23 -movflags +faststart "${mp4Path}"`,
        { stdio: 'pipe', timeout: 300000 },
      );
      console.log(`  Saved raw video: ${mp4Path}`);
    } catch (e) {
      console.log(`  ffmpeg failed. Raw webm at: ${webmPath}`);
    }
  }
})();

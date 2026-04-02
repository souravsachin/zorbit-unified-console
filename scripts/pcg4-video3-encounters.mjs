/**
 * PCG4 Video 3: Encounter Taxonomy
 *
 * REAL browser recording using Playwright recordVideo.
 * Navigates to Coverage Mapper, Encounters admin page, and shows
 * the encounter taxonomy across different categories.
 *
 * Usage:  node scripts/pcg4-video3-encounters.mjs
 * Output: scripts/recordings/pcg4/pcg4-encounters-raw.mp4
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
const SCROLL_WAIT = 1500;

if (!existsSync(RECORDINGS_DIR)) mkdirSync(RECORDINGS_DIR, { recursive: true });

(async () => {
  console.log('[1/8] Launching browser with video recording...');
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
  page.on('pageerror', () => {});

  // ── Login ──────────────────────────────────────────────────────────
  console.log('[2/8] Logging in...');
  await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', EMAIL);
  await page.waitForTimeout(500);
  await page.fill('input[type="password"]', PASSWORD);
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // ── Coverage Mapper ────────────────────────────────────────────────
  console.log('[3/8] Navigating to Coverage Mapper...');
  await page.goto(`${BASE}/app/pcg4/coverage-mapper`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);

  // Verify page loaded
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  if (rootLen < 100) {
    console.error('FATAL: Page did not render. Aborting.');
    await context.close();
    await browser.close();
    process.exit(1);
  }
  console.log('       Coverage Mapper loaded.');

  // Open sidebar
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

  // Show the split pane layout
  await page.waitForTimeout(2000);
  // Scroll to reveal legend and coverage mapping
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
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // ── Encounters Admin page ──────────────────────────────────────────
  console.log('[4/8] Navigating to Encounters (Admin) page...');
  await page.goto(`${BASE}/app/pcg4/encounters`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);
  // Scroll to show taxonomy cards
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

  // ── PCG4 Guide page — Presentation slide 4 (Encounters) ───────────
  console.log('[5/8] Navigating to Guide page — Encounters slide...');
  await page.goto(`${BASE}/app/pcg4/guide`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);

  // Click Presentation tab
  const presTab = page.locator('button:has-text("Presentation")').first();
  if (await presTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await presTab.click();
    await page.waitForTimeout(2000);
  }
  // Navigate to slide 4 (Encounter Type Taxonomy)
  for (let i = 0; i < 3; i++) {
    const nextBtn = page.locator('button[aria-label="Next slide"], button:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(2500);
    }
  }
  // Linger on encounters slide
  await page.waitForTimeout(3000);

  // ── New config wizard — Step 5 (Encounter Config) ──────────────────
  console.log('[6/8] Opening wizard at Encounters step...');
  await page.goto(`${BASE}/app/pcg4/configurations/new`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);

  // Try to navigate to step 5 (Encounters)
  const encStep = page.locator('button:has-text("Encounters"), [role="tab"]:has-text("Encounters")').first();
  if (await encStep.isVisible({ timeout: 3000 }).catch(() => false)) {
    await encStep.click();
    await page.waitForTimeout(3000);
  }
  // Scroll to show encounter selection
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
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1000);

  // ── Step 6 (Benefits) — related to encounters ──────────────────────
  console.log('[7/8] Navigating to Benefits step...');
  const benStep = page.locator('button:has-text("Benefits"), [role="tab"]:has-text("Benefits")').first();
  if (await benStep.isVisible({ timeout: 3000 }).catch(() => false)) {
    await benStep.click();
    await page.waitForTimeout(3000);
  }
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

  // ── Wrap up ────────────────────────────────────────────────────────
  console.log('[8/8] Finishing recording...');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  // ── Convert to MP4 ────────────────────────────────────────────────
  console.log('\nConverting webm to mp4...');
  const webmFiles = readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm')).sort();
  if (webmFiles.length > 0) {
    const latest = webmFiles[webmFiles.length - 1];
    const webmPath = path.join(RECORDINGS_DIR, latest);
    const mp4Path = path.join(RECORDINGS_DIR, 'pcg4-encounters-raw.mp4');
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

/**
 * PCG4 Video 2: Configuration Deep-Dive
 *
 * REAL browser recording using Playwright recordVideo.
 * Navigates to Configurations page, opens a configuration (or creates new),
 * walks through the 8-step wizard tabs.
 *
 * Usage:  node scripts/pcg4-video2-deep-dive.mjs
 * Output: scripts/recordings/pcg4/pcg4-deep-dive-raw.mp4
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
const STEP_WAIT = 3500;

if (!existsSync(RECORDINGS_DIR)) mkdirSync(RECORDINGS_DIR, { recursive: true });

(async () => {
  console.log('[1/7] Launching browser with video recording...');
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
  console.log('[2/7] Logging in...');
  await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', EMAIL);
  await page.waitForTimeout(500);
  await page.fill('input[type="password"]', PASSWORD);
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // ── Configurations page ────────────────────────────────────────────
  console.log('[3/7] Navigating to Configurations page...');
  await page.goto(`${BASE}/app/pcg4/configurations`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);

  // Verify page loaded
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  if (rootLen < 100) {
    console.error('FATAL: Page did not render. Aborting.');
    await context.close();
    await browser.close();
    process.exit(1);
  }
  console.log('       Configurations page loaded.');

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

  // Show existing configurations
  await page.waitForTimeout(2000);
  // Scroll to see cards
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 300, behavior: 'smooth' });
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1000);

  // ── Try to click on an existing configuration card ─────────────────
  console.log('[4/7] Looking for existing configurations...');
  // Look for clickable config cards
  const configCards = page.locator('main .card, main [class*="cursor-pointer"]');
  const cardCount = await configCards.count();
  console.log(`       Found ${cardCount} potential config cards.`);

  let configOpened = false;
  if (cardCount > 0) {
    try {
      await configCards.first().click();
      await page.waitForTimeout(PAGE_WAIT);
      configOpened = true;
      console.log('       Opened existing configuration.');
    } catch {
      console.log('       Could not click config card.');
    }
  }

  // If no config opened, navigate to new configuration
  if (!configOpened) {
    console.log('[4b/7] Creating new configuration...');
    await page.goto(`${BASE}/app/pcg4/configurations/new`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(PAGE_WAIT);
    console.log('       New configuration wizard loaded.');
  }

  // ── Walk through the 8 wizard steps ────────────────────────────────
  console.log('[5/7] Walking through 8-step wizard...');

  const stepNames = [
    'Insurer Details',
    'Product Details',
    'Create Plans',
    'Base Config',
    'Encounters',
    'Benefits',
    'Overrides',
    'Review & Publish',
  ];

  for (let i = 0; i < stepNames.length; i++) {
    const stepName = stepNames[i];
    console.log(`       Step ${i + 1}: ${stepName}`);

    // Try clicking the step in the stepper nav
    const stepBtn = page.locator(`button:has-text("${stepName}"), [role="tab"]:has-text("${stepName}")`).first();
    if (await stepBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stepBtn.click();
      await page.waitForTimeout(STEP_WAIT);
    } else {
      // Try clicking a step by its number in the stepper
      // The ZorbitStepper uses numbered circles — try clicking the (i+1)th step indicator
      const stepIndicators = page.locator('[class*="stepper"] button, [class*="step"] button');
      if (await stepIndicators.count() > i) {
        try {
          await stepIndicators.nth(i).click();
          await page.waitForTimeout(STEP_WAIT);
        } catch {}
      }
    }

    // Scroll down to show step content
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo({ top: 300, behavior: 'smooth' });
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
  }

  // ── Back to configurations list ────────────────────────────────────
  console.log('[6/7] Returning to configurations list...');
  await page.goto(`${BASE}/app/pcg4/configurations`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(PAGE_WAIT);

  // ── Wrap up ────────────────────────────────────────────────────────
  console.log('[7/7] Finishing recording...');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  // ── Convert to MP4 ────────────────────────────────────────────────
  console.log('\nConverting webm to mp4...');
  const webmFiles = readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm')).sort();
  if (webmFiles.length > 0) {
    const latest = webmFiles[webmFiles.length - 1];
    const webmPath = path.join(RECORDINGS_DIR, latest);
    const mp4Path = path.join(RECORDINGS_DIR, 'pcg4-deep-dive-raw.mp4');
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

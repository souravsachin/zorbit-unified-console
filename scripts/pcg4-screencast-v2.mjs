import { chromium } from 'playwright';

(async () => {
  console.log('Starting PCG4 screencast recording...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './scripts/recordings/pcg4/playwright/',
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto('https://zorbit.scalatics.com/login');
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Clear cache
  await page.evaluate(() => sessionStorage.clear());

  // Navigate to PCG4 Guide directly
  console.log('PCG4 Guide...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/guide');
  await page.waitForTimeout(4000);

  // Click Presentation tab
  const presTab = page.locator('button:has-text("Presentation"), [role="tab"]:has-text("Presentation")');
  if (await presTab.count() > 0) {
    await presTab.first().click();
    await page.waitForTimeout(3000);
  }

  // Click Lifecycle tab
  const lifeTab = page.locator('button:has-text("Lifecycle"), [role="tab"]:has-text("Lifecycle")');
  if (await lifeTab.count() > 0) {
    await lifeTab.first().click();
    await page.waitForTimeout(3000);
  }

  // Navigate to Configurations
  console.log('Configurations...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/configurations');
  await page.waitForTimeout(4000);

  // Navigate to Reference Library
  console.log('Reference Library...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/reference-library');
  await page.waitForTimeout(4000);

  // Navigate to Coverage Mapper
  console.log('Coverage Mapper...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/coverage-mapper');
  await page.waitForTimeout(4000);

  // Navigate to Setup
  console.log('Setup...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/setup');
  await page.waitForTimeout(3000);

  // Navigate to Deployments
  console.log('Deployments...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/deployments');
  await page.waitForTimeout(3000);

  // Back to Guide - Video Tutorials tab
  console.log('Video Tutorials...');
  await page.goto('https://zorbit.scalatics.com/O/O-OZPY/app/pcg4/guide');
  await page.waitForTimeout(3000);
  const vidTab = page.locator('button:has-text("Video"), [role="tab"]:has-text("Video")');
  if (await vidTab.count() > 0) {
    await vidTab.first().click();
    await page.waitForTimeout(3000);
  }

  // Resources tab
  const resTab = page.locator('button:has-text("Resources"), [role="tab"]:has-text("Resources")');
  if (await resTab.count() > 0) {
    await resTab.first().click();
    await page.waitForTimeout(3000);
  }

  console.log('Recording complete. Closing...');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();
  console.log('Done! Check scripts/recordings/pcg4/playwright/');
})();

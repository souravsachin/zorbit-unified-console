import { chromium } from 'playwright';

(async () => {
  console.log('Starting AWNIC product screencast...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './scripts/recordings/awnic/',
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
  await page.evaluate(() => sessionStorage.clear());

  // Navigate to PCG4 Configurations
  console.log('PCG4 Configurations...');
  await page.goto('https://zorbit.scalatics.com/app/pcg4/configurations');
  await page.waitForTimeout(4000);

  // Click AWNIC NAS Dubai
  console.log('AWNIC Dubai...');
  const dxbLink = page.locator('text=AWNIC NAS Dubai').first();
  if (await dxbLink.count() > 0) {
    await dxbLink.click();
    await page.waitForTimeout(4000);
    
    // Click through each stepper step
    for (let step = 0; step < 8; step++) {
      const stepBtn = page.locator(`[data-step="${step}"], button:has-text("${step + 1}")`).first();
      if (await stepBtn.count() > 0) {
        try { await stepBtn.click({ timeout: 3000 }); } catch(e) {}
        await page.waitForTimeout(2000);
      }
    }
  }

  // Go back to configurations
  console.log('Back to configs...');
  await page.goto('https://zorbit.scalatics.com/app/pcg4/configurations');
  await page.waitForTimeout(3000);

  // Click AWNIC NAS Abu Dhabi
  console.log('AWNIC Abu Dhabi...');
  const auhLink = page.locator('text=AWNIC NAS Abu Dhabi').first();
  if (await auhLink.count() > 0) {
    await auhLink.click();
    await page.waitForTimeout(4000);
  }

  // Navigate to Product Pricing Rate Tables
  console.log('Product Pricing...');
  await page.goto('https://zorbit.scalatics.com/product-pricing/rate-tables');
  await page.waitForTimeout(4000);

  // Click first rate table
  const rateCard = page.locator('text=AWNIC').first();
  if (await rateCard.count() > 0) {
    await rateCard.click();
    await page.waitForTimeout(3000);
  }

  // Do a premium calculation
  console.log('Premium calculation...');
  const calcBtn = page.locator('button:has-text("Calculate")').first();
  if (await calcBtn.count() > 0) {
    await calcBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log('Recording complete.');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();
  console.log('Done!');
})();

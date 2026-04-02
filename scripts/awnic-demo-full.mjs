import { chromium } from 'playwright';

(async () => {
  console.log('Starting comprehensive AWNIC demo...');
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
  console.log('Login...');
  await page.goto('https://zorbit.scalatics.com/login');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.evaluate(() => sessionStorage.clear());

  // PCG4 Configurations
  console.log('Configurations list...');
  await page.goto('https://zorbit.scalatics.com/app/pcg4/configurations');
  await page.waitForTimeout(4000);

  // Click AWNIC Dubai
  console.log('Dubai config...');
  try {
    await page.locator('text=AWNIC NAS Dubai').first().click({ timeout: 5000 });
    await page.waitForTimeout(4000);
    
    // Click through steps - try clicking step numbers in stepper
    for (let i = 2; i <= 5; i++) {
      try {
        const stepBtns = page.locator('button').filter({ hasText: String(i) });
        if (await stepBtns.count() > 0) {
          await stepBtns.first().click({ timeout: 2000 });
          await page.waitForTimeout(2000);
        }
      } catch(e) {}
    }
  } catch(e) { console.log('Could not click Dubai config'); }

  // Back and click Abu Dhabi
  console.log('Abu Dhabi config...');
  await page.goto('https://zorbit.scalatics.com/app/pcg4/configurations');
  await page.waitForTimeout(3000);
  try {
    await page.locator('text=AWNIC NAS Abu Dhabi').first().click({ timeout: 5000 });
    await page.waitForTimeout(4000);
  } catch(e) { console.log('Could not click AUH config'); }

  // Product Pricing - Rate Tables
  console.log('Rate Tables...');
  await page.goto('https://zorbit.scalatics.com/product-pricing/rate-tables');
  await page.waitForTimeout(4000);

  // Click first rate table card
  try {
    await page.locator('text=AWNIC').first().click({ timeout: 3000 });
    await page.waitForTimeout(3000);
    
    // Click Calculate button
    const calcBtn = page.locator('button:has-text("Calculate")');
    if (await calcBtn.count() > 0) {
      await calcBtn.first().click();
      await page.waitForTimeout(3000);
    }
  } catch(e) { console.log('Rate table interaction failed'); }

  // Scroll down to see rate grid
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(3000);

  console.log('Done!');
  await context.close();
  await browser.close();
})();

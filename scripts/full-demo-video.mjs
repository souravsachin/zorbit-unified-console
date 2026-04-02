import { chromium } from 'playwright';

(async () => {
  console.log('Starting full demo video recording...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './scripts/recordings/full-demo/',
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();

  // === Chapter 1: Login ===
  console.log('Ch1: Login...');
  await page.goto('https://zorbit.scalatics.com/login');
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(4000);

  // === Chapter 2: Dashboard ===
  console.log('Ch2: Dashboard...');
  await page.goto('https://zorbit.scalatics.com/dashboard');
  await page.waitForTimeout(4000);

  // === Chapter 3: Identity — Users ===
  console.log('Ch3: Users...');
  await page.goto('https://zorbit.scalatics.com/users');
  await page.waitForTimeout(4000);

  // === Chapter 4: Organizations ===
  console.log('Ch4: Organizations...');
  await page.goto('https://zorbit.scalatics.com/organizations');
  await page.waitForTimeout(4000);

  // === Chapter 5: PCG4 Configurations ===
  console.log('Ch5: PCG4 Configurations...');
  await page.goto('https://zorbit.scalatics.com/app/pcg4/configurations');
  await page.waitForTimeout(4000);
  
  // Click AWNIC Dubai
  try {
    const row = page.locator('tr:has-text("AWNIC"), [class*="cursor"]:has-text("AWNIC")').first();
    if (await row.count() > 0) {
      await row.click({ timeout: 3000 });
      await page.waitForTimeout(4000);
    }
  } catch(e) {}

  // === Chapter 6: Product Pricing ===
  console.log('Ch6: Rate Tables...');
  await page.goto('https://zorbit.scalatics.com/product-pricing/rate-tables');
  await page.waitForTimeout(4000);
  
  // Click first rate table
  try {
    await page.locator('text=AWNIC').first().click({ timeout: 3000 });
    await page.waitForTimeout(3000);
    // Calculate premium
    await page.locator('button:has-text("Calculate")').first().click({ timeout: 3000 });
    await page.waitForTimeout(3000);
  } catch(e) {}

  // === Chapter 7: HI Quotation ===
  console.log('Ch7: HI Quotation...');
  await page.goto('https://zorbit.scalatics.com/hi-quotation');
  await page.waitForTimeout(4000);

  // Click New Application
  try {
    await page.locator('button:has-text("New Application"), a:has-text("New Application")').first().click({ timeout: 3000 });
    await page.waitForTimeout(4000);
  } catch(e) {
    await page.goto('https://zorbit.scalatics.com/hi-quotation/new');
    await page.waitForTimeout(4000);
  }

  // === Chapter 8: Application Form ===
  console.log('Ch8: Application Form...');
  await page.goto('https://zorbit.scalatics.com/hi-quotation/new/uae');
  await page.waitForTimeout(5000);
  // Scroll through form
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(2000);

  // === Chapter 9: UW Workflow ===
  console.log('Ch9: UW Workflow...');
  await page.goto('https://zorbit.scalatics.com/uw-workflow');
  await page.waitForTimeout(4000);

  // === Chapter 10: HI Decisioning ===
  console.log('Ch10: Decisioning...');
  await page.goto('https://zorbit.scalatics.com/hi-decisioning');
  await page.waitForTimeout(4000);

  // === Chapter 11: Form Builder ===
  console.log('Ch11: Form Builder...');
  await page.goto('https://zorbit.scalatics.com/form-builder/templates');
  await page.waitForTimeout(4000);

  // === Chapter 12: Support Center ===
  console.log('Ch12: Support...');
  await page.goto('https://zorbit.scalatics.com/support-center');
  await page.waitForTimeout(3000);

  console.log('Recording complete!');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();
  console.log('Done!');
})();

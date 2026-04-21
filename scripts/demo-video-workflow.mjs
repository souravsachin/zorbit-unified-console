import { chromium } from 'playwright';
import { execSync } from 'child_process';

// Get MFA secret from DB
function getMfaSecret() {
  try {
    const result = execSync(
      `ssh ilri-arm-uat 'docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c "SELECT mfa_secret FROM users WHERE \\"hashId\\" = '"'"'U-0113'"'"'"'`,
      { encoding: 'utf-8' }
    ).trim();
    return result;
  } catch (e) {
    console.error('Failed to get MFA secret:', e.message);
    return null;
  }
}

// Generate TOTP code on server using otplib
function generateTotp(secret) {
  try {
    const result = execSync(
      `ssh ilri-arm-uat "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
      { encoding: 'utf-8' }
    ).trim();
    return result;
  } catch (e) {
    console.error('Failed to generate TOTP:', e.message);
    return null;
  }
}

const BASE = 'https://zorbit.scalatics.com';

async function smoothScroll(page, distance = 300, steps = 5) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance / steps);
    await page.waitForTimeout(200);
  }
}

async function typeSlowly(page, selector, text, delay = 60) {
  await page.click(selector);
  await page.waitForTimeout(200);
  await page.type(selector, text, { delay });
}

(async () => {
  console.log('\n=== Zorbit Platform — End-User Workflow Demo ===\n');

  // Get MFA credentials
  console.log('Getting MFA secret...');
  const mfaSecret = getMfaSecret();
  if (!mfaSecret) {
    console.error('Cannot proceed without MFA secret');
    process.exit(1);
  }
  console.log('MFA secret retrieved.\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './scripts/recordings/workflow-demo/',
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();

  // ============================================================
  // CHAPTER 1: Login with MFA (~25s)
  // ============================================================
  console.log('CH1: Login & MFA...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);

  // Type credentials with visible animation
  await typeSlowly(page, 'input[type="email"]', 's@onezippy.ai', 50);
  await page.waitForTimeout(500);
  await typeSlowly(page, 'input[type="password"]', 's@2021#cz', 40);
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // MFA screen — generate and enter TOTP
  console.log('  Entering MFA code...');
  const totpCode = generateTotp(mfaSecret);
  if (!totpCode) {
    console.error('Failed to generate TOTP code');
    process.exit(1);
  }
  // Type TOTP code digit by digit
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 5000 });
  await mfaInput.click();
  await mfaInput.type(totpCode, { delay: 120 });
  await page.waitForTimeout(800);
  // Click Verify button
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(4000);

  // Clear menu cache for fresh sidebar
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(3000);

  // ============================================================
  // CHAPTER 2: Product Configuration — PCG4 (~60s)
  // ============================================================
  console.log('CH2: Product Configuration...');
  await page.goto(`${BASE}/app/pcg4/configurations`);
  await page.waitForTimeout(3000);

  // Show configurations list
  await page.waitForTimeout(2000);

  // Click AWNIC Dubai configuration
  try {
    const configCard = page.locator('text=AWNIC').first();
    if (await configCard.count() > 0) {
      await configCard.click({ timeout: 3000 });
      await page.waitForTimeout(3000);

      // Walk through stepper steps
      const steps = ['Insurer Details', 'Product Details', 'Create Plans', 'Base Config',
                     'Encounters', 'Benefits', 'Overrides', 'Review'];
      for (let i = 0; i < 8; i++) {
        console.log(`  Step ${i + 1}: ${steps[i]}`);
        try {
          // Click the step in the stepper
          const stepButton = page.locator(`[class*="stepper"] >> text="${steps[i]}"`).first();
          if (await stepButton.count() > 0) {
            await stepButton.click({ timeout: 2000 });
          } else {
            // Try clicking by step number
            const stepNum = page.locator(`text="${i + 1}"`).first();
            if (await stepNum.count() > 0) await stepNum.click({ timeout: 1000 });
          }
        } catch (e) {}
        await page.waitForTimeout(2500);
        // Scroll to show content
        await smoothScroll(page, 300, 3);
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await page.waitForTimeout(500);
      }
    }
  } catch (e) {
    console.log('  (Could not navigate config steps)');
  }

  // ============================================================
  // CHAPTER 3: Product Pricing — Rate Tables (~30s)
  // ============================================================
  console.log('CH3: Product Pricing...');
  await page.goto(`${BASE}/product-pricing/rate-tables`);
  await page.waitForTimeout(3000);

  // Click first rate table
  try {
    await page.locator('text=AWNIC').first().click({ timeout: 3000 });
    await page.waitForTimeout(3000);

    // Scroll through rate grid
    await smoothScroll(page, 400, 4);
    await page.waitForTimeout(2000);

    // Use premium calculator if visible
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
      const calcBtn = page.locator('button:has-text("Calculate"), button:has-text("Lookup")').first();
      if (await calcBtn.count() > 0) {
        await calcBtn.click({ timeout: 2000 });
        await page.waitForTimeout(3000);
      }
    } catch (e) {}
  } catch (e) {
    console.log('  (Could not open rate table)');
  }

  // ============================================================
  // CHAPTER 4: Health Insurance Quotation (~30s)
  // ============================================================
  console.log('CH4: HI Quotation...');
  await page.goto(`${BASE}/hi-quotation`);
  await page.waitForTimeout(3000);

  // Show applications list
  await smoothScroll(page, 300, 3);
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  // Click into an application if available
  try {
    const appRow = page.locator('tr, [class*="cursor-pointer"]').nth(1);
    if (await appRow.count() > 0) {
      await appRow.click({ timeout: 2000 });
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300, 3);
      await page.waitForTimeout(2000);
    }
  } catch (e) {}

  // ============================================================
  // CHAPTER 5: UW Workflow — Queue Engine (~60s)
  // ============================================================
  console.log('CH5: UW Workflow...');
  await page.goto(`${BASE}/uw-workflow`);
  await page.waitForTimeout(3000);

  // Show dashboard with queue counts
  await page.waitForTimeout(2000);

  // Click into New Quotations L1
  console.log('  Opening New Quotations queue...');
  await page.goto(`${BASE}/uw-workflow/wf/new-quotations-l1`);
  await page.waitForTimeout(3000);

  // Show the queue table
  await page.waitForTimeout(2000);

  // Click first quotation to show detail panel
  try {
    const firstRow = page.locator('tbody tr, [class*="cursor-pointer"]').first();
    if (await firstRow.count() > 0) {
      await firstRow.click({ timeout: 3000 });
      await page.waitForTimeout(4000);
      // Scroll detail panel
      await smoothScroll(page, 300, 3);
      await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.log('  (Could not open detail panel)');
  }

  // Close detail and switch to STP Approved queue
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  console.log('  Switching to STP Approved...');
  await page.goto(`${BASE}/uw-workflow/wf/stp-approved`);
  await page.waitForTimeout(3000);

  // Switch to Approved queue
  console.log('  Switching to Approved...');
  await page.goto(`${BASE}/uw-workflow/wf/approved`);
  await page.waitForTimeout(3000);

  // Switch to All Quotations
  console.log('  Showing All Quotations...');
  await page.goto(`${BASE}/uw-workflow/wf/all-quotations`);
  await page.waitForTimeout(3000);
  await smoothScroll(page, 300, 3);
  await page.waitForTimeout(2000);

  // ============================================================
  // CHAPTER 6: UW Decisioning — Rules Engine (~45s)
  // ============================================================
  console.log('CH6: Decisioning Engine...');
  await page.goto(`${BASE}/hi-decisioning`);
  await page.waitForTimeout(3000);

  // Navigate to Rules
  await page.goto(`${BASE}/hi-decisioning/rules`);
  await page.waitForTimeout(3000);

  // Expand a rule
  try {
    const ruleRow = page.locator('text=Diabetes').first();
    if (await ruleRow.count() > 0) {
      await ruleRow.click({ timeout: 2000 });
      await page.waitForTimeout(3000);
    }
  } catch (e) {}

  // Scroll to show more rules
  await smoothScroll(page, 400, 4);
  await page.waitForTimeout(2000);

  // Loading Tables
  console.log('  Loading Tables...');
  await page.goto(`${BASE}/hi-decisioning/loading-tables`);
  await page.waitForTimeout(3000);
  await smoothScroll(page, 300, 3);
  await page.waitForTimeout(2000);

  // STP Criteria
  console.log('  STP Criteria...');
  await page.goto(`${BASE}/hi-decisioning/stp-criteria`);
  await page.waitForTimeout(3000);

  // Evaluations
  console.log('  Evaluations...');
  await page.goto(`${BASE}/hi-decisioning/evaluations`);
  await page.waitForTimeout(3000);

  // Expand an evaluation
  try {
    const evalRow = page.locator('tr, [class*="cursor"]').nth(1);
    if (await evalRow.count() > 0) {
      await evalRow.click({ timeout: 2000 });
      await page.waitForTimeout(3000);
    }
  } catch (e) {}

  // ============================================================
  // CHAPTER 7: Closing — Return to Dashboard (~10s)
  // ============================================================
  console.log('CH7: Closing...');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForTimeout(5000);

  // Done
  console.log('\nRecording complete! Closing browser...');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  console.log('Video saved to scripts/recordings/workflow-demo/');
  console.log('Done!\n');
})();

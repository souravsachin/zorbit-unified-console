import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const BASE = 'https://zorbit.scalatics.com';

function getMfaSecret() {
  return execSync(
    `ssh sovpn "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`,
    { encoding: 'utf-8' }
  ).trim();
}

function generateTotp(secret) {
  return execSync(
    `ssh sovpn "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
    { encoding: 'utf-8' }
  ).trim();
}

async function typeSlowly(page, selector, text, delay = 50) {
  await page.click(selector);
  await page.waitForTimeout(200);
  await page.type(selector, text, { delay });
}

async function smoothScroll(page, distance = 300) {
  await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance);
  await page.waitForTimeout(600);
}

async function recordStep(stepName, recordFn) {
  const dir = `./scripts/recordings/steps/${stepName}`;
  mkdirSync(dir, { recursive: true });

  console.log(`\n=== Recording: ${stepName} ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  try {
    await recordFn(page, context);
  } catch (e) {
    console.error(`  Error in ${stepName}:`, e.message);
  }

  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();
  console.log(`  Saved to ${dir}/`);
}

// Helper: login with MFA
async function loginWithMfa(page, email, password, mfaSecret) {
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  await typeSlowly(page, 'input[type="email"]', email);
  await typeSlowly(page, 'input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  if (mfaSecret) {
    const code = generateTotp(mfaSecret);
    const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
    await mfaInput.waitFor({ timeout: 5000 });
    await mfaInput.click();
    await mfaInput.type(code, { delay: 100 });
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Verify")').first().click();
    await page.waitForTimeout(3000);
  } else {
    await page.waitForTimeout(3000);
  }

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(2000);
}

// ================================================================
// Main
// ================================================================
(async () => {
  console.log('Getting MFA secret...');
  const mfaSecret = getMfaSecret();
  const STEP = process.argv[2] || 'all';

  const steps = {
    // Step 1: Logout
    'step-01-logout': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.waitForTimeout(2000);
      // Click logout button
      const logoutBtn = page.locator('button[title*="Logout"], [class*="logout"], svg[class*="log-out"]').first();
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
      } else {
        await page.locator('button:has-text("Log"), [aria-label*="logout"]').first().click().catch(() => {});
      }
      await page.waitForTimeout(3000);
    },

    // Step 2: Login (show Security MFA in settings)
    'step-02-login-mfa-settings': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/settings`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
    },

    // Step 3: Enable MFA
    'step-03-enable-mfa': async (page) => {
      // Login as a demo user without MFA
      await page.goto(`${BASE}/login`);
      await page.waitForTimeout(2000);
      await typeSlowly(page, 'input[type="email"]', 'mariam.shamsi@awnic-demo.ae');
      await typeSlowly(page, 'input[type="password"]', 'Zorbit@2026!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      await page.waitForTimeout(2000);
      // Navigate to security settings
      await page.goto(`${BASE}/settings/security`);
      await page.waitForTimeout(3000);
      // Click Enable
      try {
        await page.locator('button:has-text("Enable")').first().click({ timeout: 3000 });
        await page.waitForTimeout(4000);
        // Show QR code
        await smoothScroll(page, 400);
        await page.waitForTimeout(3000);
      } catch (e) {}
    },

    // Step 4: Login with MFA
    'step-04-login-with-mfa': async (page) => {
      await page.goto(`${BASE}/login`);
      await page.waitForTimeout(2000);
      await typeSlowly(page, 'input[type="email"]', 's@onezippy.ai');
      await typeSlowly(page, 'input[type="password"]', 's@2021#cz');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2500);
      // Show MFA screen
      const code = generateTotp(mfaSecret);
      const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
      await mfaInput.waitFor({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await mfaInput.click();
      await mfaInput.type(code, { delay: 150 });
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Verify")').first().click();
      await page.waitForTimeout(4000);
    },

    // Step 5: Create Organization
    'step-05-create-org': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/organizations`);
      await page.waitForTimeout(3000);
      // Show existing orgs
      await page.waitForTimeout(2000);
      // Click Add Organization
      try {
        await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first().click({ timeout: 3000 });
        await page.waitForTimeout(2000);
      } catch (e) {}
    },

    // Step 6: Create Users with Roles
    'step-06-create-users-roles': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      // Show roles page
      await page.goto(`${BASE}/roles`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
      // Show users page
      await page.goto(`${BASE}/users`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
    },

    // Step 7: Configure Product (PCG4)
    'step-07-product-config': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/app/pcg4/configurations`);
      await page.waitForTimeout(3000);
      // Click AWNIC config
      try {
        await page.locator('text=AWNIC').first().click({ timeout: 3000 });
        await page.waitForTimeout(3000);
        // Walk through steps
        for (let i = 0; i < 4; i++) {
          await smoothScroll(page, 300);
          await page.waitForTimeout(1500);
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
          await page.waitForTimeout(500);
        }
      } catch (e) {}
    },

    // Step 8: Configure Rater (Rate Tables)
    'step-08-rate-tables': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/product-pricing/rate-tables`);
      await page.waitForTimeout(3000);
      try {
        await page.locator('text=AWNIC').first().click({ timeout: 3000 });
        await page.waitForTimeout(3000);
        await smoothScroll(page, 400);
        await page.waitForTimeout(2000);
        await smoothScroll(page, 400);
        await page.waitForTimeout(2000);
      } catch (e) {}
    },

    // Step 9: Create HI Quotation
    'step-09-hi-quotation': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/hi-quotation`);
      await page.waitForTimeout(3000);
      // Show list
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
      // Click New Application
      await page.goto(`${BASE}/hi-quotation/new`);
      await page.waitForTimeout(3000);
      // Show region selector
      await page.waitForTimeout(2000);
      // Click UAE
      try {
        await page.locator('text=UAE, text=Dubai').first().click({ timeout: 2000 });
        await page.waitForTimeout(3000);
        await smoothScroll(page, 400);
        await page.waitForTimeout(2000);
      } catch (e) {}
    },

    // Step 10: Manual Underwriting
    'step-10-manual-uw': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/uw-workflow`);
      await page.waitForTimeout(3000);
      // Show dashboard
      await page.waitForTimeout(2000);
      // Go to NSTP review queue
      await page.goto(`${BASE}/uw-workflow/wf/nstp-review`);
      await page.waitForTimeout(3000);
      // Click first item
      try {
        await page.locator('tbody tr').first().click({ timeout: 3000 });
        await page.waitForTimeout(4000);
        await smoothScroll(page, 300);
        await page.waitForTimeout(2000);
      } catch (e) {}
    },

    // Step 14: Create STP Rules
    'step-14-stp-rules': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      await page.goto(`${BASE}/hi-decisioning/rules`);
      await page.waitForTimeout(3000);
      // Expand a rule
      try {
        await page.locator('text=Diabetes').first().click({ timeout: 2000 });
        await page.waitForTimeout(3000);
      } catch (e) {}
      await smoothScroll(page, 400);
      await page.waitForTimeout(2000);
      // Show STP criteria
      await page.goto(`${BASE}/hi-decisioning/stp-criteria`);
      await page.waitForTimeout(3000);
    },

    // Step 16: Test STP/NSTP/Manual
    'step-16-queue-testing': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      // Show STP queue
      await page.goto(`${BASE}/uw-workflow/wf/stp-approved`);
      await page.waitForTimeout(3000);
      // Show NSTP queue
      await page.goto(`${BASE}/uw-workflow/wf/nstp-review`);
      await page.waitForTimeout(3000);
      // Show All quotations
      await page.goto(`${BASE}/uw-workflow/wf/all-quotations`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
    },

    // Step 18: Guide Sections
    'step-18-guide-sections': async (page) => {
      await loginWithMfa(page, 's@onezippy.ai', 's@2021#cz', mfaSecret);
      const guides = [
        '/app/pcg4/guide',
        '/product-pricing/guide',
        '/hi-quotation/guide',
        '/uw-workflow/guide',
        '/hi-decisioning/guide',
      ];
      for (const g of guides) {
        await page.goto(`${BASE}${g}`);
        await page.waitForTimeout(2500);
        await smoothScroll(page, 300);
        await page.waitForTimeout(1500);
      }
    },
  };

  if (STEP === 'all') {
    for (const [name, fn] of Object.entries(steps)) {
      await recordStep(name, fn);
    }
  } else if (steps[STEP]) {
    await recordStep(STEP, steps[STEP]);
  } else {
    console.log(`Unknown step: ${STEP}`);
    console.log('Available:', Object.keys(steps).join(', '));
  }

  console.log('\nAll recordings complete!');
})();

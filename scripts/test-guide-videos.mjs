// Test ALL guide/videos pages for "baseUrl is not defined" errors
// Usage: node scripts/test-guide-videos.mjs

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const BASE_URL = 'https://zorbit.scalatics.com';
const LOGIN_URL = `${BASE_URL}/login`;
const EMAIL = 's@onezippy.ai';
const PASSWORD = 's@2021#cz';
const USER_HASH = 'U-0113';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCREENSHOT_DIR = join(__dirname, 'reports', 'guide-videos-test');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

// All guide/videos routes to test
const GUIDE_VIDEO_ROUTES = [
  '/identity/guide/videos',
  '/dashboard/guide/videos',
  '/authorization/guide/videos',
  '/navigation/guide/videos',
  '/messaging/guide/videos',
  '/audit/guide/videos',
  '/pii-vault/guide/videos',
  '/app/pcg4/guide/videos',
  '/product-pricing/guide/videos',
  '/uw-workflow/guide/videos',
  '/hi-decisioning/guide/videos',
  '/hi-quotation/guide/videos',
  '/support-center/guide/videos',
  '/voice-engine/guide/videos',
  '/jayna/guide/videos',
  '/secrets/guide/videos',
  '/workflow-engine/guide/videos',
];

// MFA helpers
function getMfaSecret() {
  try {
    return execSync(
      `ssh ilri-arm-uat "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = '${USER_HASH}'\\""`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
  } catch (e) {
    console.error('Failed to get MFA secret:', e.message);
    process.exit(1);
  }
}

function generateTotp(secret) {
  try {
    return execSync(
      `ssh ilri-arm-uat "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
  } catch (e) {
    console.error('Failed to generate TOTP:', e.message);
    process.exit(1);
  }
}

(async () => {
  console.log('=== Guide/Videos Page Test ===');
  console.log(`Testing ${GUIDE_VIDEO_ROUTES.length} routes\n`);

  // Step 1: Login
  console.log('[1] Getting MFA secret...');
  const mfaSecret = getMfaSecret();
  console.log('    MFA secret retrieved.');

  console.log('[2] Launching browser and logging in...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', () => {});

  await page.goto(LOGIN_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const totpCode = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 10000 });
  await mfaInput.click();
  await mfaInput.type(totpCode, { delay: 80 });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(4000);

  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/mfa')) {
    console.error('FATAL: Login failed. URL:', currentUrl);
    await browser.close();
    process.exit(1);
  }
  console.log('    Logged in. URL:', currentUrl, '\n');

  // Step 2: Test each guide/videos page
  console.log('[3] Testing guide/videos pages...\n');

  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < GUIDE_VIDEO_ROUTES.length; i++) {
    const route = GUIDE_VIDEO_ROUTES[i];
    const idx = `[${String(i + 1).padStart(2)}/${GUIDE_VIDEO_ROUTES.length}]`;
    const fullUrl = `${BASE_URL}${route}`;
    const slug = route.replace(/\//g, '_').replace(/^_/, '');

    let status = 'PASS';
    let errorText = '';
    const issues = [];

    try {
      await page.goto(fullUrl, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Check for "baseUrl is not defined" error text anywhere on page
      const bodyText = await page.locator('body').innerText();

      if (bodyText.includes('baseUrl is not defined')) {
        issues.push('baseUrl is not defined');
      }
      if (bodyText.includes('Page Not Available')) {
        issues.push('Page Not Available');
      }
      if (bodyText.includes('is not defined')) {
        // Catch any other "X is not defined" errors
        const match = bodyText.match(/(\w+ is not defined)/);
        if (match && !issues.includes(match[1])) {
          issues.push(match[1]);
        }
      }
      if (bodyText.includes('Something went wrong')) {
        issues.push('Something went wrong');
      }
      if (bodyText.includes('Error')) {
        // Check for error boundaries
        const errorBoundary = await page.locator('text=/Error/i').count();
        // Only flag if it looks like an error message, not a label
        const errLoc = page.locator('[class*="error"], [class*="Error"], [role="alert"]');
        const errCount = await errLoc.count();
        if (errCount > 0) {
          for (let j = 0; j < errCount; j++) {
            const txt = await errLoc.nth(j).innerText().catch(() => '');
            if (txt && txt.length < 200) {
              issues.push(`Error element: ${txt.trim().substring(0, 100)}`);
            }
          }
        }
      }

      // Check if Videos tab is active/visible
      const videosTab = page.locator('button:has-text("Videos"), [role="tab"]:has-text("Videos"), a:has-text("Videos")');
      const tabCount = await videosTab.count();
      if (tabCount === 0) {
        issues.push('No Videos tab found');
      }

      // Take screenshot
      await page.screenshot({
        path: join(SCREENSHOT_DIR, `${slug}.png`),
        fullPage: false,
      });

      if (issues.length > 0) {
        status = 'FAIL';
        errorText = issues.join('; ');
        failCount++;
      } else {
        passCount++;
      }
    } catch (e) {
      status = 'FAIL';
      errorText = e.message.substring(0, 100);
      failCount++;
      // Try screenshot on error
      try {
        await page.screenshot({
          path: join(SCREENSHOT_DIR, `${slug}-error.png`),
          fullPage: false,
        });
      } catch (_) {}
    }

    results.push({ route, status, issues: errorText });

    const marker = status === 'PASS' ? '+' : 'x';
    const detail = errorText ? ` -> ${errorText}` : '';
    console.log(`  ${idx} ${marker} ${route.padEnd(45)}${detail}`);
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`Results: ${passCount} PASS, ${failCount} FAIL out of ${GUIDE_VIDEO_ROUTES.length}`);
  console.log('='.repeat(70));

  if (failCount > 0) {
    console.log('\nFailed pages:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  x ${r.route} -> ${r.issues}`);
    }
  }

  // Save results JSON
  writeFileSync(
    join(SCREENSHOT_DIR, 'results.json'),
    JSON.stringify({ date: new Date().toISOString(), passCount, failCount, results }, null, 2)
  );
  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`);

  // Return for notification
  const summaryText = failCount === 0
    ? `ALL ${GUIDE_VIDEO_ROUTES.length} guide/video pages PASSED - no baseUrl errors found`
    : `${failCount}/${GUIDE_VIDEO_ROUTES.length} guide/video pages FAILED`;

  console.log(`\n__SUMMARY__:${summaryText}`);

  process.exit(failCount > 0 ? 1 : 0);
})();

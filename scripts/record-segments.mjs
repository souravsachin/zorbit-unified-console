import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const BASE = 'https://zorbit.scalatics.com';

function getMfaSecret() {
  return execSync(
    `ssh ilri-arm-uat "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`,
    { encoding: 'utf-8' }
  ).trim();
}

function generateTotp(secret) {
  return execSync(
    `ssh ilri-arm-uat "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
    { encoding: 'utf-8' }
  ).trim();
}

async function typeAnimated(page, selector, text, delay = 45) {
  await page.click(selector);
  await page.waitForTimeout(150);
  await page.type(selector, text, { delay });
}

async function smoothScroll(page, distance = 300) {
  await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance);
  await page.waitForTimeout(500);
}

// ================================================================
// Login helper — returns logged-in page
// ================================================================
async function loginWithMfa(page, mfaSecret, mode) {
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  await typeAnimated(page, 'input[type="email"]', 's@onezippy.ai');
  await typeAnimated(page, 'input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  const code = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 5000 });
  await mfaInput.click();
  await mfaInput.type(code, { delay: 120 });
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(3500);

  // Clear cache for fresh menu
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(2500);

  // Desktop: pin sidebar
  if (mode === 'desktop') {
    // Click pin button (toggle pin twice to ensure pinned)
    try {
      const pinBtn = page.locator('[title*="Pin"], [title*="pin"], button:has(svg.lucide-lock), button:has(svg.lucide-unlock)').first();
      if (await pinBtn.count() > 0) {
        await pinBtn.click(); await page.waitForTimeout(500);
        await pinBtn.click(); await page.waitForTimeout(500);
        await pinBtn.click(); await page.waitForTimeout(500);
      }
    } catch (e) {}
    await page.waitForTimeout(1000);
  }
}

// Mobile: open hamburger, click item, close
async function mobileNavTo(page, route, menuText) {
  // Open hamburger
  try {
    const hamburger = page.locator('button:has(svg.lucide-panel-left-open), button:has(svg.lucide-menu), [aria-label*="menu"]').first();
    if (await hamburger.count() > 0) {
      await hamburger.click();
      await page.waitForTimeout(800);
    }
  } catch (e) {}

  if (menuText) {
    try {
      await page.locator(`text="${menuText}"`).first().click({ timeout: 2000 });
      await page.waitForTimeout(1500);
    } catch (e) {
      await page.goto(`${BASE}${route}`);
      await page.waitForTimeout(2000);
    }
  } else {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(2000);
  }
}

// ================================================================
// Record a segment
// ================================================================
async function recordSegment(name, mode, mfaSecret, recordFn) {
  const viewport = mode === 'desktop'
    ? { width: 1920, height: 1080 }
    : { width: 390, height: 844 };

  const dir = `./scripts/recordings/segments/${mode}/${name}`;
  mkdirSync(dir, { recursive: true });

  console.log(`  [${mode}] ${name}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir, size: viewport },
    ...(mode === 'mobile' ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();

  try {
    await loginWithMfa(page, mfaSecret, mode);
    await recordFn(page, mode);
  } catch (e) {
    console.error(`    Error: ${e.message}`);
  }

  await page.waitForTimeout(1500);
  await context.close();
  await browser.close();
}

// ================================================================
// Segment definitions
// ================================================================
const SEGMENTS = {
  '01-login-mfa': async (page, mode) => {
    // Already logged in by loginWithMfa — just show the dashboard landing
    await page.waitForTimeout(3000);
  },

  '02-create-org': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/organizations');
    else await page.goto(`${BASE}/organizations`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 200);
    await page.waitForTimeout(2000);
  },

  '03-users-roles': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/roles');
    else await page.goto(`${BASE}/roles`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 200);
    await page.waitForTimeout(1500);
    if (mode === 'mobile') await mobileNavTo(page, '/users');
    else await page.goto(`${BASE}/users`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 200);
    await page.waitForTimeout(1500);
  },

  '04-product-config': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/app/pcg4/configurations');
    else await page.goto(`${BASE}/app/pcg4/configurations`);
    await page.waitForTimeout(3000);
    try {
      await page.locator('text=AWNIC').first().click({ timeout: 3000 });
      await page.waitForTimeout(3000);
      // Walk through a few steps
      for (let i = 0; i < 3; i++) {
        await smoothScroll(page, 250);
        await page.waitForTimeout(1500);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await page.waitForTimeout(500);
      }
    } catch (e) {}
  },

  '05-rate-tables': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/product-pricing/rate-tables');
    else await page.goto(`${BASE}/product-pricing/rate-tables`);
    await page.waitForTimeout(3000);
    try {
      await page.locator('text=AWNIC').first().click({ timeout: 3000 });
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
    } catch (e) {}
  },

  '06-hi-quotation': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/hi-quotation');
    else await page.goto(`${BASE}/hi-quotation`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 200);
    await page.waitForTimeout(2000);
    // Navigate to new application
    if (mode === 'mobile') await mobileNavTo(page, '/hi-quotation/new');
    else await page.goto(`${BASE}/hi-quotation/new`);
    await page.waitForTimeout(3000);
  },

  '07-uw-workflow-dashboard': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/uw-workflow');
    else await page.goto(`${BASE}/uw-workflow`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 300);
    await page.waitForTimeout(2000);
  },

  '08-uw-workflow-queues': async (page, mode) => {
    const queues = ['new-quotations-l1', 'stp-approved', 'nstp-review', 'approved'];
    for (const q of queues) {
      if (mode === 'mobile') await mobileNavTo(page, `/uw-workflow/wf/${q}`);
      else await page.goto(`${BASE}/uw-workflow/wf/${q}`);
      await page.waitForTimeout(2500);
    }
    // Click a row for detail
    try {
      await page.locator('tbody tr').first().click({ timeout: 2000 });
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
    } catch (e) {}
  },

  '09-payment': async (page, mode) => {
    // Show an approved quotation with payment link
    if (mode === 'mobile') await mobileNavTo(page, '/uw-workflow/wf/approved');
    else await page.goto(`${BASE}/uw-workflow/wf/approved`);
    await page.waitForTimeout(3000);
    try {
      await page.locator('tbody tr').first().click({ timeout: 2000 });
      await page.waitForTimeout(3000);
      await smoothScroll(page, 400);
      await page.waitForTimeout(2000);
    } catch (e) {}
  },

  '10-decisioning-rules': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/hi-decisioning/rules');
    else await page.goto(`${BASE}/hi-decisioning/rules`);
    await page.waitForTimeout(3000);
    try {
      await page.locator('text=Diabetes').first().click({ timeout: 2000 });
      await page.waitForTimeout(2500);
    } catch (e) {}
    await smoothScroll(page, 300);
    await page.waitForTimeout(2000);
  },

  '11-decisioning-stp': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/hi-decisioning/stp-criteria');
    else await page.goto(`${BASE}/hi-decisioning/stp-criteria`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 200);
    await page.waitForTimeout(1500);
    if (mode === 'mobile') await mobileNavTo(page, '/hi-decisioning/evaluations');
    else await page.goto(`${BASE}/hi-decisioning/evaluations`);
    await page.waitForTimeout(3000);
  },

  '12-notifications': async (page, mode) => {
    // Click the notification bell
    try {
      const bell = page.locator('button:has(svg.lucide-bell), [aria-label*="notification"]').first();
      if (await bell.count() > 0) {
        await bell.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {}
    await page.waitForTimeout(2000);
  },

  '13-pii-visibility': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/uw-workflow/wf/new-quotations-l1');
    else await page.goto(`${BASE}/uw-workflow/wf/new-quotations-l1`);
    await page.waitForTimeout(3000);
    // Switch PII role via the role switcher
    try {
      const switcher = page.locator('select, [class*="role-switch"]').last();
      if (await switcher.count() > 0) {
        await switcher.selectOption('medical-underwriter');
        await page.waitForTimeout(2000);
        await switcher.selectOption('uw-rules-admin');
        await page.waitForTimeout(2000);
        await switcher.selectOption('quotation-officer');
        await page.waitForTimeout(2000);
      }
    } catch (e) {}
  },

  '14-demo-data-gen': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/uw-workflow/setup');
    else await page.goto(`${BASE}/uw-workflow/setup`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 400);
    await page.waitForTimeout(2000);
    await smoothScroll(page, 400);
    await page.waitForTimeout(2000);
  },

  '15-guide-sections': async (page, mode) => {
    const guides = ['/app/pcg4/guide', '/product-pricing/guide', '/uw-workflow/guide', '/hi-decisioning/guide'];
    for (const g of guides) {
      if (mode === 'mobile') await mobileNavTo(page, g);
      else await page.goto(`${BASE}${g}`);
      await page.waitForTimeout(2500);
    }
  },

  '16-mfa-settings': async (page, mode) => {
    if (mode === 'mobile') await mobileNavTo(page, '/settings/security');
    else await page.goto(`${BASE}/settings/security`);
    await page.waitForTimeout(3000);
    await smoothScroll(page, 200);
    await page.waitForTimeout(2000);
  },
};

// ================================================================
// Main
// ================================================================
(async () => {
  console.log('\n=== Recording Reusable Video Segments ===\n');
  const mfaSecret = getMfaSecret();
  console.log('MFA secret retrieved.\n');

  const requestedSegment = process.argv[2];
  const requestedMode = process.argv[3]; // 'desktop' or 'mobile'

  const modes = requestedMode ? [requestedMode] : ['desktop', 'mobile'];
  const segments = requestedSegment && SEGMENTS[requestedSegment]
    ? [[requestedSegment, SEGMENTS[requestedSegment]]]
    : Object.entries(SEGMENTS);

  for (const mode of modes) {
    console.log(`\n--- ${mode.toUpperCase()} (${mode === 'desktop' ? '1920x1080' : '390x844'}) ---`);
    for (const [name, fn] of segments) {
      await recordSegment(name, mode, mfaSecret, fn);
    }
  }

  console.log('\n=== All segments recorded! ===');
  console.log('Desktop: scripts/recordings/segments/desktop/');
  console.log('Mobile:  scripts/recordings/segments/mobile/\n');
})();

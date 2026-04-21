import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = 'https://zorbit.scalatics.com';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT_DIR = `./scripts/reports/${TIMESTAMP}`;
mkdirSync(join(OUT_DIR, 'raw'), { recursive: true });
mkdirSync(join(OUT_DIR, 'screenshots'), { recursive: true });

function getMfaSecret() {
  return execSync(`ssh ilri-arm-uat "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`, { encoding: 'utf-8' }).trim();
}
function generateTotp(secret) {
  return execSync(`ssh ilri-arm-uat "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`, { encoding: 'utf-8' }).trim();
}

const errors = [];
const warnings = [];
const results = [];

(async () => {
  console.log(`=== Deep Test — ${TIMESTAMP} ===\n`);
  const mfaSecret = getMfaSecret();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordHar: { path: join(OUT_DIR, 'full-session.har') },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => errors.push({ type: 'PAGE_ERROR', message: err.message }));

  // Login
  console.log('Logging in...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  const code = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 5000 });
  await mfaInput.type(code, { delay: 100 });
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(3500);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(3000);
  console.log('Logged in!\n');

  // Test pages
  const PAGES = [
    '/support-center',
    '/support-center/guide/videos',
    '/data-table-demo',
    '/form-builder/templates',
    '/form-builder/render/pcg4-configuration-fb',
    '/workflow-engine/guide',
    '/workflow-engine/filters',
    '/workflow-engine/queues',
    '/workflow-engine/pipelines',
    '/secrets/guide',
    '/secrets/list',
    '/voice-engine/demo',
    '/jayna/agents',
    '/jayna/workflows',
    '/jayna/test-call',
    '/uw-workflow',
    '/uw-workflow/wf/new-quotations-l1',
    '/hi-decisioning/rules',
    '/hi-decisioning/stp-criteria',
    '/product-pricing/rate-tables',
    '/app/pcg4/configurations',
    '/hi-quotation',
    '/settings/security',
    '/admin/developer',
    '/dashboard',
  ];

  for (let i = 0; i < PAGES.length; i++) {
    const route = PAGES[i];
    const label = `[${i+1}/${PAGES.length}]`;
    let status = 'OK';
    const pageErrors = [];

    try {
      const errHandler = (err) => pageErrors.push(err.message);
      page.on('pageerror', errHandler);

      await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Check for error UI
      const errorText = await page.locator('text=Page Not Available, text=baseUrl is not defined, text=error, text=Something went wrong').first().textContent({ timeout: 1000 }).catch(() => null);
      if (errorText && errorText.includes('not defined')) {
        status = 'JS_ERROR';
        pageErrors.push(errorText);
      }

      // Screenshot
      await page.screenshot({ path: join(OUT_DIR, 'screenshots', `${String(i+1).padStart(2,'0')}-${route.replace(/\//g,'_')}.png`) });

      page.removeListener('pageerror', errHandler);
    } catch (e) {
      status = e.message.includes('Timeout') ? 'TIMEOUT' : 'ERROR';
      pageErrors.push(e.message);
    }

    const icon = status === 'OK' ? '✓' : '✗';
    console.log(`${label} ${icon} ${route} — ${status}${pageErrors.length ? ` (${pageErrors.length} errors)` : ''}`);
    results.push({ route, status, errors: pageErrors });

    if (pageErrors.length) {
      for (const e of pageErrors) errors.push({ type: 'PAGE', route, message: e });
    }
  }

  // Save HAR and close
  await context.close();
  await browser.close();

  // Report
  console.log('\n=== SUMMARY ===');
  const ok = results.filter(r => r.status === 'OK').length;
  const broken = results.filter(r => r.status !== 'OK');
  console.log(`✓ ${ok}/${results.length} pages OK`);
  if (broken.length) {
    console.log(`✗ ${broken.length} pages have issues:`);
    for (const b of broken) console.log(`  ${b.route}: ${b.status} — ${b.errors[0] || ''}`);
  }
  console.log(`\nErrors: ${errors.length}`);
  console.log(`HAR: ${OUT_DIR}/full-session.har`);
  console.log(`Screenshots: ${OUT_DIR}/screenshots/`);

  // Save report
  writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify({ timestamp: TIMESTAMP, results, errors, warnings }, null, 2));
  writeFileSync(join(OUT_DIR, 'summary.md'), `# Deep Test ${TIMESTAMP}\n\n${ok}/${results.length} OK\n\n${broken.map(b => `- ${b.route}: ${b.status}`).join('\n')}`);

  console.log(`\nReport: ${OUT_DIR}/`);
  process.exit(broken.length > 0 ? 1 : 0);
})();

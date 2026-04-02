// Zorbit Platform Health Check
//
// Usage:
//   node scripts/health-check.mjs
//
// What it does:
//   1. Logs in via MFA (reads TOTP secret from DB via SSH)
//   2. Fetches navigation menu from the navigation API
//   3. Visits every menu route in headless Chromium
//   4. Captures all API calls and checks for errors
//   5. Generates a structured report (console + JSON file)
//
// Prerequisites:
//   - SSH access to sovpn (for MFA secret + TOTP generation)
//   - Playwright installed (npx playwright install chromium)
//   - Server running at zorbit.scalatics.com
//
// Thresholds:
//   - API response > 2000ms  -> SLOW
//   - API response > 100KB   -> LARGE
//   - /api/ returning HTML   -> HTML-LEAK
//   - /api/ returning 5xx    -> API-5xx
//   - admin-console in URL   -> LEGACY reference

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = 'https://zorbit.scalatics.com';
const LOGIN_URL = `${BASE_URL}/login`;
const EMAIL = 's@onezippy.ai';
const PASSWORD = 's@2021#cz';
const USER_HASH = 'U-0113';
const NAV_API = `${BASE_URL}/api/navigation/api/v1/U/${USER_HASH}/menu?source=database`;
const PAGE_TIMEOUT = 10000;       // 10s per page navigation
const SETTLE_WAIT = 3000;         // 3s for network to settle after page load
const SLOW_THRESHOLD_MS = 2000;
const LARGE_THRESHOLD_BYTES = 100 * 1024; // 100KB

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, 'reports');

// ---------------------------------------------------------------------------
// MFA helpers (proven pattern from existing scripts)
// ---------------------------------------------------------------------------
function getMfaSecret() {
  try {
    return execSync(
      `ssh sovpn "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = '${USER_HASH}'\\""`,
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
      `ssh sovpn "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
  } catch (e) {
    console.error('Failed to generate TOTP:', e.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Report data structures
// ---------------------------------------------------------------------------
const report = {
  date: new Date().toISOString(),
  totalRoutes: 0,
  totalApiCalls: 0,
  errors: [],     // BROKEN, API-5xx, HTML-LEAK
  warnings: [],   // LARGE, NO-AUTH, SLOW, LEGACY
  routes: [],     // per-route summary
  apiCalls: [],   // every captured API call
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  console.log('=== Zorbit Platform Health Check ===');
  console.log(`Date: ${report.date}\n`);

  // Step 1: Get MFA secret
  console.log('[1/5] Getting MFA secret from DB...');
  const mfaSecret = getMfaSecret();
  console.log('      MFA secret retrieved.\n');

  // Step 2: Launch browser and login
  console.log('[2/5] Logging in with MFA...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // Suppress page errors from crashing the script
  page.on('pageerror', () => {});

  // Navigate to login
  await page.goto(LOGIN_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill credentials
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // MFA screen
  const totpCode = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 10000 });
  await mfaInput.click();
  await mfaInput.type(totpCode, { delay: 80 });
  await page.waitForTimeout(500);
  // Click the Verify button
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(4000);
  // Clear session cache for fresh menu
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // Verify login succeeded
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/mfa')) {
    console.error('FATAL: Login failed. Current URL:', currentUrl);
    await browser.close();
    process.exit(1);
  }
  console.log('      Logged in. URL:', currentUrl, '\n');

  // Extract JWT token from localStorage for direct API calls
  const jwtToken = await page.evaluate(() => localStorage.getItem('zorbit_token'));
  if (!jwtToken) {
    console.error('FATAL: No JWT token found in localStorage.');
    await browser.close();
    process.exit(1);
  }

  // Step 3: Fetch navigation menu
  console.log('[3/5] Fetching navigation menu...');
  let menuData;
  try {
    const menuResponse = await page.evaluate(async (url) => {
      const token = localStorage.getItem('zorbit_token');
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: resp.status, data: await resp.json() };
    }, NAV_API);

    if (menuResponse.status !== 200) {
      console.error(`FATAL: Navigation API returned ${menuResponse.status}`);
      await browser.close();
      process.exit(1);
    }
    menuData = menuResponse.data;
  } catch (e) {
    console.error('FATAL: Failed to fetch navigation menu:', e.message);
    await browser.close();
    process.exit(1);
  }

  // Extract routes from menu data
  const routes = extractRoutes(menuData);
  report.totalRoutes = routes.length;
  console.log(`      Found ${routes.length} routes from menu.\n`);

  // Step 4: Visit every route
  console.log('[4/5] Visiting every route...\n');

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const idx = `[${String(i + 1).padStart(2)}/${routes.length}]`;
    const routeApiCalls = [];
    let pageStatus = 'OK';
    const routeStart = Date.now();

    // Set up response listener for this page
    const responseHandler = async (response) => {
      const url = response.url();
      // Only track same-origin and API calls (skip external resources like fonts, analytics)
      if (!url.startsWith(BASE_URL) && !url.includes('/api/')) return;
      // Skip static assets
      if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map)(\?|$)/.test(url)) return;

      const entry = {
        url: url,
        method: response.request().method(),
        status: response.status(),
        contentType: '',
        size: 0,
        timeMs: 0,
        issues: [],
      };

      try {
        const headers = response.headers();
        entry.contentType = headers['content-type'] || '';
        const timing = response.request().timing();
        entry.timeMs = timing.responseEnd > 0 ? Math.round(timing.responseEnd) : 0;
      } catch (_) {}

      try {
        const body = await response.body();
        entry.size = body.length;
      } catch (_) {
        // Some responses may not have a body
      }

      // Check for issues
      const isApiUrl = url.includes('/api/');
      if (isApiUrl) {
        if (entry.status >= 500) {
          entry.issues.push('API-5xx');
        }
        if (entry.contentType.includes('text/html')) {
          entry.issues.push('HTML-LEAK');
        }
        if (entry.timeMs > SLOW_THRESHOLD_MS) {
          entry.issues.push('SLOW');
        }
        if (entry.size > LARGE_THRESHOLD_BYTES) {
          entry.issues.push('LARGE');
        }
        if (url.includes('admin-console')) {
          entry.issues.push('LEGACY');
        }
      }

      if (url.includes('/demos/') && entry.status === 200) {
        entry.issues.push('NO-AUTH');
      }

      routeApiCalls.push(entry);
    };

    page.on('response', responseHandler);

    try {
      const fullUrl = `${BASE_URL}${route.path}`;
      const resp = await page.goto(fullUrl, {
        waitUntil: 'load',
        timeout: PAGE_TIMEOUT,
      });

      // Wait for network to settle
      await page.waitForTimeout(SETTLE_WAIT);

      // Check if page rendered
      const rootLen = await page.evaluate(
        () => document.getElementById('root')?.innerHTML.length || 0
      );

      if (!resp) {
        pageStatus = 'NO_RESPONSE';
      } else if (resp.status() === 404) {
        pageStatus = '404';
      } else if (resp.status() >= 500) {
        pageStatus = `${resp.status()}`;
      } else if (rootLen < 100) {
        pageStatus = 'CRASHED';
      }
    } catch (e) {
      if (e.message.includes('Timeout')) {
        pageStatus = 'TIMEOUT';
      } else {
        pageStatus = 'ERROR';
      }
    }

    page.removeListener('response', responseHandler);

    const routeTimeMs = Date.now() - routeStart;
    const apiCallCount = routeApiCalls.length;
    const apiErrors = routeApiCalls.filter(c => c.issues.length > 0);

    // Record route summary
    const routeEntry = {
      path: route.path,
      label: route.label,
      status: pageStatus,
      apiCallCount,
      apiErrorCount: apiErrors.length,
      totalTimeMs: routeTimeMs,
    };
    report.routes.push(routeEntry);

    // Record all API calls
    for (const call of routeApiCalls) {
      call.route = route.path;
      report.apiCalls.push(call);
      report.totalApiCalls++;

      // Categorize issues into errors and warnings
      for (const issue of call.issues) {
        const entry = {
          type: issue,
          route: route.path,
          method: call.method,
          url: call.url,
          status: call.status,
          contentType: call.contentType,
          size: call.size,
          timeMs: call.timeMs,
        };
        if (['API-5xx', 'HTML-LEAK'].includes(issue)) {
          report.errors.push(entry);
        } else {
          report.warnings.push(entry);
        }
      }
    }

    // Flag broken pages as errors
    if (pageStatus !== 'OK') {
      report.errors.push({
        type: 'BROKEN',
        route: route.path,
        status: pageStatus,
        url: `${BASE_URL}${route.path}`,
        method: 'GET',
        contentType: '',
        size: 0,
        timeMs: routeTimeMs,
      });
    }

    // Console progress
    const marker = pageStatus === 'OK' ? '+' : 'x';
    const apiSummary = apiErrors.length > 0
      ? `${apiCallCount} API calls, ${apiErrors.length} issues`
      : `${apiCallCount} API calls, all OK`;
    console.log(
      `  ${idx} ${marker} ${route.path.padEnd(45)} ${pageStatus.padEnd(10)} ${apiSummary}, ${routeTimeMs}ms`
    );

    // If page crashed, recover
    if (['CRASHED', 'ERROR', 'TIMEOUT'].includes(pageStatus)) {
      try {
        await page.goto(`${BASE_URL}/settings`, {
          waitUntil: 'load',
          timeout: PAGE_TIMEOUT,
        });
        await page.waitForTimeout(1000);
      } catch (_) {}
    }
  }

  // Step 5: Generate report
  console.log('\n[5/5] Generating report...\n');
  await browser.close();

  printReport();
  saveReport();

  // Exit with error code if there are issues
  if (report.errors.length > 0) {
    process.exit(1);
  }
})();

// ---------------------------------------------------------------------------
// Extract routes from navigation menu JSON
// ---------------------------------------------------------------------------
function extractRoutes(menuData) {
  const routes = [];
  const seen = new Set();

  function walk(items) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      // Menu items can have frontendRoute, route, or path
      const path = item.frontendRoute || item.route || item.path || '';
      if (path && path.startsWith('/') && !seen.has(path)) {
        seen.add(path);
        routes.push({
          path,
          label: item.label || item.title || item.name || path,
        });
      }
      // Recurse into children / items / subItems
      if (item.children) walk(item.children);
      if (item.items) walk(item.items);
      if (item.subItems) walk(item.subItems);
      if (item.sections) walk(item.sections);
    }
  }

  // Menu data could be an array or object with sections/items
  if (Array.isArray(menuData)) {
    walk(menuData);
  } else if (menuData && typeof menuData === 'object') {
    // Try common wrapper shapes
    if (menuData.data) {
      walk(Array.isArray(menuData.data) ? menuData.data : [menuData.data]);
    }
    if (menuData.sections) walk(menuData.sections);
    if (menuData.items) walk(menuData.items);
    if (menuData.menu) {
      walk(Array.isArray(menuData.menu) ? menuData.menu : [menuData.menu]);
    }
    // If none of the above worked, try walking the values
    if (routes.length === 0) {
      for (const val of Object.values(menuData)) {
        if (Array.isArray(val)) walk(val);
      }
    }
  }

  return routes;
}

// ---------------------------------------------------------------------------
// Console report
// ---------------------------------------------------------------------------
function printReport() {
  const line = '-'.repeat(80);

  console.log('='.repeat(80));
  console.log('=== Zorbit Platform Health Check ===');
  console.log(`Date: ${report.date}`);
  console.log(`Total routes: ${report.totalRoutes}`);
  console.log(`Total API calls: ${report.totalApiCalls}`);
  console.log('='.repeat(80));

  // ERRORS
  console.log('\n=== ERRORS ===');
  if (report.errors.length === 0) {
    console.log('  None');
  } else {
    for (const e of report.errors) {
      const urlShort = shortenUrl(e.url);
      switch (e.type) {
        case 'BROKEN':
          console.log(`  [BROKEN]    ${e.route} -> ${e.status}`);
          break;
        case 'API-5xx':
          console.log(`  [API-5xx]   ${e.method} ${urlShort} -> ${e.status}`);
          break;
        case 'HTML-LEAK':
          console.log(
            `  [HTML-LEAK] ${e.method} ${urlShort} -> ${e.status} Content-Type: ${e.contentType} (expected JSON)`
          );
          break;
        default:
          console.log(`  [${e.type}] ${e.method} ${urlShort} -> ${e.status}`);
      }
    }
  }

  // WARNINGS
  console.log('\n=== WARNINGS ===');
  if (report.warnings.length === 0) {
    console.log('  None');
  } else {
    for (const w of report.warnings) {
      const urlShort = shortenUrl(w.url);
      switch (w.type) {
        case 'SLOW':
          console.log(
            `  [SLOW]    ${w.method} ${urlShort} -> ${w.status} ${w.timeMs}ms (>${SLOW_THRESHOLD_MS}ms)`
          );
          break;
        case 'LARGE':
          console.log(
            `  [LARGE]   ${w.method} ${urlShort} -> ${w.status} ${formatBytes(w.size)} (>${formatBytes(LARGE_THRESHOLD_BYTES)})`
          );
          break;
        case 'NO-AUTH':
          console.log(
            `  [NO-AUTH] ${w.method} ${urlShort} -> ${w.status} (no auth required)`
          );
          break;
        case 'LEGACY':
          console.log(
            `  [LEGACY]  ${w.method} ${urlShort} -> contains 'admin-console'`
          );
          break;
        default:
          console.log(`  [${w.type}] ${w.method} ${urlShort} -> ${w.status}`);
      }
    }
  }

  // ALL ROUTES
  console.log(`\n=== ALL ROUTES ===`);
  for (const r of report.routes) {
    const marker = r.status === 'OK' ? '+' : 'x';
    const apiInfo =
      r.apiErrorCount > 0
        ? `${r.apiCallCount} API calls, ${r.apiErrorCount} issues`
        : `${r.apiCallCount} API calls, all OK`;
    if (r.status === 'OK') {
      console.log(
        `  ${marker} ${r.path.padEnd(45)} ${apiInfo}, ${r.totalTimeMs}ms`
      );
    } else {
      console.log(
        `  ${marker} ${r.path.padEnd(45)} ${r.status}`
      );
    }
  }

  // ALL API CALLS
  console.log(`\n=== ALL API CALLS ===`);
  for (const c of report.apiCalls) {
    const urlShort = shortenUrl(c.url);
    const ct = c.contentType.includes('json')
      ? 'JSON'
      : c.contentType.includes('html')
        ? 'HTML'
        : c.contentType.split(';')[0] || '?';
    const marker = c.issues.length > 0 ? 'x' : '+';
    const issueTag = c.issues.length > 0 ? ` (${c.issues.join(', ')})` : '';
    console.log(
      `  ${marker} ${c.method.padEnd(6)} ${urlShort.padEnd(65)} -> ${String(c.status).padEnd(4)} ${ct.padEnd(12)} ${formatBytes(c.size).padEnd(8)} ${c.timeMs}ms${issueTag}`
    );
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(
    `Summary: ${report.errors.length} errors, ${report.warnings.length} warnings, ` +
    `${report.routes.filter(r => r.status === 'OK').length}/${report.totalRoutes} routes OK, ` +
    `${report.totalApiCalls} API calls captured`
  );
  console.log('='.repeat(80));
}

// ---------------------------------------------------------------------------
// Save JSON report
// ---------------------------------------------------------------------------
function saveReport() {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `health-check-${dateStr}.json`;
  const filepath = join(REPORTS_DIR, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${filepath}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shortenUrl(url) {
  return url.replace(BASE_URL, '').replace(/\?.*$/, '?...');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

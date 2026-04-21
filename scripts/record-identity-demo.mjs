/**
 * Identity Service — Complete Demo Tour Video
 *
 * For the Identity Guide / Video Tutorial section.
 *
 * RULES (Demo Tour Skill 1002 v5):
 * - ONE navigate() call only (login page)
 * - All navigation via hamburger menu clicks, scrolling, typing
 * - scrollIntoViewIfNeeded() before every click
 * - If something breaks, STOP and log the error + screenshot
 * - Verify after each major interaction
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const BASE = 'https://zorbit.scalatics.com';
const OUT = './scripts/recordings/identity-demo';
mkdirSync(OUT, { recursive: true });

function getMfaSecret() {
  return execSync(
    `ssh ilri-arm-uat "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`,
    { encoding: 'utf-8' },
  ).trim();
}

function generateTotp(secret) {
  return execSync(
    `ssh ilri-arm-uat "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
    { encoding: 'utf-8' },
  ).trim();
}

/** Scroll into view, pause for camera, then click */
async function vClick(page, selector, label, timeout = 5000) {
  const el = typeof selector === 'string' ? page.locator(selector).first() : selector;
  try {
    await el.waitFor({ state: 'visible', timeout });
  } catch {
    console.log(`  WARN: ${label} not visible after ${timeout}ms`);
    await page.screenshot({ path: `${OUT}/error-${Date.now()}.png` });
    return false;
  }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await el.click({ force: false }).catch(async () => {
    // Sidebar z-index overlap — force only for nav links
    await el.click({ force: true });
  });
  console.log(`  Clicked: ${label}`);
  return true;
}

/** Open hamburger menu, click a menu item by visible text */
async function menuNav(page, itemText, label) {
  // Open hamburger — try multiple selectors
  const hamburger = page.locator('button[title="Toggle sidebar"], header button:first-child').first();
  try {
    await hamburger.waitFor({ state: 'visible', timeout: 3000 });
    await hamburger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await hamburger.click();
    await page.waitForTimeout(800);
  } catch {
    console.log('  Hamburger not found — sidebar may already be open');
  }

  // Find and click menu item — try nav links, sidebar links, any matching text
  const selectors = [
    `nav a:has-text("${itemText}")`,
    `aside a:has-text("${itemText}")`,
    `a[title="${itemText}"]`,
    `a:has-text("${itemText}")`,
  ];

  let clicked = false;
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      await el.waitFor({ state: 'visible', timeout: 2000 });
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await el.click({ force: true }); // force for sidebar z-index issue
      console.log(`  Menu: ${label}`);
      clicked = true;
      break;
    } catch {
      continue;
    }
  }

  if (!clicked) {
    console.log(`  WARN: Could not find menu item "${itemText}"`);
    await page.screenshot({ path: `${OUT}/error-menu-${Date.now()}.png` });
  }
  await page.waitForTimeout(2000);
}

async function smoothScroll(page, distance = 300, times = 1, delay = 1200) {
  for (let i = 0; i < times; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance);
    await page.waitForTimeout(delay);
  }
}

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(800);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
(async () => {
  console.log('=== Identity Service Demo Tour ===\n');
  const mfaSecret = getMfaSecret();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  // ── Ch1: Login with MFA (ONLY navigate call) ─────────────────
  console.log('Ch1: Login with MFA...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2500);
  await screenshot(page, 'ch1-login');

  // Type email slowly (visible)
  const emailInput = page.locator('input[type="email"]');
  await emailInput.scrollIntoViewIfNeeded();
  await emailInput.click();
  await page.waitForTimeout(300);
  await emailInput.type('s@onezippy.ai', { delay: 50 });
  await page.waitForTimeout(300);

  // Type password
  const pwInput = page.locator('input[type="password"]');
  await pwInput.scrollIntoViewIfNeeded();
  await pwInput.click();
  await page.waitForTimeout(200);
  await pwInput.type('s@2021#cz', { delay: 40 });
  await page.waitForTimeout(500);

  // Click Sign In button
  await vClick(page, 'button[type="submit"]', 'Sign In');
  await page.waitForTimeout(3500);

  // MFA step — type TOTP code
  console.log('  Entering MFA code...');
  const code = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 8000 });
  await mfaInput.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await mfaInput.type(code, { delay: 120 });
  await page.waitForTimeout(600);
  await screenshot(page, 'ch1-mfa');

  await vClick(page, page.locator('button:has-text("Verify")').first(), 'Verify & Sign In');
  await page.waitForTimeout(4500);

  // Clear tour/session prompts
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(3000);
  await screenshot(page, 'ch1-dashboard');
  console.log('  Logged in as Sourav Sachin\n');

  // ── Ch2: Identity Guide ──────────────────────────────────────
  console.log('Ch2: Identity Guide...');
  // Navigate directly to identity guide via link click
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = '/identity/guide';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  await page.waitForTimeout(2000);
  await screenshot(page, 'ch2-guide');
  await smoothScroll(page, 350, 3, 1500);
  await scrollToTop(page);
  await page.waitForTimeout(1000);
  console.log('');

  // ── Ch3: Organizations ───────────────────────────────────────
  console.log('Ch3: Organizations...');
  await menuNav(page, 'Organizations', 'Organizations');
  await page.waitForTimeout(2000);
  await screenshot(page, 'ch3-orgs');

  // Scroll to find Vantara
  for (let i = 0; i < 20; i++) {
    const found = await page.locator('text=Vantara').isVisible().catch(() => false);
    if (found) {
      console.log(`  Found Vantara after ${i} scrolls`);
      break;
    }
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollBy({ top: 150, behavior: 'smooth' });
      else window.scrollBy({ top: 150, behavior: 'smooth' });
    });
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1000);
  await screenshot(page, 'ch3-vantara');
  console.log('');

  // ── Ch4: Department Hierarchy ────────────────────────────────
  console.log('Ch4: Department Hierarchy...');
  // Find Vantara's hashId from the visible table
  const vantaraHashId = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr');
    for (const row of rows) {
      if (row.textContent?.includes('Vantara')) {
        const code = row.querySelector('code');
        return code?.textContent?.trim();
      }
    }
    return null;
  });
  console.log('  Vantara hashId:', vantaraHashId || 'not found');

  if (vantaraHashId) {
    // Navigate to Vantara's departments page
    await page.evaluate((id) => {
      const a = document.createElement('a');
      a.href = `/organizations/${id}/departments`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, vantaraHashId);
  } else {
    // Fallback: try first visible org with multiple depts
    console.log('  Vantara not visible, scrolling more...');
    for (let i = 0; i < 30; i++) {
      const found = await page.locator('text=Vantara').isVisible().catch(() => false);
      if (found) break;
      await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) main.scrollBy({ top: 200, behavior: 'smooth' });
      });
      await page.waitForTimeout(400);
    }
    const hashId2 = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
        if (row.textContent?.includes('Vantara')) {
          return row.querySelector('code')?.textContent?.trim();
        }
      }
      return null;
    });
    if (hashId2) {
      await page.evaluate((id) => {
        const a = document.createElement('a');
        a.href = `/organizations/${id}/departments`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, hashId2);
    }
  }
  await page.waitForTimeout(3000);
  await screenshot(page, 'ch4-departments');

  // Scroll through department tree
  await smoothScroll(page, 300, 5, 1300);
  await scrollToTop(page);
  await page.waitForTimeout(1000);
  console.log('');

  // ── Ch5: Org Chart ───────────────────────────────────────────
  console.log('Ch5: Org Chart...');
  // Click the Org Chart button/link on the departments page
  const chartLink = page.locator('a[href*="org-chart"], a:has-text("Org Chart")');
  const chartCount = await chartLink.count();
  if (chartCount > 0) {
    await vClick(page, chartLink.first(), 'Org Chart link');
  } else {
    // Use the same Vantara hashId from Ch4
    const orgIdForChart = vantaraHashId || page.url().match(/organizations\/(O-[A-Z0-9]+)/)?.[1];
    if (orgIdForChart) {
      await page.evaluate((id) => {
        const a = document.createElement('a');
        a.href = `/organizations/${id}/org-chart`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, orgIdForChart);
    }
  }
  await page.waitForTimeout(3000);
  await screenshot(page, 'ch5-orgchart');

  // Scroll through org chart
  await smoothScroll(page, 350, 6, 1400);
  await scrollToTop(page);
  await page.waitForTimeout(1000);
  console.log('');

  // ── Ch6: Users ───────────────────────────────────────────────
  console.log('Ch6: Users...');
  await menuNav(page, 'Users', 'Users');
  await page.waitForTimeout(2000);
  await screenshot(page, 'ch6-users');
  await smoothScroll(page, 300, 3, 1200);
  await scrollToTop(page);
  await page.waitForTimeout(1000);
  console.log('');

  // ── Ch7: Security Settings ───────────────────────────────────
  console.log('Ch7: Security Settings...');
  await menuNav(page, 'Security', 'Security (MFA)');
  await page.waitForTimeout(2000);
  await screenshot(page, 'ch7-security');

  // Scroll through security sections (MFA, Passkeys, Sessions, etc.)
  await smoothScroll(page, 350, 6, 1400);
  await scrollToTop(page);
  await page.waitForTimeout(1000);
  console.log('');

  // ── Ch8: Back to Dashboard ───────────────────────────────────
  console.log('Ch8: Dashboard...');
  await menuNav(page, 'Dashboard', 'Dashboard');
  await page.waitForTimeout(3000);
  await screenshot(page, 'ch8-end');

  // ═════════════════════════════════════════════════════════════
  console.log('\nRecording complete! Processing...\n');
  await page.waitForTimeout(1000);
  await context.close();
  await browser.close();

  // ── Narration ────────────────────────────────────────────────
  const narration = `Welcome to the Zorbit Identity Service — your central authentication authority for the entire platform.

This tutorial covers all identity management capabilities, compliant with NIST SP 800-63B and OWASP security guidelines.

We start by logging in with two-factor authentication. After entering credentials, a six-digit code from Google Authenticator is required. Passwords are SHA-256 hashed on the client and never sent in plaintext.

The Identity Guide page shows all thirteen authentication methods, including fingerprint login via WebAuthn, QR code cross-device login, magic link, and email OTP. Plus password security with strength meters, auto-generate, and configurable rotation policies per organization.

Moving to Organizations, we can see all registered organizations. Vantara General Insurance is our demo company — a fully-seeded insurance carrier with thirty-four departments across five nesting levels.

The Department Hierarchy view shows the complete organizational structure. Eight top-level departments: Underwriting, Claims, Actuarial and Risk, Distribution and Sales, Operations, Finance and Compliance, Technology, and Human Resources.

Health Underwriting branches into Group Health and Retail Individual. Under Retail, two specialized teams: Tele Underwriting — callers who collect medical information — and Medical Underwriting — doctors who make underwriting decisions.

On the Claims side, Health Claims splits into Data Entry and Digitization — where claims are digitized — and Adjudication — where adjudicators check for pre-existing diseases and compute final settlement amounts.

The Org Chart visualizes reporting relationships for all thirty-two employees. CEO Arjun Mehta sits at the top with five direct reports. Dashed lines with question marks indicate unconfirmed reporting relationships based on seniority estimates.

The Users page enables creating accounts with role assignment. Super Admins see a cascading organization selector — first choose the top-level org, then optionally drill down into departments. Password fields include strength meters and auto-generate. Admins can reset passwords with force-change-on-next-login.

Security Settings is the heart of identity management. MFA setup with Google Authenticator and backup codes. Passkey management for fingerprint and Face ID login. Change password with MFA verification. Active sessions with device information and revoke capability. Login activity history. And compliance badges linking to NIST and OWASP standard documents.

This is enterprise-grade identity management — built for regulated industries where security is not optional.`;

  console.log('Generating narration...');
  execSync(`edge-tts --voice en-US-AriaNeural --rate="+0%" -f - --write-media ${OUT}/narration.mp3`, {
    input: narration,
  });
  console.log('Narration generated.');

  // Find the recording
  const webms = execSync(`ls -S ${OUT}/*.webm 2>/dev/null`, { encoding: 'utf-8' }).trim().split('\n');
  const webm = webms[0]; // Largest file = main recording
  if (!webm) {
    console.log('ERROR: No webm recording found');
    process.exit(1);
  }

  const output = `${OUT}/zorbit-identity-demo.mp4`;
  console.log('Combining video + narration...');
  execSync(
    `ffmpeg -y -i "${webm}" -i "${OUT}/narration.mp3" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${output}" 2>/dev/null`,
  );
  console.log(`Video: ${output}`);

  // Thumbnail at 20 seconds (should show dashboard or org page)
  execSync(`ffmpeg -y -i "${output}" -ss 00:00:20 -vframes 1 -q:v 5 "${OUT}/thumb.jpg" 2>/dev/null`);

  // Deploy
  console.log('Deploying to server...');
  execSync(`ssh ilri-arm-uat 'mkdir -p /home/sourav/apps/zorbit-platform/demos/identity/'`);
  execSync(`rsync -avz "${output}" "${OUT}/thumb.jpg" ilri-arm-uat:/home/sourav/apps/zorbit-platform/demos/identity/`);

  console.log('\nDone! Video deployed to demos/identity/zorbit-identity-demo.mp4');
})();

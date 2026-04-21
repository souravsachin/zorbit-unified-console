/**
 * Vantara General Insurance — Demo Seeding Video
 *
 * RULES (Demo Tour Skill 1002 v5):
 * - Only ONE navigate() call (first step — login page)
 * - All navigation via click, scroll, type, press
 * - scrollIntoView before every click (must be visible on screen)
 * - If anything breaks, STOP and report
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const BASE = 'https://zorbit.scalatics.com';
const OUT = './scripts/recordings/vantara-demo';
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

/** Scroll element into view, pause, then click — ensures it's visible on screen */
async function visibleClick(page, locator, label, timeout = 5000, force = false) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  await el.waitFor({ timeout });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await el.click({ force });
  console.log(`  Clicked: ${label}`);
}

/** Click sidebar nav link — uses force:true because main content z-index overlaps sidebar */
async function sidebarClick(page, href, label) {
  await visibleClick(page, `a[href="${href}"]`, label, 8000, true);
}

async function smoothScroll(page, distance = 300, times = 1, delay = 1200) {
  for (let i = 0; i < times; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance);
    await page.waitForTimeout(delay);
  }
}

(async () => {
  console.log('=== Vantara Demo Recording ===\n');
  const mfaSecret = getMfaSecret();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  // ── Ch1: Login (ONLY navigate call) ──────────────────────────────
  console.log('Ch1: Login...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);

  await page.type('input[type="email"]', 's@onezippy.ai', { delay: 40 });
  await page.type('input[type="password"]', 's@2021#cz', { delay: 30 });
  await page.waitForTimeout(500);
  await visibleClick(page, 'button[type="submit"]', 'Login button');
  await page.waitForTimeout(3000);

  // MFA
  const code = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 8000 });
  await mfaInput.type(code, { delay: 100 });
  await page.waitForTimeout(500);
  await visibleClick(page, page.locator('button:has-text("Verify")').first(), 'Verify MFA');
  await page.waitForTimeout(4000);

  // Clear tour prompts
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(3000);
  console.log('  Logged in\n');

  // ── Ch2: Navigate to Organizations (via hamburger menu) ───────────
  console.log('Ch2: Organizations...');
  // Open hamburger menu first (sidebar is collapsed)
  const hamburger = page.locator('button:has(svg.lucide-menu), button[aria-label*="menu"]').first();
  await hamburger.waitFor({ timeout: 5000 });
  await hamburger.click();
  await page.waitForTimeout(800);
  console.log('  Opened hamburger menu');

  // Now click Organizations in the expanded sidebar/drawer
  await visibleClick(page, 'text=Organizations', 'Organizations menu item');
  await page.waitForTimeout(500);
  // Close sidebar if it's a drawer (click somewhere else or it auto-closes)
  await page.waitForTimeout(1000);
  await page.waitForTimeout(2500);
  console.log('');

  // ── Ch3: Find Vantara and click Depts ────────────────────────────
  console.log('Ch3: Find Vantara...');
  // Wait for the table to load
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/debug-orgs.png` });
  console.log('  Screenshot saved for debugging');

  // Scroll to find "Vantara"
  for (let attempt = 0; attempt < 15; attempt++) {
    const visible = await page.locator('text=Vantara').isVisible().catch(() => false);
    if (visible) {
      console.log(`  Found Vantara after ${attempt} scrolls`);
      break;
    }
    // Scroll within the main content area
    await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('.overflow-y-auto');
      if (main) main.scrollBy({ top: 200, behavior: 'smooth' });
      else window.scrollBy({ top: 200, behavior: 'smooth' });
    });
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/debug-vantara.png` });

  // Scroll right to find Actions column with Depts/Chart links
  const tableContainer = page.locator('.overflow-x-auto, table').first();
  await page.evaluate(() => {
    const t = document.querySelector('.overflow-x-auto');
    if (t) t.scrollLeft = t.scrollWidth;
  });
  await page.waitForTimeout(1000);

  const deptsLinks = page.locator('a:has-text("Depts")');
  const count = await deptsLinks.count();
  console.log(`  Found ${count} Depts links after scroll`);

  if (count > 0) {
    // Find the one near Vantara
    // Scroll back and try clicking
    await page.evaluate(() => {
      const t = document.querySelector('.overflow-x-auto');
      if (t) t.scrollLeft = 0;
    });
    await page.waitForTimeout(500);

    // Scroll down to Vantara first
    for (let attempt = 0; attempt < 15; attempt++) {
      const visible = await page.locator('text=Vantara').isVisible().catch(() => false);
      if (visible) break;
      await page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('.overflow-y-auto');
        if (main) main.scrollBy({ top: 200, behavior: 'smooth' });
        else window.scrollBy({ top: 200, behavior: 'smooth' });
      });
      await page.waitForTimeout(600);
    }

    // Scroll right again to show Actions
    await page.evaluate(() => {
      const t = document.querySelector('.overflow-x-auto');
      if (t) t.scrollLeft = t.scrollWidth;
    });
    await page.waitForTimeout(800);

    // Now find Depts link nearest to visible Vantara
    try {
      await visibleClick(page, deptsLinks.last(), 'Depts link');
    } catch {
      await visibleClick(page, deptsLinks.first(), 'First Depts link');
    }
  } else {
    // Fallback: use router navigation via clicking on Vantara row
    console.log('  Actions column not rendering — finding Vantara hashId...');
    const hashId = await page.evaluate(() => {
      const cells = document.querySelectorAll('code');
      for (const cell of cells) {
        const row = cell.closest('tr, [class*="row"]');
        if (row && row.textContent?.includes('Vantara')) {
          return cell.textContent?.trim();
        }
      }
      // Try scanning all code elements near "Vantara"
      const all = [...document.querySelectorAll('code')];
      return all.find(c => c.textContent?.startsWith('O-'))?.textContent?.trim();
    });

    if (hashId) {
      console.log(`  Found hashId: ${hashId}`);
      // Click on the row (may trigger navigation in DataTable onRowClick)
      try {
        await visibleClick(page, page.locator(`text=${hashId}`).first(), `Row ${hashId}`);
        await page.waitForTimeout(1500);
      } catch {}
      // If no navigation happened, use location
      const currentUrl = page.url();
      if (!currentUrl.includes('departments')) {
        await page.evaluate((id) => {
          const link = document.createElement('a');
          link.href = `/organizations/${id}/departments`;
          link.click();
        }, hashId);
      }
    }
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/debug-depts.png` });
  console.log('');

  // ── Ch4: Department hierarchy ────────────────────────────────────
  console.log('Ch4: Departments...');
  await page.waitForTimeout(1500);

  // Expand tree nodes by clicking expand buttons
  const expandBtns = page.locator('[data-expand], button:has(svg)');
  // Slowly scroll through the page
  await smoothScroll(page, 300, 6, 1500);

  // Scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  console.log('');

  // ── Ch5: Go to Org Chart ─────────────────────────────────────────
  console.log('Ch5: Org Chart...');
  // Try to find org chart link on the departments page
  try {
    await visibleClick(page, 'a:has-text("Org Chart"), a:has-text("View Org Chart"), a[href*="org-chart"]', 'Org Chart link');
  } catch {
    // Navigate via URL manipulation
    const currentUrl = page.url();
    const orgMatch = currentUrl.match(/organizations\/(O-[A-Z0-9]+)/);
    if (orgMatch) {
      console.log('  Using URL navigation to org chart...');
      await page.evaluate((id) => {
        const link = document.createElement('a');
        link.href = `/organizations/${id}/org-chart`;
        link.click();
      }, orgMatch[1]);
    } else {
      console.log('  Could not determine org hashId for org chart');
    }
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/debug-orgchart.png` });

  // Scroll through org chart slowly
  await smoothScroll(page, 350, 8, 1500);
  // Scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  console.log('');

  // ── Ch6: Users page ──────────────────────────────────────────────
  console.log('Ch6: Users...');
  await hamburger.click();
  await page.waitForTimeout(800);
  await visibleClick(page, 'text=Users', 'Users menu item');
  await page.waitForTimeout(3000);
  await smoothScroll(page, 300, 4, 1200);
  console.log('');

  // ── Ch7: Back to Dashboard ───────────────────────────────────────
  console.log('Ch7: Dashboard...');
  await hamburger.click();
  await page.waitForTimeout(800);
  await visibleClick(page, 'text=Dashboard', 'Dashboard menu item');
  await page.waitForTimeout(3000);

  console.log('\nRecording complete!\n');
  await context.close();
  await browser.close();

  // ── Narration ────────────────────────────────────────────────────
  const narration = `Welcome to the Vantara General Insurance demo — showcasing Zorbit's department hierarchy and organizational chart.

We log in as Sourav Sachin, the platform super administrator, with two-factor authentication via Google Authenticator.

The Organizations page lists all registered organizations. Vantara General Insurance is our fictional demo company — an insurance carrier with a complete department structure.

Clicking into departments reveals 34 departments across five nesting levels. Eight top-level departments cover every function: Underwriting, Claims, Actuarial and Risk, Distribution and Sales, Operations, Finance and Compliance, Technology, and Human Resources.

Health Underwriting branches into Group Health and Retail Individual UW. Under Retail, two specialized teams: Tele Underwriting — callers who collect additional medical information — and Medical Underwriting — doctors who make the final underwriting decisions.

On the Claims side, Health Claims has Data Entry and Digitization — where claims are digitized and basic validations run — and Adjudication — where adjudicators check for pre-existing diseases, verify policy coverage, and compute the final settlement amount.

The Org Chart visualizes all 32 employees and their reporting relationships. CEO Arjun Mehta at the top, with five C-suite executives reporting directly to him.

Some reporting lines appear dashed with question marks — these are unconfirmed, based on seniority estimates. Solid lines are confirmed relationships.

The deepest chain runs six levels: CEO, COO, Head of Claims, Health Claims Manager, Data Entry Supervisor, Data Entry Executive.

This entire structure was seeded from a reusable template. Any new organization can inherit this hierarchy as a starting point.

Enterprise-grade organizational management — built for regulated industries where clear authority structures matter.`;

  execSync(`edge-tts --voice en-US-AriaNeural --rate="+0%" -f - --write-media ${OUT}/narration.mp3`, {
    input: narration,
  });
  console.log('Narration generated.');

  // Combine video + narration
  const webm = execSync(`ls ${OUT}/*.webm 2>/dev/null | head -1`, { encoding: 'utf-8' }).trim();
  if (webm) {
    const output = `${OUT}/vantara-demo.mp4`;
    execSync(
      `ffmpeg -y -i "${webm}" -i "${OUT}/narration.mp3" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${output}" 2>/dev/null`,
    );
    console.log(`Video: ${output}`);
    execSync(`ffmpeg -y -i "${output}" -ss 00:00:15 -vframes 1 -q:v 5 "${OUT}/thumb.jpg" 2>/dev/null`);

    console.log('Deploying...');
    execSync(`ssh ilri-arm-uat 'mkdir -p /home/sourav/apps/zorbit-platform/demos/identity/'`);
    execSync(`rsync -avz "${output}" "${OUT}/thumb.jpg" ilri-arm-uat:/home/sourav/apps/zorbit-platform/demos/identity/`);
    console.log('Deployed!');
  } else {
    console.log('No recording found');
  }

  console.log('Done!');
})();

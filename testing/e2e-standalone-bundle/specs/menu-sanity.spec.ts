/**
 * Menu Sanity Spec - Generic Menu Crawler
 *
 * Discovers all navigation links dynamically, clicks each one,
 * and reports which loaded vs errored.
 *
 * Run: ./runme.sh --spec specs/menu-sanity.spec.ts
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const BASE_URL = "https://zorbit.scalatics.com";

// Load credentials from the credentials file
function loadCredentials(): Record<string, Record<string, string>> {
  const credPath = path.join(__dirname, "..", "credentials", "credentials.json");
  if (fs.existsSync(credPath)) {
    return JSON.parse(fs.readFileSync(credPath, "utf-8"));
  }
  throw new Error(`Credentials file not found at ${credPath}`);
}

test.describe("Menu Sanity Crawl", () => {
  test("all menu items load without error", async ({ page }) => {
    const creds = loadCredentials();

    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1500);
    await page.fill(
      "input[type='email'], input[placeholder*='email' i], input[name='email']",
      creds.admin.email
    );
    await page.fill("input[type='password']", creds.admin.password);
    await page.click("button[type='submit'], button:has-text('Sign in'), button:has-text('Login')");
    await page.waitForTimeout(2000);

    // Handle MFA if present
    const mfaInput = page.locator(
      "input[name='totp'], input[placeholder*='code' i], input[type='text'][maxlength='6']"
    );
    if ((await mfaInput.count()) > 0) {
      try {
        const totp = execSync(creds.admin.mfaCommand || "ssh sovpn 'bash /tmp/get-totp.sh'", {
          encoding: "utf-8",
          timeout: 15000,
        }).trim();
        await mfaInput.first().fill(totp);
        await page.click("button[type='submit'], button:has-text('Verify')");
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log("MFA handling failed:", e);
      }
    }

    await page.waitForURL(/(dashboard|home|app)/, { timeout: 20000 });

    // 2. Open hamburger menu and find all navigation links
    await page.click(
      "button[class*='hamburger'], button[aria-label*='menu'], [data-testid='menu-toggle']",
      { force: true }
    );
    await page.waitForTimeout(1000);

    const menuLinks = await page
      .locator("nav a[href], [role='navigation'] a[href], .sidebar a[href], [class*='menu'] a[href]")
      .all();

    const results: { label: string; href: string; status: string }[] = [];
    const visited = new Set<string>();

    for (const link of menuLinks) {
      const href = await link.getAttribute("href");
      const label = (await link.textContent())?.trim() || href || "unknown";
      if (!href || href === "#" || href.startsWith("javascript:") || visited.has(href)) continue;
      visited.add(href);

      try {
        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        await page.goto(fullUrl, { timeout: 15000, waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);

        // Check if page has content (not a blank error page)
        const bodyText = await page.locator("body").textContent();
        const hasContent = bodyText && bodyText.trim().length > 50;

        if (hasContent) {
          results.push({ label, href, status: "OK" });
        } else {
          results.push({ label, href, status: "EMPTY PAGE" });
        }
      } catch (e) {
        results.push({ label, href, status: `FAIL: ${e}` });
      }
    }

    // 3. Report
    console.log("\n====================================");
    console.log("  MENU SANITY CRAWL RESULTS");
    console.log("====================================\n");
    console.table(results);

    const failures = results.filter((r) => r.status !== "OK");
    const successes = results.filter((r) => r.status === "OK");

    console.log(`\nTotal: ${results.length} | OK: ${successes.length} | Failed: ${failures.length}`);

    if (failures.length > 0) {
      console.log("\nFailed items:");
      failures.forEach((f) => console.log(`  - ${f.label} (${f.href}): ${f.status}`));
    }

    expect(failures).toHaveLength(0);
  });
});

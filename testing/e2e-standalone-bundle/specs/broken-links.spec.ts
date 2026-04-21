/**
 * Broken Link Detector Spec
 *
 * Crawls the application starting from the dashboard, discovers all <a> tags,
 * follows each link (same host only), and reports broken ones.
 *
 * Run: ./runme.sh --spec specs/broken-links.spec.ts
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const BASE_URL = "https://zorbit.scalatics.com";
const MAX_PAGES = 100;

function loadCredentials(): Record<string, Record<string, string>> {
  const credPath = path.join(__dirname, "..", "credentials", "credentials.json");
  if (fs.existsSync(credPath)) {
    return JSON.parse(fs.readFileSync(credPath, "utf-8"));
  }
  throw new Error(`Credentials file not found at ${credPath}`);
}

test.describe("Broken Link Detector", () => {
  test("no broken links in the application", async ({ page }) => {
    test.setTimeout(300000); // 5 minutes max

    const creds = loadCredentials();
    const baseHost = new URL(BASE_URL).host;

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

    // Handle MFA
    const mfaInput = page.locator(
      "input[name='totp'], input[placeholder*='code' i], input[type='text'][maxlength='6']"
    );
    if ((await mfaInput.count()) > 0) {
      try {
        const totp = execSync(creds.admin.mfaCommand || "ssh ilri-arm-uat 'bash /tmp/get-totp.sh'", {
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

    // 2. Crawl
    const visited = new Set<string>();
    const broken: { url: string; status: number; source: string }[] = [];
    const working: { url: string; source: string }[] = [];
    const queue: { url: string; source: string }[] = [
      { url: `${BASE_URL}/dashboard`, source: "start" },
    ];

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const { url, source } = queue.shift()!;

      // Normalize URL (remove hash, trailing slash)
      const normalizedUrl = url.split("#")[0].replace(/\/$/, "");
      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      // Skip non-http links, external links, and asset files
      try {
        const parsedUrl = new URL(normalizedUrl);
        if (parsedUrl.host !== baseHost) continue;
        if (/\.(png|jpg|jpeg|gif|svg|css|js|ico|woff|woff2|ttf|eot|map|pdf)$/i.test(parsedUrl.pathname))
          continue;
      } catch {
        continue;
      }

      try {
        const response = await page.goto(normalizedUrl, {
          timeout: 15000,
          waitUntil: "domcontentloaded",
        });

        if (!response || response.status() >= 400) {
          broken.push({
            url: normalizedUrl,
            status: response?.status() || 0,
            source,
          });
          continue;
        }

        working.push({ url: normalizedUrl, source });

        // Wait for content to render
        await page.waitForTimeout(500);

        // Discover new links on this page (same host only)
        const links = await page.locator("a[href]").all();
        for (const link of links) {
          const href = await link.getAttribute("href");
          if (!href) continue;
          if (href === "#" || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;

          try {
            const resolved = new URL(href, normalizedUrl).toString();
            const resolvedNormalized = resolved.split("#")[0].replace(/\/$/, "");
            if (new URL(resolvedNormalized).host === baseHost && !visited.has(resolvedNormalized)) {
              queue.push({ url: resolvedNormalized, source: normalizedUrl });
            }
          } catch {
            /* malformed URL - skip */
          }
        }
      } catch (e) {
        broken.push({ url: normalizedUrl, status: 0, source });
      }
    }

    // 3. Report
    console.log("\n====================================");
    console.log("  BROKEN LINK DETECTOR RESULTS");
    console.log("====================================\n");
    console.log(`Pages crawled: ${visited.size}`);
    console.log(`Working links: ${working.length}`);
    console.log(`Broken links:  ${broken.length}`);

    if (working.length > 0) {
      console.log("\nWorking pages:");
      working.forEach((w) => console.log(`  OK   ${w.url}`));
    }

    if (broken.length > 0) {
      console.log("\nBroken links:");
      console.table(broken);
    }

    expect(broken).toHaveLength(0);
  });
});

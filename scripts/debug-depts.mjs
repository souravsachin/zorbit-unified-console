import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import crypto from 'crypto';

const require = createRequire(import.meta.url);

const mfaSecret = execSync(
  `ssh ilri-arm-uat "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`,
  { encoding: 'utf-8' },
).trim();

const { generateSync } = require('/Users/s/workspace/zorbit/02_repos/zorbit-identity/node_modules/otplib');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// Capture all console errors
page.on('console', msg => {
  if (msg.type() === 'error') console.log('CONSOLE:', msg.text().substring(0, 500));
});
page.on('pageerror', err => console.log('PAGE_ERROR:', err.message.substring(0, 500)));

// Login
await page.goto('https://zorbit.scalatics.com/login');
await page.waitForTimeout(2000);
await page.type('input[type="email"]', 's@onezippy.ai', { delay: 20 });
await page.type('input[type="password"]', 's@2021#cz', { delay: 20 });
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

// MFA
const code = generateSync({ secret: mfaSecret });
const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
await mfaInput.waitFor({ timeout: 8000 });
await mfaInput.type(code, { delay: 50 });
await page.locator('button:has-text("Verify")').first().click();
await page.waitForTimeout(5000);

console.log('Logged in. Current URL:', page.url());

// Navigate to departments
await page.goto('https://zorbit.scalatics.com/organizations/O-77E0/departments');
await page.waitForTimeout(5000);

// Capture error details
const errorText = await page.locator('.text-red-400, .text-red-500, .font-mono.text-xs').allTextContents().catch(() => []);
const h2Text = await page.locator('h2').allTextContents().catch(() => []);
console.log('H2:', h2Text);
console.log('Error text:', errorText);
console.log('URL:', page.url());

await page.screenshot({ path: '/tmp/debug-depts-auth.png' });
console.log('Screenshot saved');

await browser.close();

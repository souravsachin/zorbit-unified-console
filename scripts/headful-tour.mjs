import { chromium } from 'playwright';
import { execSync } from 'child_process';

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

(async () => {
  console.log('Starting headful tour...');
  const mfaSecret = getMfaSecret();

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 's@onezippy.ai');
  await page.fill('input[type="password"]', 's@2021#cz');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const code = generateTotp(mfaSecret);
  const mfaInput = page.locator('input[inputmode="numeric"], input[maxlength="6"]').first();
  await mfaInput.waitFor({ timeout: 5000 });
  await mfaInput.type(code, { delay: 150 });
  await page.locator('button:has-text("Verify")').first().click();
  await page.waitForTimeout(4000);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(3000);
  console.log('Logged in!');

  const pages = [
    ['/support-center', 'Support Center', 5000],
    ['/support-center/guide/videos', 'Video Tutorials', 5000],
    ['/data-table-demo', 'DataTable LIVE', 6000],
    ['/form-builder/render/pcg4-configuration-fb', 'FormBuilder Render', 6000],
    ['/workflow-engine/guide', 'FQP Workflow Engine', 4000],
    ['/workflow-engine/filters', 'FQP Filters', 4000],
    ['/secrets/guide', 'Secrets Vault', 4000],
    ['/voice-engine/demo', 'Voice Engine TTS', 4000],
    ['/jayna/agents', 'Jayna Agents', 4000],
    ['/jayna/test-call', 'Jayna Test Call', 5000],
    ['/uw-workflow', 'UW Workflow', 4000],
    ['/uw-workflow/wf/new-quotations-l1', 'UW Queue', 5000],
    ['/hi-decisioning/rules', 'Decisioning Rules', 4000],
    ['/settings/security', 'Security Settings', 4000],
    ['/admin/developer', 'Developer Tools', 4000],
  ];

  for (const [url, label, wait] of pages) {
    console.log(`→ ${label}`);
    await page.goto(`${BASE}${url}`);
    await page.waitForTimeout(wait);
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
  }

  console.log('\nTour complete! Browser stays open — explore freely.');
  console.log('It will close automatically in 5 minutes.');
  await page.waitForTimeout(300000);
  await browser.close();
})();

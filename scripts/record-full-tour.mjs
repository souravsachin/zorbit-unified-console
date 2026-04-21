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

function narrate(text) {
  const file = `/tmp/narr-${Date.now()}.mp3`;
  execSync(`edge-tts --voice en-US-AriaNeural --rate="+5%" --text "${text.replace(/"/g, '\\"')}" --write-media ${file} 2>/dev/null`);
  return file;
}

(async () => {
  console.log('=== Full Platform Tour ===\n');
  const mfaSecret = getMfaSecret();
  const dir = './scripts/recordings/full-tour';
  mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  // Login
  console.log('1. Login...');
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

  // Tour pages
  const pages = [
    { url: '/data-table-demo', wait: 5000, label: '2. DataTable LIVE' },
    { url: '/form-builder/templates', wait: 3000, label: '3. FormBuilder Templates' },
    { url: '/form-builder/render/pcg4-configuration-fb', wait: 5000, label: '4. FormBuilder Render' },
    { url: '/workflow-engine/guide', wait: 3000, label: '5. FQP Workflow Engine' },
    { url: '/workflow-engine/filters', wait: 3000, label: '6. FQP Filters' },
    { url: '/workflow-engine/queues', wait: 3000, label: '7. FQP Queues' },
    { url: '/workflow-engine/pipelines', wait: 3000, label: '8. FQP Pipelines' },
    { url: '/secrets/guide', wait: 3000, label: '9. Secrets Vault' },
    { url: '/secrets/list', wait: 3000, label: '10. Secrets List' },
    { url: '/voice-engine/demo', wait: 3000, label: '11. Voice Engine TTS' },
    { url: '/jayna/agents', wait: 3000, label: '12. Jayna Agents' },
    { url: '/jayna/workflows', wait: 3000, label: '13. Jayna Workflows' },
    { url: '/jayna/test-call', wait: 3000, label: '14. Jayna Test Call' },
    { url: '/uw-workflow', wait: 3000, label: '15. UW Workflow Dashboard' },
    { url: '/uw-workflow/wf/new-quotations-l1', wait: 3000, label: '16. UW Queues' },
    { url: '/hi-decisioning/rules', wait: 3000, label: '17. Decisioning Rules' },
    { url: '/settings/security', wait: 3000, label: '18. Security (MFA + Passkeys)' },
    { url: '/admin/developer', wait: 3000, label: '19. Developer Tools' },
    { url: '/support-center/guide/videos', wait: 3000, label: '20. Support Center Videos' },
  ];

  for (const p of pages) {
    console.log(`${p.label}...`);
    await page.goto(`${BASE}${p.url}`);
    await page.waitForTimeout(p.wait);
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
  }

  console.log('Recording complete!');
  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  // Generate narration
  console.log('\nGenerating narration...');
  const narrationText = `Welcome to the Zorbit Platform full tour. Let me show you everything we've built.

First, the DataTable. This is live data — 79 real underwriting quotations displayed with sorting, search, pagination, and PII masking. You can switch between queue tabs and export to CSV.

Next, the FormBuilder. Here are our form templates. Let me render one — this is the PCG4 Product Configuration wizard, a multi-step form rendered entirely from a JSON schema.

Now the FQP Workflow Engine — our newest platform service. Filters with recursive conditions, queues that combine filters, and pipelines with human, moderated, and automated stages.

The Secrets Vault — AES-256 encrypted storage for all API credentials. Every access is audit-logged. OpenAI, Gemini, and SendGrid keys are securely stored here.

The Voice Engine — text-to-speech using Edge TTS with multiple voice options.

Jayna AI — our agentic calling platform. AI agents with configurable voice and language models, conversation workflows, and a test call interface.

The UW Workflow with 13 specialized queues and 78 quotations. The Decisioning Engine with 15 rules for automated underwriting.

Security Settings showing MFA and Passkey management. Developer Tools with in-browser health checking.

And finally, the Support Center with narrated video tutorials.

This is the Zorbit Platform — 25 plus microservices, three architectural pillars, and a foundation ready for rapid module development.`;

  const audioFile = narrate(narrationText);

  // Convert and combine
  console.log('Converting video...');
  const webm = execSync(`ls ${dir}/*.webm | head -1`, { encoding: 'utf-8' }).trim();
  const output = `${dir}/zorbit-full-tour-narrated.mp4`;
  execSync(`ffmpeg -y -i "${webm}" -i "${audioFile}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${output}" 2>/dev/null`);
  console.log(`Output: ${output}`);

  // Deploy
  console.log('Deploying...');
  try {
    execSync(`ssh ilri-arm-uat 'mkdir -p /home/sourav/apps/zorbit-platform/demos/full-tour/'`);
    execSync(`rsync -avz "${output}" ilri-arm-uat:/home/sourav/apps/zorbit-platform/demos/full-tour/`);
    console.log('Deployed!');
  } catch (e) {
    console.log('Deploy note:', e.message);
  }

  console.log('\nDone!');
})();

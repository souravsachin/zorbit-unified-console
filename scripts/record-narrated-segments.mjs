import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const BASE = 'https://zorbit.scalatics.com';
const OUT_DIR = './scripts/recordings/segments-v2/desktop';
const VIEWPORT = { width: 1920, height: 1080 };

// ================================================================
// MFA helpers
// ================================================================
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

// ================================================================
// UI helpers
// ================================================================
async function typeAnimated(page, selector, text, delay = 45) {
  await page.click(selector);
  await page.waitForTimeout(150);
  await page.type(selector, text, { delay });
}

async function smoothScroll(page, distance = 300) {
  await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), distance);
  await page.waitForTimeout(500);
}

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(500);
}

// ================================================================
// Narration generation (edge-tts + ffmpeg combine)
// ================================================================
function generateNarration(text, outputMp3) {
  console.log(`    Generating narration...`);
  const escaped = text.replace(/"/g, '\\"');
  execSync(
    `edge-tts --voice "en-US-AriaNeural" --text "${escaped}" --write-media "${outputMp3}"`,
    { stdio: 'pipe' }
  );
}

function combineVideoNarration(videoWebm, narrationMp3, outputMp4) {
  console.log(`    Combining video + narration...`);
  // Get durations
  const videoDur = parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoWebm}"`, { encoding: 'utf-8' }).trim()
  );
  const audioDur = parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${narrationMp3}"`, { encoding: 'utf-8' }).trim()
  );
  console.log(`    Video: ${videoDur.toFixed(1)}s, Narration: ${audioDur.toFixed(1)}s`);

  // Use the longer duration as the target
  const targetDur = Math.max(videoDur, audioDur);

  // If video is shorter than audio, slow it down; if longer, keep as is
  // Use complex filter: pad video to match audio length if needed
  execSync(
    `ffmpeg -y -i "${videoWebm}" -i "${narrationMp3}" \
      -filter_complex "[0:v]setpts=PTS*${(targetDur / videoDur).toFixed(4)}[v]" \
      -map "[v]" -map 1:a \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k \
      -shortest \
      "${outputMp4}"`,
    { stdio: 'pipe' }
  );
}

// ================================================================
// Login (only for segment 01, records the login process)
// ================================================================
async function performLogin(page, mfaSecret) {
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

  // Clear sessionStorage for fresh menu
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForTimeout(2500);
}

// ================================================================
// Segment definitions
// ================================================================
const SEGMENTS = [
  {
    name: '01-login-mfa',
    narration: 'Welcome to Zorbit. We begin with secure two-factor authentication. Enter your credentials, then the 6-digit code from your authenticator app.',
    needsLogin: true,
    record: async (page, mfaSecret) => {
      // This segment records the login flow itself
      await page.goto(`${BASE}/login`);
      await page.waitForTimeout(2000);
      await typeAnimated(page, 'input[type="email"]', 's@onezippy.ai');
      await page.waitForTimeout(500);
      await typeAnimated(page, 'input[type="password"]', 's@2021#cz');
      await page.waitForTimeout(500);
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

      // Show the dashboard after login
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      await page.waitForTimeout(3000);
    },
  },
  {
    name: '02-product-config',
    narration: 'The Product Configurator lets you define insurance products through an 8-step wizard. Here we see the AWNIC Dubai health insurance product with plans, encounters, and benefits.',
    record: async (page) => {
      await page.goto(`${BASE}/app/pcg4/configurations`);
      await page.waitForTimeout(3000);
      try {
        await page.locator('text=AWNIC').first().click({ timeout: 3000 });
        await page.waitForTimeout(3000);
        // Walk through wizard steps
        for (let i = 0; i < 3; i++) {
          await smoothScroll(page, 250);
          await page.waitForTimeout(1500);
        }
        await scrollToTop(page);
        await page.waitForTimeout(1000);
        // Try clicking through a few tabs/steps
        try {
          const tabs = page.locator('[role="tab"], .step-tab, .wizard-step');
          const count = await tabs.count();
          for (let i = 1; i < Math.min(count, 4); i++) {
            await tabs.nth(i).click();
            await page.waitForTimeout(2000);
            await smoothScroll(page, 200);
            await page.waitForTimeout(1000);
          }
        } catch (e) {}
      } catch (e) {}
      await page.waitForTimeout(2000);
    },
  },
  {
    name: '03-rate-tables',
    narration: 'Rate tables store premium rates by age band, gender, and network. The calculator instantly looks up any combination.',
    record: async (page) => {
      await page.goto(`${BASE}/product-pricing/rate-tables`);
      await page.waitForTimeout(3000);
      try {
        await page.locator('text=AWNIC').first().click({ timeout: 3000 });
        await page.waitForTimeout(3000);
        await smoothScroll(page, 300);
        await page.waitForTimeout(2000);
        await smoothScroll(page, 300);
        await page.waitForTimeout(2000);
      } catch (e) {}
      // Try the calculator
      try {
        await page.goto(`${BASE}/product-pricing/calculator`);
        await page.waitForTimeout(3000);
        await smoothScroll(page, 200);
        await page.waitForTimeout(2000);
      } catch (e) {}
      await page.waitForTimeout(2000);
    },
  },
  {
    name: '04-uw-workflow',
    narration: 'The underwriting workflow engine manages 13 specialized queues. New applications flow through STP auto-approval or manual review. Every action is audited.',
    record: async (page) => {
      await page.goto(`${BASE}/uw-workflow`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
      // Visit a few queues
      const queues = ['new-quotations-l1', 'stp-approved', 'nstp-review', 'approved'];
      for (const q of queues) {
        await page.goto(`${BASE}/uw-workflow/wf/${q}`);
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
  },
  {
    name: '05-decisioning',
    narration: 'The decisioning engine evaluates applications against 15 rules covering medical conditions, age, BMI, and occupation risk. Loading tables define exact risk percentages.',
    record: async (page) => {
      await page.goto(`${BASE}/hi-decisioning/rules`);
      await page.waitForTimeout(3000);
      try {
        await page.locator('text=Diabetes').first().click({ timeout: 2000 });
        await page.waitForTimeout(2500);
      } catch (e) {}
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
      // STP criteria
      await page.goto(`${BASE}/hi-decisioning/stp-criteria`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 200);
      await page.waitForTimeout(1500);
      // Evaluations
      await page.goto(`${BASE}/hi-decisioning/evaluations`);
      await page.waitForTimeout(3000);
      await page.waitForTimeout(2000);
    },
  },
  {
    name: '06-payment',
    narration: 'After approval, a payment link is generated. The customer sees a professional payment gateway. Upon completion, the policy is issued.',
    record: async (page) => {
      await page.goto(`${BASE}/uw-workflow/wf/approved`);
      await page.waitForTimeout(3000);
      try {
        await page.locator('tbody tr').first().click({ timeout: 2000 });
        await page.waitForTimeout(3000);
        await smoothScroll(page, 400);
        await page.waitForTimeout(2000);
        await smoothScroll(page, 400);
        await page.waitForTimeout(2000);
      } catch (e) {}
      await page.waitForTimeout(2000);
    },
  },
  {
    name: '07-jayna-ai',
    narration: 'Jayna AI enables agentic calling workflows. Configure agents with voice and language model settings. Define conversation workflows. Test calls directly from the browser.',
    record: async (page) => {
      // Try various possible routes for Jayna AI
      await page.goto(`${BASE}/jayna`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
      // Agent config
      try {
        await page.goto(`${BASE}/jayna/agents`);
        await page.waitForTimeout(3000);
        await smoothScroll(page, 200);
        await page.waitForTimeout(2000);
      } catch (e) {}
      // Workflows
      try {
        await page.goto(`${BASE}/jayna/workflows`);
        await page.waitForTimeout(3000);
        await smoothScroll(page, 200);
        await page.waitForTimeout(2000);
      } catch (e) {}
      await page.waitForTimeout(2000);
    },
  },
  {
    name: '08-voice-engine',
    narration: 'The Voice Engine provides text-to-speech and speech-to-text as platform services. Multiple engines supported including Edge TTS and Whisper.',
    record: async (page) => {
      // Try various possible routes for voice engine
      await page.goto(`${BASE}/voice-engine`);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 300);
      await page.waitForTimeout(2000);
      try {
        await page.goto(`${BASE}/voice-engine/tts`);
        await page.waitForTimeout(3000);
        await smoothScroll(page, 200);
        await page.waitForTimeout(2000);
      } catch (e) {}
      try {
        await page.goto(`${BASE}/voice-engine/stt`);
        await page.waitForTimeout(3000);
        await smoothScroll(page, 200);
        await page.waitForTimeout(2000);
      } catch (e) {}
      await page.waitForTimeout(2000);
    },
  },
];

// ================================================================
// Find the recorded webm file in a directory
// ================================================================
function findWebm(dir) {
  const files = readdirSync(dir).filter(f => f.endsWith('.webm'));
  if (files.length === 0) throw new Error(`No .webm files found in ${dir}`);
  return join(dir, files[files.length - 1]);
}

// ================================================================
// Main
// ================================================================
(async () => {
  console.log('\n=== Recording Narrated Segments (v2) ===\n');
  console.log(`Output: ${OUT_DIR}\n`);

  mkdirSync(OUT_DIR, { recursive: true });

  const mfaSecret = getMfaSecret();
  console.log('MFA secret retrieved.\n');

  const requestedSegment = process.argv[2];
  const segmentsToRecord = requestedSegment
    ? SEGMENTS.filter(s => s.name === requestedSegment || s.name.startsWith(requestedSegment))
    : SEGMENTS;

  if (segmentsToRecord.length === 0) {
    console.error(`No segment matching "${requestedSegment}". Available:`);
    SEGMENTS.forEach(s => console.error(`  ${s.name}`));
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // Step 1: Launch browser, login ONCE, save context
  // ---------------------------------------------------------------
  console.log('Launching browser and logging in...');
  const browser = await chromium.launch({ headless: true });
  const loginContext = await browser.newContext({ viewport: VIEWPORT });
  const loginPage = await loginContext.newPage();

  await performLogin(loginPage, mfaSecret);
  console.log('Login successful. Saving browser state.\n');

  // Save storage state (cookies + localStorage)
  const storageState = await loginContext.storageState();
  await loginPage.close();
  await loginContext.close();

  // ---------------------------------------------------------------
  // Step 2: Record each segment
  // ---------------------------------------------------------------
  for (const segment of segmentsToRecord) {
    console.log(`\n--- Recording: ${segment.name} ---`);

    const segDir = join(OUT_DIR, `_raw_${segment.name}`);
    mkdirSync(segDir, { recursive: true });

    // Create a new context with saved state (already logged in)
    // For segment 01, we don't reuse state (it records the login)
    const contextOpts = {
      viewport: VIEWPORT,
      recordVideo: { dir: segDir, size: VIEWPORT },
    };
    if (!segment.needsLogin) {
      contextOpts.storageState = storageState;
    }

    const context = await browser.newContext(contextOpts);
    const page = await context.newPage();

    try {
      await segment.record(page, mfaSecret);
      await page.waitForTimeout(1500);
    } catch (e) {
      console.error(`  ERROR in ${segment.name}: ${e.message}`);
    }

    // Close context to finalize video
    await page.close();
    await context.close();

    // Find the recorded webm
    let webmPath;
    try {
      webmPath = findWebm(segDir);
      console.log(`  Recorded: ${webmPath}`);
    } catch (e) {
      console.error(`  ${e.message}`);
      continue;
    }

    // Generate narration
    const mp3Path = join(OUT_DIR, `${segment.name}.mp3`);
    generateNarration(segment.narration, mp3Path);

    // Combine video + narration
    const mp4Path = join(OUT_DIR, `${segment.name}.mp4`);
    combineVideoNarration(webmPath, mp3Path, mp4Path);

    console.log(`  Output: ${mp4Path}`);

    // Cleanup temp files
    try { unlinkSync(mp3Path); } catch (e) {}
  }

  await browser.close();

  // ---------------------------------------------------------------
  // Step 3: Summary
  // ---------------------------------------------------------------
  console.log('\n=== Recording Complete ===\n');
  console.log(`Output directory: ${OUT_DIR}/`);
  const mp4s = readdirSync(OUT_DIR).filter(f => f.endsWith('.mp4'));
  mp4s.forEach(f => console.log(`  ${f}`));

  // ---------------------------------------------------------------
  // Step 4: Deploy to server
  // ---------------------------------------------------------------
  console.log('\nDeploying to server...');
  try {
    execSync(
      `rsync -avz --progress ${OUT_DIR}/*.mp4 ilri-arm-uat:/var/www/zorbit-demos/segments-v2/desktop/`,
      { stdio: 'inherit' }
    );
    console.log('Deployed successfully!');
  } catch (e) {
    console.error(`Deploy failed: ${e.message}`);
    console.log('You can manually deploy with:');
    console.log(`  rsync -avz ${OUT_DIR}/*.mp4 ilri-arm-uat:/var/www/zorbit-demos/segments-v2/desktop/`);
  }

  console.log('\nDone!\n');
})();

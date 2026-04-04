import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const BASE = 'https://zorbit.scalatics.com';
const OUT = './scripts/recordings/identity-tutorial';
mkdirSync(OUT, { recursive: true });

function getMfaSecret() {
  return execSync(
    `ssh sovpn "docker exec zorbit-identity-db psql -U zorbit -d zorbit_identity -t -A -c \\"SELECT mfa_secret FROM users WHERE \\\\\\\"hashId\\\\\\\" = 'U-0113'\\""`,
    { encoding: 'utf-8' }
  ).trim();
}

function generateTotp(secret) {
  return execSync(
    `ssh sovpn "source ~/.nvm/nvm.sh && nvm use 20 > /dev/null 2>&1 && node -e \\"const {generateSync}=require('/home/sourav/apps/zorbit-platform/zorbit-identity/node_modules/otplib'); console.log(generateSync({secret:'${secret}'}))\\"" 2>/dev/null`,
    { encoding: 'utf-8' }
  ).trim();
}

(async () => {
  console.log('=== Identity Tutorial Recording ===\n');
  const mfaSecret = getMfaSecret();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  // Ch1: Login with MFA
  console.log('Ch1: Login with MFA...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  await page.type('input[type="email"]', 's@onezippy.ai', { delay: 40 });
  await page.type('input[type="password"]', 's@2021#cz', { delay: 30 });
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

  // Ch2: Identity Guide
  console.log('Ch2: Identity Guide...');
  await page.goto(`${BASE}/identity/guide`);
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);

  // Ch3: Organizations
  console.log('Ch3: Organizations...');
  await page.goto(`${BASE}/organizations`);
  await page.waitForTimeout(3000);

  // Ch4: Users + Create User with Role
  console.log('Ch4: Users + Roles...');
  await page.goto(`${BASE}/users`);
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await page.waitForTimeout(2000);

  // Ch5: Roles page
  console.log('Ch5: Roles...');
  await page.goto(`${BASE}/roles`);
  await page.waitForTimeout(3000);

  // Ch6: Security Settings (MFA + Passkeys + Sessions + Compliance)
  console.log('Ch6: Security Settings...');
  await page.goto(`${BASE}/settings/security`);
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);

  // Ch7: Login page showing all auth methods
  console.log('Ch7: Auth Methods on Login...');
  // Open a new tab to show login page without logging out
  const loginPage = await context.newPage();
  await loginPage.goto(`${BASE}/login`);
  await loginPage.waitForTimeout(3000);
  // Show "More sign-in options"
  try {
    await loginPage.locator('text=More sign-in options').click({ timeout: 2000 });
    await loginPage.waitForTimeout(2000);
  } catch(e) {}
  // Show forgot password link
  await loginPage.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
  await loginPage.waitForTimeout(2000);
  await loginPage.close();

  // Ch8: Back to dashboard
  console.log('Ch8: Closing...');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForTimeout(3000);

  console.log('\nRecording complete! Generating narration...');
  await page.waitForTimeout(1000);
  await context.close();
  await browser.close();

  // Generate narration
  const narration = `Welcome to the Zorbit Identity Service — your central authentication authority.

This tutorial covers all identity management features, compliant with NIST SP 800-63B and OWASP security guidelines.

First, login with two-factor authentication. After entering credentials, a six-digit code from your authenticator app is required. Passwords are SHA-256 hashed on the client — never sent in plaintext.

The Identity Guide page shows all capabilities: 13 authentication methods including fingerprint login via WebAuthn, QR code cross-device login, magic link, and email OTP. Plus password security with strength meters, auto-generate, and configurable rotation policies.

Organization management supports multiple types: Insurer, Cedent, Broker, TPA, Regulator, and Healthcare Provider. Each organization has its own security policies — password rotation, geo-restriction, and IP whitelisting.

The Users page enables creating accounts with role assignment. Super Admins are guided to create Org Admins first. Password fields include strength meters, auto-generate, and eye toggle. Admins can reset passwords with force-change-on-next-login and email notification. The impersonation feature lets admins view as any user for debugging with full audit trail.

The Roles page manages role-based access control. Six pre-built roles cover Product Designer, Actuary, Quotation Officer, Medical Underwriter, UW Rules Administrator, and Broker.

Security Settings is the heart of identity management. MFA setup with Google Authenticator and backup codes. Passkey management for fingerprint and Face ID login. Change password with MFA verification. Active sessions list with device information and revoke capability. Login activity history. Geo and IP restrictions configurable per organization. And compliance badges linking to NIST and OWASP standard documents.

The login page offers 13 methods: password, passkey, QR code, magic link, email OTP, Google, GitHub, LinkedIn, and more. Forgot password sends a magic link for secure recovery. Account lockout activates after five failed attempts with a fifteen-minute cooldown.

This is enterprise-grade identity management — built for regulated industries where security is not optional.`;

  execSync(`edge-tts --voice en-US-AriaNeural --rate="+0%" -f - --write-media ${OUT}/narration.mp3`, {
    input: narration,
  });
  console.log('Narration generated.');

  // Convert and combine
  const webm = execSync(`ls ${OUT}/*.webm | head -1`, { encoding: 'utf-8' }).trim();
  const output = `${OUT}/zorbit-identity-tutorial.mp4`;
  execSync(`ffmpeg -y -i "${webm}" -i "${OUT}/narration.mp3" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${output}" 2>/dev/null`);
  console.log(`Video: ${output}`);

  // Generate thumbnail
  execSync(`ffmpeg -y -i "${output}" -ss 00:00:10 -vframes 1 -q:v 5 "${OUT}/thumb.jpg" 2>/dev/null`);

  // Deploy
  console.log('Deploying...');
  execSync(`ssh sovpn 'mkdir -p /home/sourav/apps/zorbit-platform/demos/identity/'`);
  execSync(`rsync -avz "${output}" "${OUT}/thumb.jpg" sovpn:/home/sourav/apps/zorbit-platform/demos/identity/`);
  execSync(`rsync -avz "${output}" "${OUT}/thumb.jpg" sovpn:/var/www/zorbit-demos/tmp/identity/ 2>/dev/null || true`);

  console.log('Done!');
})();

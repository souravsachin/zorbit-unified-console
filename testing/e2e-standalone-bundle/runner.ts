/**
 * Zorbit Unified Console - Standalone E2E Test Runner
 * Skill: 1023 (Standalone E2E Test Bundle)
 * Dependencies: playwright, tsx, typescript
 *
 * Complete interactive E2E test runner with arrow-key menu, voice narration,
 * and Playwright browser automation. Data-driven via JSON configs.
 *
 * Usage:
 *   1. Run: ./runme.sh                    (interactive menu)
 *   2. Run: ./runme.sh --list             (list all tests)
 *   3. Run: ./runme.sh -c smoke-test.json (run specific config)
 *   4. Run: ./runme.sh smoke-test         (auto-detect target)
 */

import { chromium, Browser, Page } from "playwright";
import { exec, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ============================================================================
// Types
// ============================================================================

interface Step {
  action: string;
  url?: string;
  selector?: string;
  value?: string;
  pattern?: string;
  endpoint?: string;
  expectedStatus?: number[];
  timeout?: number;
  waitAfterAction?: number;
  waitForNetworkIdle?: boolean;
  force?: boolean;
  description?: string;
  handler?: string;
  params?: Record<string, string>;
  announce?: { before?: string; after?: string };
}

interface Segment {
  name: string;
  description: string;
  steps: Step[];
}

interface Journey {
  name: string;
  description: string;
  segments: string[];
}

interface Bouquet {
  name: string;
  description: string;
  mode: "sequential" | "parallel";
  journeys: string[];
}

interface Config {
  baseUrl: string;
  credentials: Record<string, Record<string, string>>;
  viewport?: { width: number; height: number };
  defaults: {
    timeout: number;
    waitAfterAction: number;
    waitForNetworkIdle: boolean;
  };
  segments: Record<string, Segment>;
  journeys: Record<string, Journey>;
  bouquets: Record<string, Bouquet>;
}

interface MenuItem {
  label: string;
  type: "config" | "bouquet" | "journey" | "segment" | "action";
  value: string;
  description?: string;
}

// ============================================================================
// Paths and Globals
// ============================================================================

const BUNDLE_ROOT = __dirname;
const CONFIGS_DIR = path.join(BUNDLE_ROOT, "configs");
const CREDENTIALS_DIR = path.join(BUNDLE_ROOT, "credentials");
const OUTPUTS_DIR = path.join(BUNDLE_ROOT, "outputs");

if (!fs.existsSync(OUTPUTS_DIR)) {
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

let currentConfig: Config | null = null;
let currentConfigName: string = "";
let runOutputDir: string = OUTPUTS_DIR;

// Execution status for display
let executionStatus = {
  bouquet: "",
  journey: "",
  segment: "",
  step: "",
  stepNum: 0,
  totalSteps: 0,
  startTime: 0,
  passed: 0,
  failed: 0,
};

// Structured log for Claude session consumption
interface StepResult {
  segment: string;
  journey: string;
  step: number;
  action: string;
  selector?: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration_ms: number;
  screenshot?: string;
  timestamp: string;
}
const testLog: StepResult[] = [];

function logStep(result: Omit<StepResult, 'timestamp'>) {
  testLog.push({ ...result, timestamp: new Date().toISOString() });
}

// CLI options
const args = process.argv.slice(2);
const cliOptions = {
  headless: args.includes("--headless"),
  noVoice: args.includes("--no-voice"),
  interactive: args.includes("--interactive") || args.includes("-i"),
  help: args.includes("--help") || args.includes("-h"),
  list: args.includes("--list"),
  config: args.find((_, i) => args[i - 1] === "-c" || args[i - 1] === "--config"),
  spec: args.find((_, i) => args[i - 1] === "--spec"),
  bouquet: args.find((_, i) => args[i - 1] === "-b" || args[i - 1] === "--bouquet"),
  journey: args.find((_, i) => args[i - 1] === "-j" || args[i - 1] === "--journey"),
  segment: args.find((_, i) => args[i - 1] === "-s" || args[i - 1] === "--segment"),
  targets: args.filter(
    (a, i) =>
      !a.startsWith("-") &&
      args[i - 1] !== "-c" &&
      args[i - 1] !== "--config" &&
      args[i - 1] !== "--spec" &&
      args[i - 1] !== "-b" &&
      args[i - 1] !== "--bouquet" &&
      args[i - 1] !== "-j" &&
      args[i - 1] !== "--journey" &&
      args[i - 1] !== "-s" &&
      args[i - 1] !== "--segment"
  ),
};

// ============================================================================
// Terminal UI with Scrolling
// ============================================================================

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  bgBlue: "\x1b[44m",
  bgCyan: "\x1b[46m",
  white: "\x1b[37m",
  bgGray: "\x1b[100m",
};

function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

function hideCursor(): void {
  process.stdout.write("\x1b[?25l");
}

function showCursor(): void {
  process.stdout.write("\x1b[?25h");
}

function formatTime(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function renderMenu(
  items: MenuItem[],
  selectedIndex: number,
  scrollOffset: number,
  breadcrumb: string[]
): void {
  const { rows, cols } = getTerminalSize();
  const maxWidth = cols - 4;

  clearScreen();

  // Header
  console.log(
    `${COLORS.cyan}${"=".repeat(Math.min(60, cols - 2))}${COLORS.reset}`
  );
  const title = "  Zorbit Unified Console E2E Test Runner";
  console.log(
    `${COLORS.cyan}${COLORS.bright}${title}${" ".repeat(Math.max(0, Math.min(60, cols - 2) - title.length))}${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}${"=".repeat(Math.min(60, cols - 2))}${COLORS.reset}`
  );

  // Breadcrumb
  const crumb = breadcrumb.length > 0 ? breadcrumb.join(" > ") : "Home";
  console.log(`${COLORS.dim}  ${truncate(crumb, maxWidth - 3)}${COLORS.reset}`);
  console.log(
    `${COLORS.dim}  Up/Down Navigate  Enter Select  Esc Back  q Quit${COLORS.reset}`
  );
  console.log();

  // Visible area
  const headerLines = 6;
  const footerLines = 3;
  const visibleItems = Math.max(1, rows - headerLines - footerLines);

  if (selectedIndex < scrollOffset) scrollOffset = selectedIndex;
  else if (selectedIndex >= scrollOffset + visibleItems)
    scrollOffset = selectedIndex - visibleItems + 1;

  const hasScrollUp = scrollOffset > 0;
  const hasScrollDown = scrollOffset + visibleItems < items.length;

  if (hasScrollUp)
    console.log(
      `${COLORS.dim}   [up] ${scrollOffset} more above${COLORS.reset}`
    );

  const startIdx = scrollOffset;
  const endIdx = Math.min(
    startIdx +
      visibleItems -
      (hasScrollUp ? 1 : 0) -
      (hasScrollDown ? 1 : 0),
    items.length
  );

  for (let i = startIdx; i < endIdx; i++) {
    const item = items[i];
    const isSelected = i === selectedIndex;
    const prefix = isSelected
      ? `${COLORS.bgBlue}${COLORS.white} > `
      : "   ";
    const suffix = isSelected ? ` ${COLORS.reset}` : "";

    let icon = "";
    switch (item.type) {
      case "config":
        icon = "[C]";
        break;
      case "bouquet":
        icon = "[B]";
        break;
      case "journey":
        icon = "[J]";
        break;
      case "segment":
        icon = "[S]";
        break;
      case "action":
        icon = "[>]";
        break;
    }

    const label = `${icon} ${item.label}`;
    const desc =
      item.description
        ? ` ${COLORS.dim}- ${item.description}${COLORS.reset}`
        : "";
    const line = truncate(
      `${label}${isSelected ? "" : desc}`,
      maxWidth
    );
    console.log(`${prefix}${line}${suffix}`);
  }

  if (hasScrollDown)
    console.log(
      `${COLORS.dim}   [down] ${items.length - scrollOffset - visibleItems + (hasScrollUp ? 1 : 0)} more below${COLORS.reset}`
    );

  console.log();
  console.log(
    `${COLORS.dim}${"-".repeat(Math.min(60, cols - 2))}${COLORS.reset}`
  );
  console.log(
    `${COLORS.dim}Items: ${selectedIndex + 1}/${items.length}${COLORS.reset}`
  );
}

async function interactiveMenu(
  items: MenuItem[],
  breadcrumb: string[] = []
): Promise<{ item: MenuItem | null; scrollOffset: number }> {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    let scrollOffset = 0;

    const render = () => {
      const { rows } = getTerminalSize();
      const visibleRows = rows - 9;
      if (selectedIndex < scrollOffset) scrollOffset = selectedIndex;
      else if (selectedIndex >= scrollOffset + visibleRows)
        scrollOffset = selectedIndex - visibleRows + 1;
      renderMenu(items, selectedIndex, scrollOffset, breadcrumb);
    };

    render();
    hideCursor();

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.removeListener("data", onKeyPress);
      showCursor();
    };

    const onKeyPress = (key: string) => {
      const { rows } = getTerminalSize();
      const pageSize = Math.max(1, rows - 10);

      if (key === "\u0003") {
        cleanup();
        clearScreen();
        process.exit(0);
      }
      if (key === "q" || key === "Q") {
        cleanup();
        resolve({ item: null, scrollOffset });
        return;
      }
      if (key === "\u001b" || key === "\u001b[D") {
        cleanup();
        resolve({
          item: { label: "__BACK__", type: "action", value: "__BACK__" },
          scrollOffset,
        });
        return;
      }
      if (key === "\u001b[A") {
        selectedIndex =
          (selectedIndex - 1 + items.length) % items.length;
        render();
        return;
      }
      if (key === "\u001b[B") {
        selectedIndex = (selectedIndex + 1) % items.length;
        render();
        return;
      }
      if (key === "\u001b[5~") {
        selectedIndex = Math.max(0, selectedIndex - pageSize);
        render();
        return;
      }
      if (key === "\u001b[6~") {
        selectedIndex = Math.min(
          items.length - 1,
          selectedIndex + pageSize
        );
        render();
        return;
      }
      if (key === "\u001b[H" || key === "\u001b[1~") {
        selectedIndex = 0;
        render();
        return;
      }
      if (key === "\u001b[F" || key === "\u001b[4~") {
        selectedIndex = items.length - 1;
        render();
        return;
      }
      if (key === "\r" || key === "\u001b[C") {
        cleanup();
        resolve({ item: items[selectedIndex], scrollOffset });
        return;
      }

      const num = parseInt(key);
      if (
        !isNaN(num) &&
        num >= 1 &&
        num <= Math.min(9, items.length)
      ) {
        selectedIndex = num - 1;
        cleanup();
        resolve({ item: items[selectedIndex], scrollOffset });
      }
    };

    stdin.on("data", onKeyPress);
  });
}

// ============================================================================
// Execution Display
// ============================================================================

function renderExecutionStatus(): void {
  const { cols } = getTerminalSize();
  const elapsed = executionStatus.startTime
    ? formatTime(Date.now() - executionStatus.startTime)
    : "0:00";
  const parts: string[] = [];
  if (executionStatus.bouquet)
    parts.push(`[B] ${executionStatus.bouquet}`);
  if (executionStatus.journey)
    parts.push(`[J] ${executionStatus.journey}`);
  if (executionStatus.segment)
    parts.push(`[S] ${executionStatus.segment}`);
  const breadcrumb = parts.join(" > ");
  const stepInfo =
    executionStatus.totalSteps > 0
      ? `Step ${executionStatus.stepNum}/${executionStatus.totalSteps}`
      : "";
  const results = `PASS:${executionStatus.passed} FAIL:${executionStatus.failed}`;
  console.log(
    `${COLORS.bgGray}${COLORS.white} T:${elapsed} | ${truncate(breadcrumb, cols - 40)} | ${stepInfo} | ${results} ${COLORS.reset}`
  );
}

// ============================================================================
// Voice (TTS Cascade)
// ============================================================================

async function tryExec(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(cmd, (error) => resolve(!error));
  });
}

async function speak(text: string): Promise<void> {
  if (cliOptions.noVoice || !text) return;
  const escaped = text.replace(/"/g, '\\"').replace(/'/g, "'\\''");
  const tmpWav = "/tmp/e2e-tts.wav";
  const tmpMp3 = "/tmp/e2e-tts.mp3";
  const playCmd =
    process.platform === "darwin"
      ? "afplay"
      : "ffplay -nodisp -autoexit";

  // 1. Piper TTS (local, neural, offline)
  if (
    await tryExec(
      `echo "${escaped}" | piper-tts --model en_US-amy-medium --output_file ${tmpWav} 2>/dev/null && ${playCmd} ${tmpWav} 2>/dev/null`
    )
  )
    return;

  // 2. Edge TTS (local pip package, neural, needs internet)
  if (
    await tryExec(
      `edge-tts --text "${escaped}" --voice en-US-SaraNeural --write-media ${tmpMp3} 2>/dev/null && ${playCmd} ${tmpMp3} 2>/dev/null`
    )
  )
    return;

  // 3. System fallback
  if (process.platform === "darwin") {
    await tryExec(`say -v Samantha "${escaped}"`);
  } else if (process.platform === "linux") {
    await tryExec(`espeak "${escaped}" 2>/dev/null`);
  } else if (process.platform === "win32") {
    const winEscaped = text.replace(/'/g, "''");
    await tryExec(
      `powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${winEscaped}')"`
    );
  }
}

// ============================================================================
// Interactive Mode Pause
// ============================================================================

async function waitForKeyPress(prompt: string): Promise<void> {
  if (!cliOptions.interactive) return;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n  ${prompt} [Press Enter] `, () => {
      rl.close();
      resolve();
    });
  });
}

// ============================================================================
// Config Loading (with credentials merge)
// ============================================================================

function getConfigFiles(): string[] {
  return fs
    .readdirSync(CONFIGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

async function promptCredentials(): Promise<Record<string, Record<string, string>>> {
  console.log(`\n${COLORS.cyan}============================================================${COLORS.reset}`);
  console.log(`${COLORS.cyan}  First-time Setup: Enter Your Zorbit Credentials${COLORS.reset}`);
  console.log(`${COLORS.cyan}============================================================${COLORS.reset}\n`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, a => r(a.trim())));

  const email = await ask(`  Email: `);
  const password = await ask(`  Password: `);

  // MFA setup
  console.log(`\n${COLORS.dim}  MFA (Multi-Factor Authentication):${COLORS.reset}`);
  console.log(`${COLORS.dim}  If MFA is enabled on your account, you have two options:${COLORS.reset}`);
  console.log(`${COLORS.dim}    1. Paste your TOTP base32 secret below (from authenticator setup)${COLORS.reset}`);
  console.log(`${COLORS.dim}       The runner will auto-generate 6-digit codes — no phone needed.${COLORS.reset}`);
  console.log(`${COLORS.dim}    2. Leave blank — you'll be prompted for the code each time.${COLORS.reset}`);
  console.log(`${COLORS.dim}  If MFA is off, just press Enter.${COLORS.reset}`);
  const mfaSecret = await ask(`\n  TOTP Secret (or press Enter to skip): `);

  const creds = {
    admin: { email, password, mfaSecret: mfaSecret || '', mfaCommand: '' },
  };

  const saveAnswer = await ask(`\n  Save credentials for next time? (y/n): `);
  if (saveAnswer.toLowerCase().startsWith('y')) {
    const credPath = path.join(CREDENTIALS_DIR, "credentials.json");
    fs.writeFileSync(credPath, JSON.stringify(creds, null, 2) + '\n');
    console.log(`\n${COLORS.green}  Saved to credentials/credentials.json${COLORS.reset}`);
    console.log(`${COLORS.dim}  (git-ignored, never shared)${COLORS.reset}`);
  }

  rl.close();
  console.log('');
  return creds;
}

function loadCredentials(): Record<string, Record<string, string>> {
  const credPath = path.join(CREDENTIALS_DIR, "credentials.json");
  if (fs.existsSync(credPath)) {
    const creds = JSON.parse(fs.readFileSync(credPath, "utf-8"));
    // Validate it has required fields
    if (creds.admin?.email && creds.admin?.password) {
      console.log(`${COLORS.green}  Credentials loaded from ${credPath}${COLORS.reset}`);
      return creds;
    }
  }
  // No valid credentials — will prompt interactively before test run
  return {};
}

async function ensureCredentials(): Promise<Record<string, Record<string, string>>> {
  const existing = loadCredentials();
  if (existing.admin?.email) return existing;
  // Prompt interactively
  return promptCredentials();
}

function loadConfigSync(filename: string): Config {
  const configPath = path.join(CONFIGS_DIR, filename);
  const config = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  ) as Config;
  // Credentials merged later via ensureCredentials
  config.credentials = loadCredentials();
  return config;
}

async function loadConfig(filename: string): Promise<Config> {
  const configPath = path.join(CONFIGS_DIR, filename);
  const config = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  ) as Config;
  // Ensure credentials exist (prompt if missing)
  config.credentials = await ensureCredentials();
  return config;
}

// ============================================================================
// Test Execution
// ============================================================================

function createRunOutputDir(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const dir = path.join(OUTPUTS_DIR, timestamp);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function resolveValue(template: string): string {
  if (!template || !currentConfig) return template;
  return template.replace(/\$\{([^}]+)\}/g, (match, pathStr) => {
    const parts = pathStr.split(".");
    let value: unknown = currentConfig;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }
    if (value === undefined || value === null || value === "") {
      console.log(
        `${COLORS.yellow}  WARNING: ${match} resolved to empty — check credentials.json has this path${COLORS.reset}`
      );
    }
    return String(value ?? "");
  });
}

// Custom handler for TOTP generation
// Supports three modes:
//   1. mfaSecret in credentials → generate TOTP locally via otplib (no SSH needed)
//   2. mfaCommand in credentials → run shell command (e.g., SSH to server)
//   3. step.params.command → inline shell command (legacy)
async function executeCustomHandler(step: Step): Promise<string> {
  if (step.handler === "generateTotp") {
    // Mode 1: Local TOTP from mfaSecret in credentials (preferred for developers)
    const creds = currentConfig?.credentials || {};
    const mfaSecret = creds?.admin?.mfaSecret || creds?.testUser?.mfaSecret;
    if (mfaSecret) {
      try {
        // Try to use otplib if available
        const otplib = require("otplib");
        const code = (otplib.generateSync || otplib.authenticator?.generateSync)({ secret: mfaSecret });
        console.log(`${COLORS.dim}  TOTP generated locally from mfaSecret${COLORS.reset}`);
        return code;
      } catch {
        // otplib not available, try via node one-liner
        try {
          const result = execSync(
            `node -e "try{const o=require('otplib');console.log((o.generateSync||o.authenticator.generateSync)({secret:'${mfaSecret}'}))}catch{console.log('OTPLIB_NOT_FOUND')}"`,
            { encoding: "utf-8", timeout: 5000 }
          ).trim();
          if (result && result !== "OTPLIB_NOT_FOUND") return result;
        } catch {}
      }
    }

    // Mode 2: mfaCommand from credentials
    const mfaCommand = creds?.admin?.mfaCommand;
    if (mfaCommand) {
      try {
        const result = execSync(mfaCommand, {
          encoding: "utf-8",
          timeout: 15000,
        }).trim();
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`${COLORS.red}  mfaCommand failed: ${msg}${COLORS.reset}`);
      }
    }

    // Mode 3: Inline command from step config (legacy)
    if (step.params?.command) {
      try {
        const result = execSync(step.params.command, {
          encoding: "utf-8",
          timeout: 15000,
        }).trim();
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`${COLORS.red}  Custom command failed: ${msg}${COLORS.reset}`);
      }
    }

    // Mode 4: Ask the developer to type the 6-digit code from Google Authenticator
    console.log(`\n${COLORS.cyan}  MFA Required — open Google Authenticator and type the 6-digit code:${COLORS.reset}`);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const code = await new Promise<string>((resolve) => {
      rl.question(`${COLORS.white}  MFA Code: ${COLORS.reset}`, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
    return code;
  }
  return "";
}

async function executeStep(
  page: Page,
  step: Step,
  stepIndex: number,
  totalSteps: number
): Promise<boolean> {
  if (!currentConfig) return false;

  executionStatus.stepNum = stepIndex + 1;
  executionStatus.totalSteps = totalSteps;
  executionStatus.step = step.action;
  const stepStartMs = Date.now();

  const stepNum = `[${stepIndex + 1}/${totalSteps}]`;
  const timeout = step.timeout || currentConfig.defaults.timeout;
  const waitAfter =
    step.waitAfterAction ?? currentConfig.defaults.waitAfterAction;

  try {
    if (step.announce?.before) {
      renderExecutionStatus();
      console.log(`${stepNum} >> ${step.announce.before}`);
      await speak(step.announce.before);
    }

    await waitForKeyPress(`Ready to ${step.action}?`);

    switch (step.action) {
      case "navigate": {
        const url = step.url?.startsWith("http")
          ? step.url
          : `${currentConfig.baseUrl}${step.url}`;
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: step.timeout || 30000,
        });
        if (
          step.waitForNetworkIdle ??
          currentConfig.defaults.waitForNetworkIdle
        ) {
          try {
            await page.waitForLoadState("networkidle", {
              timeout: 10000,
            });
          } catch {
            /* network idle timeout is non-fatal */
          }
        }
        break;
      }

      case "fill": {
        const value = resolveValue(step.value!);
        const locator = page.locator(step.selector!).first();
        await locator.waitFor({ state: "visible", timeout });
        await locator.fill(value);
        break;
      }

      case "click": {
        // Handle overlay dialogs that block clicks (shadcn, Radix, MUI)
        const overlay = page.locator(
          '[data-state="open"][data-slot="dialog-overlay"]'
        );
        const overlayCount = await overlay.count();
        if (overlayCount > 0) {
          try {
            await overlay
              .first()
              .waitFor({ state: "hidden", timeout: 3000 });
          } catch {
            await page.keyboard.press("Escape");
            await page.waitForTimeout(500);
          }
        }
        const element = page.locator(step.selector!).first();
        await element.scrollIntoViewIfNeeded();
        if (step.force) {
          await element.click({ force: true });
        } else {
          await element.click();
        }
        break;
      }

      case "waitForUrl": {
        const pattern = new RegExp(step.pattern!);
        await page.waitForURL(pattern, { timeout });
        break;
      }

      case "waitForNetworkIdle":
        try {
          await page.waitForLoadState("networkidle", {
            timeout: timeout || 10000,
          });
        } catch {
          /* non-fatal */
        }
        break;

      case "assertVisible": {
        const locator = page.locator(step.selector!).first();
        await locator.waitFor({ state: "visible", timeout });
        break;
      }

      case "assertText": {
        const locator = page.locator(step.selector!).first();
        await locator.waitFor({ state: "visible", timeout });
        const text = await locator.textContent();
        const expected = resolveValue(step.value!);
        if (!text?.includes(expected)) {
          throw new Error(
            `Expected text "${expected}" not found. Got: "${text}"`
          );
        }
        break;
      }

      case "assertCount": {
        const count = await page.locator(step.selector!).count();
        const expectedCount = parseInt(step.value || "0");
        if (count < expectedCount) {
          throw new Error(
            `Expected at least ${expectedCount} elements matching "${step.selector}", found ${count}`
          );
        }
        break;
      }

      case "hover":
        await page
          .locator(step.selector!)
          .first()
          .hover();
        break;

      case "scroll":
        if (step.selector) {
          await page
            .locator(step.selector)
            .first()
            .scrollIntoViewIfNeeded();
        } else {
          await page.evaluate(() => window.scrollBy(0, 300));
        }
        break;

      case "scrollToBottom":
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );
        break;

      case "wait":
        await page.waitForTimeout(step.timeout || 1000);
        break;

      case "pressEscape":
        await page.keyboard.press("Escape");
        break;

      case "pressKey":
        await page.keyboard.press(step.value || "Escape");
        break;

      case "waitForHidden": {
        const loc = page.locator(step.selector!).first();
        await loc.waitFor({ state: "hidden", timeout });
        break;
      }

      case "closeSheet":
      case "closeModal": {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);
        try {
          const dialogOverlay = page.locator(
            '[data-state="open"][data-slot="dialog-overlay"]'
          );
          if ((await dialogOverlay.count()) > 0) {
            await dialogOverlay.waitFor({
              state: "hidden",
              timeout: 2000,
            });
          } else {
            await page
              .locator(".modal-overlay")
              .waitFor({ state: "hidden", timeout: 2000 });
          }
        } catch {
          /* overlay might not exist */
        }
        await page.waitForTimeout(200);
        break;
      }

      case "selectOption": {
        const value = resolveValue(step.value!);
        await page.locator(step.selector!).first().selectOption(value);
        break;
      }

      case "custom": {
        // Execute custom handler (e.g., TOTP generation via SSH)
        const result = await executeCustomHandler(step);
        if (result && step.selector) {
          // If a selector is provided, fill the result into that field
          const locator = page.locator(step.selector).first();
          await locator.waitFor({ state: "visible", timeout });
          await locator.fill(result);
        }
        if (step.description) {
          console.log(
            `${COLORS.dim}  Custom: ${step.description} -> ${result || "(no output)"}${COLORS.reset}`
          );
        }
        break;
      }

      case "apiCheck": {
        const response = await page.request.get(
          `${currentConfig.baseUrl}${step.endpoint}`
        );
        const status = response.status();
        const expected = step.expectedStatus || [200];
        if (!expected.includes(status)) {
          throw new Error(
            `API ${step.endpoint} returned ${status}, expected ${expected}`
          );
        }
        break;
      }

      case "screenshot": {
        const filename =
          step.value || `screenshot-${Date.now()}.png`;
        const screenshotPath = path.join(runOutputDir, filename);
        await page.screenshot({
          path: screenshotPath,
          fullPage: false,
        });
        console.log(
          `${COLORS.dim}  Screenshot: ${screenshotPath}${COLORS.reset}`
        );
        break;
      }

      case "fullPageScreenshot": {
        const filename =
          step.value || `fullpage-${Date.now()}.png`;
        const screenshotPath = path.join(runOutputDir, filename);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });
        console.log(
          `${COLORS.dim}  Full-page screenshot: ${screenshotPath}${COLORS.reset}`
        );
        break;
      }

      default:
        console.log(
          `${COLORS.yellow}  Unknown action: ${step.action}${COLORS.reset}`
        );
    }

    if (waitAfter > 0) await page.waitForTimeout(waitAfter);

    if (step.announce?.after) {
      console.log(`${stepNum} OK ${step.announce.after}`);
      await speak(step.announce.after);
    }

    logStep({
      segment: executionStatus.segment,
      journey: executionStatus.journey,
      step: stepIndex + 1,
      action: step.action,
      selector: step.selector,
      status: 'pass',
      duration_ms: Date.now() - stepStartMs,
    });
    return true;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    try {
      await page.screenshot({
        path: path.join(runOutputDir, `error-${Date.now()}.png`),
      });
    } catch {
      /* ignore */
    }
    console.log(`${stepNum} FAIL: ${errorMsg}`);
    await speak(`Step failed. ${step.action} error.`);
    logStep({
      segment: executionStatus.segment,
      journey: executionStatus.journey,
      step: stepIndex + 1,
      action: step.action,
      selector: step.selector,
      status: 'fail',
      error: errorMsg,
      duration_ms: Date.now() - stepStartMs,
      screenshot: `error-${Date.now()}.png`,
    });
    return false;
  }
}

async function executeSegment(
  page: Page,
  segmentId: string
): Promise<boolean> {
  if (!currentConfig) return false;
  const segment = currentConfig.segments[segmentId];
  if (!segment) {
    console.log(`FAIL: Segment not found: ${segmentId}`);
    return false;
  }

  executionStatus.segment = segment.name;
  renderExecutionStatus();
  console.log(`\n  [S] ${segment.name}`);

  for (let i = 0; i < segment.steps.length; i++) {
    const success = await executeStep(
      page,
      segment.steps[i],
      i,
      segment.steps.length
    );
    if (!success) return false;
  }
  return true;
}

async function executeJourney(
  page: Page,
  journeyId: string
): Promise<boolean> {
  if (!currentConfig) return false;
  const journey =
    currentConfig.journeys[journeyId];
  if (!journey) {
    console.log(`FAIL: Journey not found: ${journeyId}`);
    return false;
  }

  executionStatus.journey = journey.name;
  executionStatus.segment = "";
  renderExecutionStatus();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[J] JOURNEY: ${journey.name}`);
  console.log(`   ${journey.description}`);
  console.log(`${"=".repeat(60)}`);
  await speak(`Starting journey: ${journey.name}`);

  for (const segmentId of journey.segments) {
    const success = await executeSegment(page, segmentId);
    if (!success) {
      await speak(`Journey ${journey.name} failed`);
      return false;
    }
  }

  console.log(`\n  OK Journey ${journey.name} completed!`);
  await speak(`Journey ${journey.name} completed`);
  return true;
}

async function executeBouquet(
  browser: Browser,
  bouquetId: string
): Promise<{ passed: number; failed: number }> {
  if (!currentConfig)
    return { passed: 0, failed: 1 };
  const bouquet = currentConfig.bouquets[bouquetId];
  if (!bouquet) {
    console.log(`FAIL: Bouquet not found: ${bouquetId}`);
    return { passed: 0, failed: 1 };
  }

  executionStatus.bouquet = bouquet.name;
  executionStatus.journey = "";
  executionStatus.segment = "";
  renderExecutionStatus();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[B] BOUQUET: ${bouquet.name}`);
  console.log(`   ${bouquet.description}`);
  console.log(`   Mode: ${bouquet.mode}`);
  console.log(`${"=".repeat(60)}`);
  await speak(`Starting bouquet: ${bouquet.name}`);

  let passed = 0,
    failed = 0;

  if (bouquet.mode === "parallel") {
    const results = await Promise.all(
      bouquet.journeys.map(async (journeyId) => {
        const context = await browser.newContext({
          viewport: currentConfig?.viewport || {
            width: 1280,
            height: 720,
          },
        });
        const page = await context.newPage();
        const success = await executeJourney(page, journeyId);
        await context.close();
        return success;
      })
    );
    passed = results.filter((r) => r).length;
    failed = results.filter((r) => !r).length;
  } else {
    for (const journeyId of bouquet.journeys) {
      const context = await browser.newContext({
        viewport: currentConfig?.viewport || {
          width: 1280,
          height: 720,
        },
      });
      const page = await context.newPage();
      const success = await executeJourney(page, journeyId);
      await context.close();
      if (success) {
        passed++;
        executionStatus.passed++;
      } else {
        failed++;
        executionStatus.failed++;
      }
      renderExecutionStatus();
    }
  }

  console.log(
    `\n[B] Bouquet ${bouquet.name}: ${passed} passed, ${failed} failed`
  );
  return { passed, failed };
}

async function runTest(type: string, id: string): Promise<void> {
  if (!currentConfig) return;

  runOutputDir = createRunOutputDir();
  executionStatus = {
    bouquet: "",
    journey: "",
    segment: "",
    step: "",
    stepNum: 0,
    totalSteps: 0,
    startTime: Date.now(),
    passed: 0,
    failed: 0,
  };

  clearScreen();
  console.log(
    `${COLORS.cyan}${"=".repeat(60)}${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}${COLORS.bright}  Starting Test Execution${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}${"=".repeat(60)}${COLORS.reset}`
  );
  console.log();
  console.log(`  Config:  ${currentConfigName}`);
  console.log(`  URL:     ${currentConfig.baseUrl}`);
  console.log(`  Output:  ${runOutputDir}`);
  console.log(
    `  Mode:    ${cliOptions.headless ? "Headless" : "Headed"}`
  );
  console.log();
  await speak("Starting tests");

  const browser = await chromium.launch({
    headless: cliOptions.headless,
    slowMo: cliOptions.interactive ? 500 : 100,
    args: cliOptions.headless ? ["--headless=new"] : [],
  });

  let passed = 0,
    failed = 0;

  try {
    if (type === "bouquet") {
      const result = await executeBouquet(browser, id);
      passed = result.passed;
      failed = result.failed;
    } else if (type === "journey") {
      executionStatus.journey =
        currentConfig.journeys[id]?.name || id;
      const context = await browser.newContext({
        viewport: currentConfig?.viewport || {
          width: 1280,
          height: 720,
        },
      });
      const page = await context.newPage();
      const success = await executeJourney(page, id);
      await context.close();
      if (success) passed = 1;
      else failed = 1;
    } else if (type === "segment") {
      executionStatus.segment =
        currentConfig.segments[id]?.name || id;
      const context = await browser.newContext({
        viewport: currentConfig?.viewport || {
          width: 1280,
          height: 720,
        },
      });
      const page = await context.newPage();
      await page.goto(currentConfig.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      const success = await executeSegment(page, id);
      await context.close();
      if (success) passed = 1;
      else failed = 1;
    }
  } finally {
    await browser.close();
  }

  const elapsed = formatTime(
    Date.now() - executionStatus.startTime
  );
  console.log();
  console.log(
    `${COLORS.cyan}${"=".repeat(60)}${COLORS.reset}`
  );
  console.log(
    `${COLORS.bright}  FINAL RESULTS${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}${"=".repeat(60)}${COLORS.reset}`
  );
  console.log(`   Duration: ${elapsed}`);
  console.log(`   Passed:   ${passed}`);
  console.log(`   Failed:   ${failed}`);
  console.log(
    `${COLORS.cyan}${"=".repeat(60)}${COLORS.reset}`
  );
  console.log();

  // Write structured JSON report for Claude session consumption
  const report = {
    config: currentConfigName,
    baseUrl: currentConfig?.baseUrl,
    timestamp: new Date().toISOString(),
    duration: elapsed,
    summary: { passed, failed, total: passed + failed },
    steps: testLog,
    outputDir: runOutputDir,
  };
  const reportPath = path.join(runOutputDir, 'results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`\n${COLORS.dim}  Report: ${reportPath}${COLORS.reset}`);

  if (failed === 0)
    await speak(`All ${passed} tests passed in ${elapsed}!`);
  else await speak(`${failed} tests failed. ${passed} passed.`);

  console.log(
    `${COLORS.dim}Press any key to continue...${COLORS.reset}`
  );
  await waitForAnyKey();
}

async function waitForAnyKey(): Promise<void> {
  if (!process.stdin.isTTY) return;
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once("data", () => {
      stdin.setRawMode(false);
      resolve();
    });
  });
}

// ============================================================================
// Menu Navigation
// ============================================================================

async function showTestsMenu(
  configFilename: string
): Promise<void> {
  currentConfig = await loadConfig(configFilename);
  currentConfigName = configFilename.replace(".json", "");

  while (true) {
    const items: MenuItem[] = [];

    Object.entries(currentConfig.bouquets).forEach(
      ([id, bouquet]) => {
        items.push({
          label: bouquet.name,
          type: "bouquet",
          value: id,
          description: `${bouquet.mode} - ${bouquet.journeys.length} journeys`,
        });
      }
    );
    Object.entries(currentConfig.journeys).forEach(
      ([id, journey]) => {
        items.push({
          label: journey.name,
          type: "journey",
          value: id,
          description: `${journey.segments.length} segments`,
        });
      }
    );
    Object.entries(currentConfig.segments).forEach(
      ([id, segment]) => {
        items.push({
          label: segment.name,
          type: "segment",
          value: id,
          description: `${segment.steps.length} steps`,
        });
      }
    );

    const { item } = await interactiveMenu(items, [
      currentConfigName,
    ]);
    if (!item || item.value === "__BACK__") break;
    await runTest(item.type, item.value);
  }
}

async function showMainMenu(): Promise<void> {
  await speak("Welcome to the Zorbit test runner");
  while (true) {
    const configFiles = getConfigFiles();
    const items: MenuItem[] = configFiles.map((f) => ({
      label: f.replace(".json", ""),
      type: "config" as const,
      value: f,
      description: "Configuration",
    }));

    const { item } = await interactiveMenu(items, []);
    if (!item || item.value === "__BACK__") break;
    if (item.type === "config") await showTestsMenu(item.value);
  }

  clearScreen();
  await speak("Goodbye");
  console.log(`${COLORS.green}Goodbye!${COLORS.reset}\n`);
}

// ============================================================================
// CLI Mode
// ============================================================================

function showHelp(): void {
  console.log(`
${COLORS.cyan}Zorbit Unified Console E2E Test Runner${COLORS.reset}

${COLORS.bright}Usage:${COLORS.reset}
  npx tsx runner.ts              Interactive menu mode
  npx tsx runner.ts [options]    CLI mode
  npx tsx runner.ts [targets]    Run targets (auto-detect type)

${COLORS.bright}Options:${COLORS.reset}
  -c, --config <file>   Config file (default: smoke-test.json)
  -b, --bouquet <id>    Run specific bouquet
  -j, --journey <id>    Run specific journey
  -s, --segment <id>    Run specific segment
  -i, --interactive     Pause after each step
  --spec <file>         Run a Playwright .spec.ts file instead
  --headless            Run without browser window
  --no-voice            Disable voice narration
  --list                List available tests
  -h, --help            Show help

${COLORS.bright}Target Prefixes:${COLORS.reset}
  bouquet:smoke-test    Run specific bouquet
  journey:login-flow    Run specific journey
  segment:login         Run specific segment
  smoke-test            Auto-detect (bouquet > journey > segment)

${COLORS.bright}Menu Controls:${COLORS.reset}
  Up/Down      Navigate
  Enter/Right  Select
  Esc/Left     Back
  PgUp/PgDn    Scroll page
  Home/End     Jump to start/end
  q            Quit
  1-9          Quick select
`);
}

// Resolve target type from prefixed or bare name
function resolveTarget(
  target: string
): { type: string; id: string } | null {
  if (!currentConfig) return null;
  if (target.startsWith("segment:"))
    return { type: "segment", id: target.slice(8) };
  if (target.startsWith("journey:"))
    return { type: "journey", id: target.slice(8) };
  if (target.startsWith("bouquet:"))
    return { type: "bouquet", id: target.slice(8) };
  // Auto-detect: bouquet > journey > segment
  if (currentConfig.bouquets[target])
    return { type: "bouquet", id: target };
  if (currentConfig.journeys[target])
    return { type: "journey", id: target };
  if (currentConfig.segments[target])
    return { type: "segment", id: target };
  return null;
}

// Run Playwright spec file
async function runSpecFile(specFile: string): Promise<number> {
  console.log(`\nRunning Playwright spec: ${specFile}`);
  await speak(`Running spec file: ${specFile}`);
  return new Promise((resolve) => {
    const specPath = path.resolve(specFile);
    const cmd = `npx playwright test ${specPath} --headed`;
    console.log(`Command: ${cmd}\n`);
    const child = exec(cmd, { cwd: BUNDLE_ROOT });
    child.stdout?.on("data", (data) => process.stdout.write(data));
    child.stderr?.on("data", (data) => process.stderr.write(data));
    child.on("exit", (code) => resolve(code || 0));
  });
}

async function cliMode(): Promise<void> {
  // Handle --spec mode first
  if (cliOptions.spec) {
    const exitCode = await runSpecFile(cliOptions.spec);
    process.exit(exitCode);
  }

  const configFile = cliOptions.config || "smoke-test.json";
  currentConfig = await loadConfig(configFile);
  currentConfigName = configFile.replace(".json", "");

  if (cliOptions.list) {
    console.log(`\n  Config: ${configFile}\n`);
    console.log("[B] BOUQUETS:");
    Object.entries(currentConfig.bouquets).forEach(([id, b]) =>
      console.log(
        `  ${id.padEnd(30)} ${b.name} [${b.mode}]`
      )
    );
    console.log("\n[J] JOURNEYS:");
    Object.entries(currentConfig.journeys).forEach(([id, j]) =>
      console.log(
        `  ${id.padEnd(30)} ${j.name} (${j.segments.length} segments)`
      )
    );
    console.log("\n[S] SEGMENTS:");
    Object.entries(currentConfig.segments).forEach(([id, s]) =>
      console.log(`  ${id.padEnd(30)} ${s.name}`)
    );
    console.log("\n[C] CONFIGS:");
    getConfigFiles().forEach((f) => console.log(`  ${f}`));
    console.log();
    return;
  }

  // Explicit flags take precedence
  if (cliOptions.segment) {
    await runTest("segment", cliOptions.segment);
    return;
  }
  if (cliOptions.journey) {
    await runTest("journey", cliOptions.journey);
    return;
  }
  if (cliOptions.bouquet) {
    await runTest("bouquet", cliOptions.bouquet);
    return;
  }

  // Target prefix resolution
  if (cliOptions.targets.length > 0) {
    for (const target of cliOptions.targets) {
      const resolved = resolveTarget(target);
      if (resolved) {
        await runTest(resolved.type, resolved.id);
      } else {
        console.log(
          `Unknown target: ${target}. Use --list to see available targets.`
        );
      }
    }
    return;
  }

  // Default: run smoke-test bouquet
  await runTest("bouquet", "smoke-test");
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  if (cliOptions.help) {
    showHelp();
    return;
  }
  if (
    cliOptions.spec ||
    cliOptions.config ||
    cliOptions.list ||
    cliOptions.headless ||
    cliOptions.bouquet ||
    cliOptions.journey ||
    cliOptions.segment ||
    cliOptions.targets.length > 0
  ) {
    await cliMode();
    return;
  }
  await showMainMenu();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  showCursor();
  process.exit(1);
});

# Zorbit E2E Test Bundle

Standalone, portable end-to-end test suite for the Zorbit Unified Console.
No prior setup needed — just unzip, add credentials, and run.

---

## Quick Start (3 steps)

### Step 1: Unzip

```bash
unzip zorbit-e2e-bundle.zip
cd e2e-standalone-bundle
```

### Step 2: Add Your Credentials

```bash
cp credentials/credentials.example.json credentials/credentials.json
```

Edit `credentials/credentials.json` with your Zorbit login:

```json
{
  "admin": {
    "email": "your-email@company.com",
    "password": "your-password",
    "mfaSecret": "PASTE_YOUR_TOTP_SECRET_HERE"
  }
}
```

**How to get your MFA secret:**
1. Go to https://zorbit.scalatics.com/settings/security
2. If MFA is already set up, ask your admin to provide your TOTP base32 secret
3. If setting up MFA for the first time, the QR code setup page shows the secret key — copy it
4. Paste the base32 string (e.g., `JBSWY3DPEHPK3PXP`) into the `mfaSecret` field
5. The test runner generates TOTP codes automatically — no Google Authenticator needed during tests

### Step 3: Run

```bash
./runme.sh smoke-test
```

That's it. The script auto-installs Node dependencies and Chromium on first run.

---

## Available Tests

| Command | What it tests | Duration |
|---------|--------------|----------|
| `./runme.sh smoke-test` | Login, dashboard, sidebar, health check, logout | ~1 min |
| `./runme.sh identity-service` | Users, orgs, departments, org chart, security, impersonation | ~5 min |
| `./runme.sh pcg4-configurator` | Product config wizard all 8 steps with realistic data | ~5 min |
| `./runme.sh menu-sanity` | Clicks every menu item, screenshots each page | ~3 min |
| `./runme.sh broken-links` | Crawls all links, reports 404s | ~5 min |
| `./runme.sh --interactive` | Interactive menu to pick tests | — |

## What You'll See

The tests run in a **visible browser window** (headed mode). You can watch every click, scroll, and form fill happen in real time. Each test:

1. Opens Chrome
2. Logs in with your credentials (handles MFA automatically)
3. Navigates through the app clicking real buttons and menus
4. Takes screenshots at each step
5. Reports PASS/FAIL for each segment

Screenshots and results are saved in `outputs/` with timestamps.

---

## Test Structure

```
Bouquet    = Collection of journeys (run together)
  Journey  = A user flow (sequence of segments)
    Segment  = One feature check (sequence of steps)
      Step   = One action (click, fill, screenshot)
```

Example: The `identity-service` bouquet contains journeys like "User Management" which has segments like "Create User", "View Org Chart", etc.

---

## Headless Mode (CI/Server)

```bash
./runme.sh smoke-test --headless
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No credentials file found" | Copy `credentials.example.json` to `credentials.json` and fill in your values |
| MFA fails | Make sure `mfaSecret` is correct (base32 string from your authenticator setup) |
| "Cannot find Chromium" | Run `npx playwright install chromium` |
| Tests timeout | The app might be slow. Increase `defaults.timeout` in the config JSON |
| SSH command fails | You don't need SSH. Use `mfaSecret` instead of `mfaCommand` |

---

## Adding New Tests

Edit the JSON files in `configs/`. No code changes needed. Example segment:

```json
{
  "my-new-test": {
    "name": "Check Claims Page",
    "narration": "Navigating to the claims module",
    "steps": [
      { "action": "click", "selector": "text=Claims" },
      { "action": "wait", "timeout": 2000 },
      { "action": "screenshot", "name": "claims-page" },
      { "action": "assertVisible", "selector": "h1:has-text('Claims')" }
    ]
  }
}
```

---

## Files Overview

```
e2e-standalone-bundle/
  runner.ts          -- Test engine (don't modify)
  runme.sh           -- Launcher (double-click to run)
  package.json       -- Dependencies (auto-installed)
  configs/           -- Test definitions (edit these)
    smoke-test.json
    identity-service.json
    pcg4-configurator.json
    menu-sanity.json
    broken-links.json
  credentials/       -- Your login (NOT included in zip)
    credentials.example.json  -- Template
    credentials.json          -- Your actual creds (create this)
  outputs/           -- Screenshots and results (auto-generated)
```

## Requirements

- macOS, Linux, or Windows (WSL)
- Node.js 18+ (auto-detected)
- Internet access to https://zorbit.scalatics.com

# Zorbit E2E Test Bundle

Standalone, portable end-to-end test suite for the Zorbit Unified Console.
No source code access needed -- just unzip, add credentials, and run.

---

## Quick Start (3 steps)

### Step 1: Unzip

```bash
unzip zorbit-e2e-bundle-*.zip
cd zorbit-e2e-bundle-*
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

**MFA handling (pick one):**

| Method | Field | How it works |
|--------|-------|-------------|
| Auto TOTP | `mfaSecret` | Paste your base32 secret from authenticator setup. Runner generates codes. Best option. |
| SSH command | `mfaCommand` | Shell command that returns TOTP code, e.g. `ssh myserver 'get-totp.sh'` |
| Manual | (neither) | Runner pauses and asks you to type the 6-digit code from your phone |

**How to get your TOTP secret:**
1. Go to Settings > Security in Zorbit
2. If setting up MFA for the first time, the QR code page shows the secret key
3. Copy the base32 string (e.g. `JBSWY3DPEHPK3PXP`) into `mfaSecret`
4. You can still use Google Authenticator on your phone -- the secret is the same

### Step 3: Run

```bash
# First time: auto-installs Node dependencies + Chromium
./runme.sh smoke-test
```

---

## Available Tests

| Command | What it tests | Duration |
|---------|--------------|----------|
| `./runme.sh smoke-test` | Login, dashboard, sidebar, health check, logout | ~1 min |
| `./runme.sh identity-service` | Users, orgs, departments, security, impersonation | ~5 min |
| `./runme.sh pcg4-configurator` | Product config wizard all 8 steps | ~5 min |
| `./runme.sh menu-sanity` | Clicks every menu item, screenshots each page | ~3 min |
| `./runme.sh broken-links` | Crawls all links, reports 404s | ~5 min |
| `./runme.sh awnic-flow` | Full AWNIC insurance flow (20 segments) | ~15 min |
| `./runme.sh --interactive` | Interactive menu to pick tests | -- |

### Running specific bouquets within a config

```bash
# AWNIC has 6 bouquets:
./runme.sh awnic-flow --bouquet awnic-setup       # Just login + org setup
./runme.sh awnic-flow --bouquet awnic-product      # Product configuration
./runme.sh awnic-flow --bouquet awnic-quotation    # Quotation to policy
./runme.sh awnic-flow --bouquet awnic-automation   # Rules + queue testing
./runme.sh awnic-flow --bouquet awnic-security     # PII + data quality
./runme.sh awnic-flow --bouquet awnic-full         # Everything
```

### Headless mode (CI/Server)

```bash
./runme.sh smoke-test --headless
```

---

## What You'll See

Tests run in a **visible browser window** (headed mode). You can watch every click happen in real time. Each test:

1. Opens Chrome
2. Logs in with your credentials (handles MFA automatically)
3. Navigates through the app clicking real buttons and menus
4. Takes screenshots at each step
5. Reports PASS/FAIL for each segment

Screenshots and results saved in `outputs/` with timestamps.

After each run, `outputs/<timestamp>/results.json` contains structured results
that can be fed into Claude for analysis: just paste the file path.

---

## Test Structure

```
Bouquet   = Collection of journeys (run together)
  Journey = A user flow (sequence of segments)
    Segment = One feature check (sequence of steps)
      Step  = One action (click, fill, screenshot)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No credentials file found" | Copy `credentials.example.json` to `credentials.json` |
| MFA fails | Make sure `mfaSecret` is the base32 string from authenticator setup |
| "Cannot find Chromium" | Run `npx playwright install chromium` |
| Tests timeout | Increase `defaults.timeout` in the config JSON |
| Node not found | Install Node.js 18+ from https://nodejs.org |

---

## Requirements

- macOS, Linux, or Windows (WSL)
- Node.js 18+
- Internet access to https://zorbit.scalatics.com

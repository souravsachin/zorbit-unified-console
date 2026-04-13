# Zorbit Platform — UAT Deployment Backlog

**Document Owner:** Sourav Sachin (CEO / Platform Architect)
**Target Environment:** zorbit-uat.onezippy.ai
**Last Updated:** 2026-04-14
**Status:** Living document — update as items are resolved

---

## Quick Summary

| Priority | Total | Pending | In Progress | Done |
|----------|-------|---------|-------------|------|
| CRITICAL | 2 | 2 | 0 | 0 |
| HIGH | 4 | 4 | 0 | 0 |
| MEDIUM | 5 | 5 | 0 | 0 |
| LOW | 3 | 3 | 0 | 0 |
| **Total** | **14** | **14** | **0** | **0** |

---

## Item Index

| # | Title | Priority | Status | Owner |
|---|-------|----------|--------|-------|
| 1 | Module Setup Seeding | HIGH | Pending | Backend / Platform |
| 2 | DB-Driven Navigation | HIGH | Pending | Frontend / Navigation |
| 3 | ZMB Factory — Old Module Manifests | MEDIUM | Pending | ZMB / Platform |
| 4 | Support Center + Dev Center Menu Items | HIGH | Pending | Frontend / Navigation |
| 5 | OAuth Callback URLs for UAT | CRITICAL | Pending | DevOps / Manual |
| 6 | PCG4 Setup Page 404 | CRITICAL | Pending | Frontend / PCG4 |
| 7 | Messaging Topics Page Blank | HIGH | Pending | Backend / Messaging |
| 8 | PII Vault Data Types / Token Registry Blank | MEDIUM | Pending | Backend / PII |
| 9 | Settings — Fake Active Sessions | MEDIUM | Pending | Backend / Identity |
| 10 | zorbit-packager Tool — Review & Test | MEDIUM | Pending | DevOps |
| 11 | Disk Space Monitoring — UAT ARM | MEDIUM | Pending | DevOps |
| 12 | PM2 Startup Persistence | LOW | Pending | DevOps |
| 13 | Space-Efficient Deployment | LOW | Pending | DevOps |
| 14 | Security Audit — RBAC Gaps | LOW | Pending | Security |

---

## Detailed Requirements

---

### Item 1 — Module Setup Seeding

**Priority:** HIGH
**Status:** Pending
**Owner:** Backend / Platform
**Applies to:** All business and platform modules

#### Background

Each module needs a **Setup** menu item with four sub-actions so that any environment
(local dev, UAT, production) can be brought to a known state quickly.

Reference UX: check PCG4's Setup menu on zorbit.scalatics.com for design inspiration.

> **IMPORTANT:** Do NOT migrate data from zorbit.scalatics.com. Build seeding
> capability natively into each module from scratch.

#### Required Sub-Actions

| Sub-Action | Description |
|------------|-------------|
| System Minimum Data | Seed the absolute minimum records for the module to be functional (lookup tables, default roles, system config) |
| Load Demo Data | Seed realistic AI-generated demo data suitable for showcasing to stakeholders |
| Flush Demo Data | Remove only demo data; preserve system minimum data |
| Flush All Data | Wipe all module data for a completely fresh start |

#### Modules Requiring This

1. identity
2. authorization
3. navigation
4. form-builder
5. datatable
6. pii-vault
7. white-label
8. zmb-factory
9. pcg4
10. hi-quotation
11. hi-decisioning
12. uw-workflow
13. doc-generator
14. product-pricing
15. interaction-recorder

#### Definition of Done

- [ ] Setup menu item exists in each module's navigation entry
- [ ] All 4 sub-actions are implemented with backend API endpoints
- [ ] Demo data uses AI-generated realistic content (not lorem ipsum)
- [ ] Flush operations are idempotent (safe to call multiple times)
- [ ] System minimum data seeds do not conflict with each other across modules
- [ ] Setup page has animated Playwright-style form-filling for demo data load (UX delight)
- [ ] Each seeding action has a progress indicator and completion toast

---

### Item 2 — DB-Driven Navigation

**Priority:** HIGH
**Status:** Pending
**Owner:** Frontend / Navigation Service

#### Background

There is a disconnect between two navigation sources:

- **Hardcoded JSON:** `src/data/menu-6level.json` in zorbit-unified-console (current source of truth for the sidebar)
- **Navigation Service DB:** 343 items seeded in `zorbit-navigation` service DB (not yet connected to frontend)

These are completely disconnected. The sidebar must be driven by the navigation service.

#### Required Architecture

```
Login → identity service returns menu.json
menu.json sourced from navigation service DB
Sidebar reads from menu.json (live)
Fallback: hardcoded JSON if navigation service unreachable
```

This is the same pattern as PCG4 / scalatics where menu.json is returned by the
identity service's navigation response.

#### Implementation Steps

1. Navigation service exposes `GET /api/v1/{namespace}/navigation/menu` returning the
   full menu tree for the authenticated user's privileges
2. Identity service calls navigation service after login and embeds menu.json in the
   JWT response or a separate endpoint
3. Frontend replaces static import of `menu-6level.json` with a fetch from the
   identity/navigation endpoint
4. Static JSON remains as the offline/fallback source

#### Definition of Done

- [ ] `GET /api/navigation/menu` endpoint live in navigation service
- [ ] Identity service calls navigation service post-login and attaches menu
- [ ] Frontend sidebar reads from API response, not hardcoded JSON
- [ ] Fallback to static JSON if API call fails (graceful degradation)
- [ ] 343 navigation items in DB map correctly to the 6-level sidebar structure
- [ ] Navigation respects user privileges (users only see authorized menu items)
- [ ] Hot-reload: changing navigation in DB reflects without frontend redeploy

---

### Item 3 — ZMB Factory: Old Module Manifests

**Priority:** MEDIUM
**Status:** Pending
**Owner:** ZMB / Platform

#### Background

Existing business modules (built before ZMB Factory existed) have no ZMB manifest
files. The ZMB Factory catalog therefore has no awareness of their structure.

New modules must be built using ZMB from the start. Legacy modules need retrospective
manifest creation so the factory catalog is complete.

#### Modules Needing Retrospective ZMB Manifests

| Module | Repo | Status |
|--------|------|--------|
| pcg4 | zorbit-app-pcg4 | Pending |
| hi-quotation | zorbit-pfs-hi-quotation (or equivalent) | Pending |
| hi-decisioning | zorbit-pfs-hi-decisioning (or equivalent) | Pending |
| uw-workflow | zorbit-pfs-uw-workflow (or equivalent) | Pending |

#### Manifest Must Capture

- Module ID and display name
- PFS capabilities used (datatable, form-builder, white-label, etc.)
- Navigation items and privilege codes
- Kafka topics published / consumed
- API endpoint registry
- Seeding dependencies (what other modules must be seeded first)
- Version history

#### Definition of Done

- [ ] ZMB manifest file created for each legacy module
- [ ] Manifests registered in ZMB Factory catalog DB
- [ ] `zorbit zmb list` shows all modules (new and legacy)
- [ ] Manifests pass ZMB schema validation
- [ ] PFS dependency graph is complete and accurate

---

### Item 4 — Support Center + Dev Center Menu Items

**Priority:** HIGH
**Status:** Pending
**Owner:** Frontend / Navigation

#### Background

Support Center and Dev Center were visible and functional on zorbit.scalatics.com
but are MISSING from both:

- The hardcoded `src/data/menu-6level.json` sidebar
- The navigation service DB (343 items don't include these)

These items have significant emotional/brand value — they must be restored with
"beautiful" content matching or exceeding what existed on scalatics.

#### Required Actions

1. Investigate current content on zorbit.scalatics.com for both sections
2. Recreate content in the unified console with high design quality
3. Add entries to `menu-6level.json` (immediate fix)
4. Add entries to navigation service DB (permanent fix, feeds into Item 2)

#### Support Center — Expected Content

- Help articles / documentation browser
- Ticket submission form
- FAQ / knowledge base
- Contact / escalation paths
- JAYNA AI support agent entry point (if ready)

#### Dev Center — Expected Content

- API documentation browser
- Health check bundle (per Developer Section feedback)
- In-browser endpoint testing (Swagger / Redoc style)
- TTS announcements toggle
- Platform status dashboard
- SDK download links (Node, Python, Go)
- Event registry browser
- Privilege registry browser

#### Definition of Done

- [ ] Both sections appear in sidebar at correct hierarchy level
- [ ] Both sections have fully designed, non-placeholder content
- [ ] Content matches or exceeds what was on zorbit.scalatics.com
- [ ] Entries added to navigation service DB (not just hardcoded JSON)
- [ ] Dev Center health checks work against UAT service endpoints
- [ ] JAYNA entry point wired (even if just a placeholder if JAYNA not ready)

---

### Item 5 — OAuth Callback URLs for UAT Domain

**Priority:** CRITICAL
**Status:** Pending
**Owner:** DevOps / Manual action by Sourav

#### Background

OAuth providers (Google, GitHub, LinkedIn) have callback URLs configured for
zorbit.scalatics.com. The UAT environment at zorbit-uat.onezippy.ai requires its
own callback URLs registered in each provider's developer console.

**This is a MANUAL action — cannot be automated.**

#### URLs to Register

| Provider | Callback URL |
|----------|-------------|
| Google | `https://zorbit-uat.onezippy.ai/api/identity/api/v1/G/auth/google/callback` |
| GitHub | `https://zorbit-uat.onezippy.ai/api/identity/api/v1/G/auth/github/callback` |
| LinkedIn | `https://zorbit-uat.onezippy.ai/api/identity/api/v1/G/auth/linkedin/callback` |

#### Where to Register

| Provider | Location |
|----------|----------|
| Google | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs |
| GitHub | github.com/settings/applications/3451566 → Callback URL field (add new URL) |
| LinkedIn | LinkedIn Developer Portal → App 231091593 → Auth → OAuth 2.0 settings → Redirect URLs |

#### Definition of Done

- [ ] Google callback URL added and verified (test Google login on UAT)
- [ ] GitHub callback URL added and verified (test GitHub login on UAT)
- [ ] LinkedIn callback URL added and verified (test LinkedIn login on UAT)
- [ ] `.env` on UAT server updated with correct `OAUTH_CALLBACK_BASE_URL=https://zorbit-uat.onezippy.ai`
- [ ] E2E OAuth flow tested for all three providers on UAT domain

---

### Item 6 — PCG4 Setup Page 404

**Priority:** CRITICAL
**Status:** Pending
**Owner:** Frontend / PCG4

#### Background

The Products (PCG4) module's Setup route is returning a 404 error. This is a routing
or lazy-load configuration issue in the frontend.

#### Investigation Steps

1. Check `src/router` or equivalent route config for PCG4 Setup route definition
2. Verify the Setup component is exported and importable
3. Check if the route is registered under the correct parent module path
4. Confirm the navigation entry points to the correct path

#### Definition of Done

- [ ] `GET /products/setup` (or equivalent path) returns 200 with the Setup page
- [ ] All 4 seeding sub-actions visible on the page (feeds into Item 1)
- [ ] No console errors on page load
- [ ] Route is protected by correct privilege code

---

### Item 7 — Messaging Topics Page Blank

**Priority:** HIGH
**Status:** Pending
**Owner:** Backend / Messaging

#### Background

The Messaging module's topics page renders but shows no content. This is likely one of:

- The `zorbit-event_bus` service (port 3004 / 3104) is returning an empty topics list
- The frontend is calling the wrong API endpoint
- Kafka topic metadata is not being surfaced by the event bus service
- The topics page was never seeded with Kafka topic registry data

#### Investigation Steps

1. `curl http://localhost:3104/api/v1/G/topics` — check if service returns data
2. Check Kafka container is running and has topics registered
3. Verify frontend API call matches event bus endpoint signature
4. Check if topics need to be seeded from an event registry (zorbit-core)

#### Definition of Done

- [ ] Messaging Topics page shows all registered Kafka topics
- [ ] Topic details (subscribers, message schema, partition count) visible
- [ ] Topics are seeded from event registry or auto-discovered from Kafka
- [ ] Page reloads correctly after navigating away and back

---

### Item 8 — PII Vault Data Types and Token Registry Blank

**Priority:** MEDIUM
**Status:** Pending
**Owner:** Backend / PII Vault

#### Background

The PII Vault module's data-types and token-registry pages show no content. This is
likely a seeding gap — the PII vault service may not have its lookup tables seeded.

The PII vault is a critical service (all sensitive data flows through it) and must
show a populated, functional UI in UAT.

#### Required Data

**Data Types to Seed:**
- EMAIL, PHONE, NATIONAL_ID, PASSPORT, DATE_OF_BIRTH, ADDRESS, FULL_NAME,
  BANK_ACCOUNT, CREDIT_CARD, MEDICAL_RECORD, IP_ADDRESS, BIOMETRIC

**Token Registry:**
- Should show all issued PII tokens, linked to their organization namespace
- Include token type, creation date, expiry, and masked preview of the original value

#### Definition of Done

- [ ] Data Types page shows all supported PII data types with descriptions
- [ ] Token Registry page lists issued tokens (paginated)
- [ ] System minimum data seed populates all standard data types
- [ ] API endpoints confirmed working: data-types GET, token-registry GET
- [ ] PII data type icons/labels match white-label theme

---

### Item 9 — Settings: Fake Active Sessions Cleanup

**Priority:** MEDIUM
**Status:** Pending
**Owner:** Backend / Identity

#### Background

The Settings page displays many fake/stale active sessions. This likely stems from
test data accumulated during development or a session store that was never cleared.

Real session tracking is required for UAT — users expect to see only their own
genuine active sessions.

#### Required Changes

1. Flush all fake sessions from the session store (identity service)
2. Implement proper session lifecycle: creation on login, expiry on logout/timeout
3. Settings page must show only sessions belonging to the authenticated user
4. Each session entry must show: device type, IP, location (approximate), last active, "Revoke" button

#### Definition of Done

- [ ] All fake/dev sessions purged from identity session store
- [ ] Settings page shows only real sessions for the logged-in user
- [ ] New sessions created on each login are visible
- [ ] Logout from one session does not affect other sessions (multi-session support)
- [ ] "Revoke All Other Sessions" action works
- [ ] Sessions expire correctly per JWT_EXPIRATION config

---

### Item 10 — zorbit-packager Tool: Review and Test

**Priority:** MEDIUM
**Status:** Pending (Soldier built 13 files, committed — needs review)
**Owner:** DevOps

#### Background

A new deployment orchestration tool was built at:
`/Users/s/workspace/zorbit/02_repos/zorbit-packager/`

It was built by a soldier agent (13 files committed). It needs human review and
end-to-end testing before being used for UAT deployments.

#### Tool Design

- Operator specifies target VMs (IPs, SSH keys, domain)
- Operator selects which modules to deploy
- Tool auto-resolves PFS dependencies (e.g., selecting pcg4 auto-adds datatable, form-builder)
- No source code on servers — compiled artifacts only (tar.gz)
- Idempotent: safe to re-run for upgrades

#### Review Checklist

- [ ] Read all 13 files — understand design and implementation
- [ ] Verify dependency resolution graph is complete and correct
- [ ] Test dry-run against UAT server (no actual deploy)
- [ ] Test actual deploy of a single service (e.g., zorbit-audit)
- [ ] Verify idempotency: run twice, confirm no duplication
- [ ] Confirm no source code lands on server
- [ ] Confirm artifact integrity check (hash verification)
- [ ] Document usage in zorbit-packager README

#### Definition of Done

- [ ] All 13 files reviewed and issues logged / fixed
- [ ] End-to-end deploy tested on UAT for at least one service
- [ ] zorbit-packager used as the official deploy mechanism for UAT
- [ ] README updated with operator runbook

---

### Item 11 — Disk Space Monitoring: UAT ARM Server

**Priority:** MEDIUM
**Status:** Ongoing concern
**Owner:** DevOps

#### Background

UAT ARM server is at 90% disk usage (53G / 60G).
Root cause: `node_modules` directories in each service (~150-300MB each).

This is a ticking time bomb — a single `npm install` run or log accumulation
could fill the disk and crash all services.

#### Short-Term Actions

1. Identify top disk consumers: `du -sh /home/sourav/apps/zorbit-platform/*/node_modules | sort -rh | head -20`
2. For each service, replace `node_modules` with a production-only install:
   `npm ci --omit=dev` (removes devDependencies, typically saves 40-60%)
3. Clear npm cache: `npm cache clean --force`
4. Clear PM2 logs older than 7 days: `pm2 flush`
5. Remove any dist-backup or old build artifacts

#### Long-Term Strategy

| Option | Description | Savings |
|--------|-------------|---------|
| npm ci --omit=dev | Remove devDependencies post-build | 40-60% per service |
| Shared node_modules symlink | Hoist common packages to a shared dir | 30-50% total |
| Docker layer caching | Build in Docker, deploy thin containers | 60-70% |
| zorbit-packager artifact deploy | Only dist/ + minimal node_modules | Best outcome |

#### Monitoring Setup

- [ ] Cron job to alert when disk > 80%: `df -h | awk '/\/dev\//{if($5+0>80) print}'`
- [ ] Weekly automated log rotation via PM2 `pm2-logrotate` module
- [ ] Monthly node_modules cleanup script

#### Definition of Done

- [ ] UAT disk usage below 70% (target: < 40G / 60G)
- [ ] Monitoring cron installed and tested
- [ ] Log rotation configured via pm2-logrotate
- [ ] Runbook documented for disk emergency

---

### Item 12 — PM2 Startup Persistence

**Priority:** LOW
**Status:** Pending
**Owner:** DevOps

#### Background

PM2 processes may not survive server reboot. If the UAT server reboots for any
reason (OS updates, hardware, etc.), all services will be down until manually
restarted.

#### Required Steps

```bash
# On UAT server, run as the zorbit deploy user:
pm2 startup
# Follow the output instructions (may need sudo for the generated command)
pm2 save
```

This must be re-run after every new service is added to PM2.

#### Definition of Done

- [ ] `pm2 startup` configured for the `sourav` user on UAT server
- [ ] `pm2 save` run with all current services in the saved list
- [ ] Server rebooted (or simulated) and all services recovered automatically
- [ ] Deployment runbook updated: "run pm2 save after every new service deploy"

---

### Item 13 — Space-Efficient Deployment Strategy

**Priority:** LOW
**Status:** Pending
**Owner:** DevOps

#### Background

Current deployment copies full `node_modules` (150-300MB per service) to the server.
This is wasteful and contributes to disk pressure (Item 11).

The correct pattern (already in Skill 1001) is to ship only compiled artifacts and
reinstall production dependencies on the server.

#### Target Deployment Artifact

```
dist/                    # compiled TypeScript output
package.json             # dependency manifest
package-lock.json        # lockfile for reproducible install
.env.example             # template (actual .env stays on server)
```

Then on server:
```bash
npm ci --omit=dev        # installs only production dependencies (~50MB vs 200MB)
pm2 restart <service>
```

#### Implementation

1. Update all deployment scripts to exclude `node_modules` from rsync
2. Add `npm ci --omit=dev` step to post-deploy hook
3. Verify all services start correctly with production-only dependencies
4. Update zorbit-packager to enforce this pattern

#### Definition of Done

- [ ] All service deploy scripts updated (no node_modules in rsync)
- [ ] `npm ci --omit=dev` runs automatically post-rsync
- [ ] All 15+ services verified working with production-only install
- [ ] Average service footprint confirmed < 80MB on server
- [ ] zorbit-packager artifact format updated to match this pattern

---

### Item 14 — Security Audit: RBAC Gaps

**Priority:** LOW
**Status:** Pending (HIGH PRIORITY — deferred to post-UAT)
**Owner:** Security / Platform

#### Background

From the security audit backlog: every endpoint across all modules needs an audit
for role-based access control gaps. This was flagged as HIGH PRIORITY but is
being tracked here as a UAT blocker only if critical endpoints are exposed.

#### Scope

- All `@Controller` routes across all deployed services
- Particular focus on: admin endpoints, data export, flush/delete operations,
  PII access, billing/licensing, user management
- Verify each endpoint has `@UseGuards(JwtAuthGuard, PrivilegeGuard)` or equivalent
- Verify privilege codes match the privilege registry in zorbit-authorization

#### Definition of Done

- [ ] Audit script run against all services (can use grep / static analysis)
- [ ] All admin-only endpoints confirmed protected
- [ ] All PII-touching endpoints confirmed protected + audit-logged
- [ ] Flush/delete endpoints require elevated privilege (not just any authenticated user)
- [ ] Report generated listing any unprotected endpoints found and remediation taken

---

## Dependency Map

Some items are blocked by or depend on others:

```
Item 2 (DB Navigation) ──────────────────► Item 4 (Support/Dev Center)
Item 1 (Setup Seeding) ──────────────────► Item 6 (PCG4 Setup 404)
Item 8 (PII Vault Seeding) ──────────────► Item 1 (Seeding framework)
Item 11 (Disk Space) ────────────────────► Item 13 (Space-efficient deploy)
Item 10 (packager review) ───────────────► Item 13 (deploy strategy)
Item 3 (ZMB Manifests) ──────────────────► ZMB Factory being complete
Item 12 (PM2 startup) ───────────────────► Item 11 (disk space — reboot-safe)
```

---

## UAT Go-Live Checklist

The following must be DONE before UAT is considered ready for stakeholder demos:

- [ ] Item 5: OAuth callbacks registered for all 3 providers
- [ ] Item 6: PCG4 Setup page not 404
- [ ] Item 2: Sidebar driven by navigation service (or clean fallback confirmed)
- [ ] Item 7: Messaging topics page shows data
- [ ] Item 8: PII Vault data types and token registry populated
- [ ] Item 9: Fake sessions cleaned up
- [ ] Item 11: Disk below 75%
- [ ] Item 12: PM2 survives reboot
- [ ] Item 1: At least 3 modules have Setup seeding implemented (identity, pcg4, pii-vault)
- [ ] Item 4: Support Center and Dev Center in sidebar (even stub pages)

---

## Notes

- Do NOT use `rsync --delete` without dry-run + backup (global rule)
- Server: sourav@85.25.93.171, Node 20 via nvm
- App dir: `/home/sourav/apps/zorbit-platform/`
- PM2 configs: `/home/sourav/apps/zorbit-platform/scripts/`
- All services use PostgreSQL container `zorbit-identity-db` on port 5433 (shared)
- Port offset pattern: default port + 100 on server (e.g. 3002 → 3102)
- Never certbot — wildcard certs exist for `*.scalatics.com`, `*.claimzippy.com`, `*.vitazoi.com`
- SSL for `*.onezippy.ai` — verify wildcard cert exists before UAT domain setup

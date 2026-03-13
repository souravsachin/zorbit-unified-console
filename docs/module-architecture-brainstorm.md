# Zorbit Module Architecture — Brainstorm Document

**Date:** 2026-03-13
**Status:** Draft — Pending Review

---

## 1. Module Presence Announcement (Service Registry)

### Problem
How do modules announce their existence to the platform so the navigation, authorization, and routing systems know about them?

### Options

#### Option A: Static Registration at Deploy Time
- Each module repo contains a `zorbit-manifest.json`
- CI/CD pipeline pushes manifest to navigation service on deploy
- Manifest declares: menu items, routes, privileges, capabilities
- Pros: deterministic, auditable, version-controlled
- Cons: requires redeploy to change registration

#### Option B: Runtime Self-Registration
- On startup, module calls `POST /api/v1/O/{orgId}/navigation/register`
- Navigation service records module and its capabilities
- Optional heartbeat for liveness tracking
- Pros: dynamic, supports hot-pluggable modules
- Cons: startup dependency, race conditions

#### Option C: Event-Driven Registration
- Module publishes `module.registered` Kafka event on deploy
- Navigation and authorization services consume and update state
- Pros: decoupled, async, fits MACH architecture
- Cons: eventual consistency, harder to debug

### Recommendation
**Hybrid A + C** — Static manifest (canonical, checked into repo) with Kafka event on deploy for downstream notification. Runtime registration (Option B) as fallback for hot-pluggable or third-party modules.

```
zorbit-manifest.json (in module repo)
  |
  +-- CI/CD reads manifest
  |     |
  |     +-- Pushes to navigation service API
  |     +-- Publishes module.registered event
  |
  +-- Navigation service assembles menu
  +-- Authorization service registers privileges
```

### Manifest Schema (Draft)

```json
{
  "module": {
    "id": "MOD-RA01",
    "code": "products.rating",
    "name": "Rating Engine",
    "version": "1.0.0",
    "suite": "products",
    "category": "product-config"
  },
  "menu": {
    "section": "products",
    "items": [
      {
        "code": "products.rating.factors",
        "label": "Rating Factors",
        "icon": "calculate",
        "fe_route": "/products/rating/factors",
        "be_route": "/api/v1/O/{{org_id}}/products/rating-factors",
        "seq": 4,
        "privileges": ["products.rating.read"]
      }
    ]
  },
  "privileges": [
    "products.rating.read",
    "products.rating.write",
    "products.rating.admin"
  ],
  "events": {
    "publishes": ["products.rating.factor.created", "products.rating.factor.updated"],
    "consumes": ["products.product.updated"]
  },
  "health": "/api/v1/health"
}
```

---

## 2. Menu Item Composition

### Problem
The current `menuConfig.json` is centralized in the navigation service. This won't scale to 50+ modules. Each module should own its own menu fragment.

### Proposed Architecture

```
Module A manifest ──┐
Module B manifest ──┼──> Navigation Service ──> Assembled Menu
Module C manifest ──┘         |
                              |
                    ┌─────────┴──────────┐
                    | Assembly Rules:     |
                    | 1. Collect fragments|
                    | 2. Group by section |
                    | 3. Sort by seq      |
                    | 4. Filter by privs  |
                    | 5. Apply user prefs |
                    └─────────────────────┘
```

### Assembly Rules

1. Each module declares which **parent section** it belongs to
2. Sections are created implicitly from module registrations
3. Items within a section are sorted by `seq` (server-defined default)
4. User preference overrides can reorder items (see Section 3)
5. Privilege filtering removes items the user cannot access

### Section Ownership
- Platform sections (Dashboard, Identity, Authorization, etc.) are owned by platform services
- Business sections (Products, Claims, Policies, etc.) are contributed by module manifests
- A module can add items to an existing section or create a new one

---

## 3. User Menu Customization via Preferences

### Problem
Users should be able to reorder menu items, hide items they don't use, and pin favorites — without affecting other users.

### Preference Schema Extension

```typescript
ui?: {
  sidebar?: {
    mode?: 'compact' | 'normal';
    pinned?: boolean;
    collapsedSections?: string[];

    // New fields for menu customization
    itemOrder?: Record<string, number>;   // itemId -> custom seq override
    hiddenItems?: string[];               // items user chose to hide
    favorites?: string[];                 // pinned items shown at top
    sectionOrder?: Record<string, number>;// sectionId -> custom seq override
  };
}
```

### Resolution Order

```
1. Server default seq (from module manifest / menuConfig)
2. Org-level overrides (admin can set org-wide defaults)
3. User preference overrides (personal customization)
```

### UI Interactions
- Drag-and-drop reorder within sections
- Right-click context menu: Hide, Pin to Top, Reset
- Settings page: manage hidden items, reset all customizations

---

## 4. Privilege-Based Menu Filtering

### Current State
Navigation service already filters by user privileges. Items have privilege codes; menu assembly checks the user's assigned privileges.

### Platform Hierarchy

```
Platform
  └── Suite
       └── Product Category
            └── Product Line
                 └── Module
                      └── Sub-module
```

### Privilege Code Convention

```
{suite}.{module}.{action}
{suite}.{module}.{sub-module}.{action}
```

Examples:
```
products.*                         -> full Products suite access
products.rating.*                  -> full Rating Engine access
products.rating.factors.read       -> read-only on rating factors
products.rating.factors.write      -> can create/edit rating factors
identity.users.read                -> can view users
identity.users.admin               -> can manage users
```

### Filtering Behavior

| User Privilege | Menu Items Shown |
|----------------|------------------|
| `products.*` | All items under Products section |
| `products.rating.read` | Only Rating Engine (read views) |
| `admin.*` | Full Admin section |
| No matching privilege | Section hidden entirely |

### Wildcard Rules
- `*` at any level grants access to all children
- Most specific privilege wins (deny overrides allow if implemented)
- Platform admins (`platform.admin`) see everything

---

## 5. URI Layout Strategy for 50+ Modules

### Problem
With 50+ modules spanning suites, product categories, and product lines, how should FE and BE URIs be structured?

### Options Comparison

| Strategy | FE Example | BE Example | Deploy | Isolation |
|----------|-----------|-----------|--------|-----------|
| **Path-based** | `zorbit.com/products/rating/factors` | `/api/v1/O/{org}/products/rating-factors` | Single SPA | Low |
| **Subdomain** | `products.zorbit.com/rating/factors` | `api.products.zorbit.com/v1/O/{org}/rating-factors` | Per-suite SPA | Medium |
| **Full domain** | `rating.scalatics.com/factors` | `api.rating.scalatics.com/v1/O/{org}/factors` | Per-module SPA | High |
| **Hybrid** | Platform: path, Business: subdomain | Platform: path, Business: subdomain | Mixed | Best balance |

### Recommendation: Hybrid Approach

```
Platform services (path-based, single SPA):
  zorbit.scalatics.com/dashboard
  zorbit.scalatics.com/users
  zorbit.scalatics.com/settings
  zorbit.scalatics.com/admin/*

Business suites (subdomain-based, per-suite SPAs):
  products.zorbit.scalatics.com/catalog
  products.zorbit.scalatics.com/rating/factors
  products.zorbit.scalatics.com/rules

  claims.zorbit.scalatics.com/submissions
  claims.zorbit.scalatics.com/adjudication

  policies.zorbit.scalatics.com/lifecycle
  policies.zorbit.scalatics.com/endorsements
```

### Backend URIs (Always Path-Based)

```
All APIs go through a single API gateway:
  api.zorbit.scalatics.com/v1/O/{org}/products/rating-factors
  api.zorbit.scalatics.com/v1/O/{org}/claims/submissions

Or per-service (current pattern):
  zorbit.scalatics.com/api/products/v1/O/{org}/rating-factors
  zorbit.scalatics.com/api/claims/v1/O/{org}/submissions
```

### Auth & SSO Across Subdomains

- JWT cookie scoped to `*.zorbit.scalatics.com`
- All subdomains share the same identity service
- Token refresh happens on any subdomain
- CORS configured for `*.zorbit.scalatics.com`

### DNS & Certificate Management

- Wildcard cert: `*.zorbit.scalatics.com` (single Let's Encrypt cert)
- Nginx: one server block per suite subdomain, or wildcard catch-all
- New suites: add DNS A record + nginx config (automatable)

### Migration Path

```
Phase 1 (Now):     All path-based under zorbit.scalatics.com
Phase 2 (Soon):    Subdomain for first business suite (products)
Phase 3 (Scale):   Each suite gets its own subdomain + SPA
Phase 4 (Mature):  Full domain for enterprise-grade isolation
```

---

## 6. Module Menu Integration Flow (End-to-End)

```
Developer creates module
  |
  +-- Adds zorbit-manifest.json to repo
  |
  +-- CI/CD deploys module
  |     |
  |     +-- Pushes manifest to navigation service
  |     +-- Publishes module.registered event
  |
  +-- Navigation service updates menu assembly
  |
  +-- User logs in
  |     |
  |     +-- GET /api/v1/U/{userId}/menu
  |     +-- Navigation service:
  |           1. Collects all module manifests
  |           2. Filters by user privileges
  |           3. Applies org-level ordering
  |           4. Returns assembled menu
  |
  +-- Frontend renders menu
  |     |
  |     +-- Applies user preference overrides
  |     +-- Caches in sessionStorage
  |
  +-- User clicks menu item
        |
        +-- Path-based: same SPA handles route
        +-- Subdomain: redirects to suite SPA
```

---

## Open Questions

1. Should modules be able to contribute to existing platform sections (e.g., add an item under "Settings") or only to their own sections?
2. Do we need a module dependency graph (Module A requires Module B)?
3. Should menu item visibility be controllable at the org level (admin hides modules org-wide)?
4. How do we handle module versioning in the menu (v1 and v2 of same module)?
5. What's the convention for module sub-routes that are deep-linked (e.g., `/products/rating/factors/FAC-92AF/edit`)?

---

## Next Steps

- [ ] Finalize module manifest schema
- [ ] Get enum values for platform hierarchy (suites, categories, product lines, modules)
- [ ] Implement manifest registration endpoint in navigation service
- [ ] Add menu assembly from registered modules
- [ ] Build user menu customization UI (drag-reorder, hide, pin)
- [ ] Set up wildcard SSL cert for `*.zorbit.scalatics.com`
- [ ] Prototype first subdomain-based suite (products)

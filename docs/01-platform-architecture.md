# Zorbit Platform Architecture: Module Integration & Navigation

**Document ID:** ZORBIT-ARCH-001
**Status:** Approved
**Owner:** Platform Engineering

---

## Version History

| Version | Date       | Author            | Changes                                                        |
|---------|------------|-------------------|----------------------------------------------------------------|
| 0.1     | 2026-03-13 | Platform Team     | Initial brainstorm (module-architecture-brainstorm.md)         |
| 1.0     | 2026-03-13 | Platform Team     | Formalized architecture from brainstorm decisions              |

---

## Table of Contents

1. [Module Presence Announcement (Service Registry)](#1-module-presence-announcement-service-registry)
2. [Menu Item Composition](#2-menu-item-composition)
3. [User Menu Customization via Preferences](#3-user-menu-customization-via-preferences)
4. [Privilege Model](#4-privilege-model)
5. [URI Layout Strategy](#5-uri-layout-strategy)
6. [Module Dependency Graph](#6-module-dependency-graph)
7. [Org-Level Visibility (Provision)](#7-org-level-visibility-provision)
8. [Module Versioning](#8-module-versioning)
9. [End-to-End Flow](#9-end-to-end-flow)
10. [Open Design Decisions](#10-open-design-decisions)

---

## 1. Module Presence Announcement (Service Registry)

### Decision

**Hybrid approach.** A static manifest checked into the module repository serves as the canonical source of truth. On deploy, a Kafka event notifies downstream services. Runtime self-registration is available as a fallback for hot-pluggable or third-party modules that cannot participate in the standard CI/CD pipeline.

### Rationale

- The static manifest is version-controlled, auditable, and deterministic.
- Kafka events decouple the deploy pipeline from downstream consumers (navigation, authorization, routing).
- Runtime self-registration provides an escape hatch for modules that are developed outside the organization or need dynamic registration without a redeploy.

### Flow

```
zorbit-manifest.json (in module repo, canonical)
  |
  +-- CI/CD reads manifest on deploy
  |     |
  |     +-- Pushes to navigation service API
  |     +-- Publishes module.registered event to Kafka
  |
  +-- Navigation service assembles menu from registered manifests
  +-- Authorization service registers declared privileges
  +-- Routing service updates gateway rules
  |
  +-- (Fallback) Module calls POST /api/pfs/navigation/v1/G/global/modules/register on startup
```

### Manifest Schema: `zorbit-manifest.json`

Every module repository must contain a `zorbit-manifest.json` at the repository root. The manifest declares the module's identity, menu contributions, privilege requirements, event contracts, health endpoint, integration preferences, and dependencies.

```json
{
  "module": {
    "id": "MOD-RA01",
    "code": "products.rating",
    "name": "Rating Engine",
    "version": "1.2.0",
    "suite": "products",
    "category": "product-config"
  },
  "menu": {
    "section": "products",
    "sectionLabel": "Products",
    "sectionIcon": "inventory_2",
    "sectionSeq": 10,
    "items": [
      {
        "code": "products.rating.factors",
        "label": "Rating Factors",
        "icon": "calculate",
        "route": "/products/rating/factors",
        "seq": 4,
        "privileges": ["products.rating.read"]
      },
      {
        "code": "products.rating.tables",
        "label": "Rate Tables",
        "icon": "table_chart",
        "route": "/products/rating/tables",
        "seq": 5,
        "privileges": ["products.rating.read"]
      }
    ],
    "additionalSections": [],
    "crossSectionItems": [],
    "justification": null
  },
  "privileges": [
    "products.rating.read",
    "products.rating.write",
    "products.rating.admin"
  ],
  "events": {
    "publishes": [
      "products.rating.factor.created",
      "products.rating.factor.updated",
      "products.rating.table.published"
    ],
    "consumes": [
      "products.product.updated"
    ]
  },
  "health": "/api/app/products.rating/v1/health",
  "integration": {
    "preferred": ["path-based", "subdomain"],
    "subdomain": "products",
    "fullDomain": "rating.scalatics.com"
  },
  "dependencies": [
    "zorbit-identity",
    "zorbit-authorization",
    "zorbit-navigation"
  ]
}
```

#### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `module.id` | Yes | Short-hash identifier (e.g., `MOD-RA01`). Immutable, globally unique. |
| `module.code` | Yes | Dot-notation code reflecting the hierarchy (e.g., `products.rating`). |
| `module.name` | Yes | Human-readable display name. |
| `module.version` | Yes | Semantic version (semver). |
| `module.suite` | Yes | Suite this module belongs to. |
| `module.category` | No | Product category within the suite. |
| `menu.section` | Yes | Primary section this module contributes to. |
| `menu.sectionLabel` | No | Label for the section if this module creates it. |
| `menu.sectionIcon` | No | Material icon name for the section. |
| `menu.sectionSeq` | No | Default sort order for the section. Supports negative indices. |
| `menu.items[]` | Yes | Array of menu items contributed by this module. |
| `menu.items[].code` | Yes | Unique item code matching the privilege namespace. |
| `menu.items[].label` | Yes | Display label. |
| `menu.items[].icon` | Yes | Material icon name. |
| `menu.items[].route` | Yes | Route path (same for FE and BE resource path). |
| `menu.items[].seq` | Yes | Sort order within section. Supports negative indices. |
| `menu.items[].privileges` | Yes | Privileges required to see this item. |
| `menu.additionalSections` | No | Additional sections this module creates (requires justification). |
| `menu.crossSectionItems` | No | Items written into sections owned by other modules (requires justification). |
| `menu.justification` | No | Free-text justification for multi-section or cross-section writes. |
| `privileges[]` | Yes | All privilege codes this module requires. |
| `events.publishes[]` | Yes | Events this module emits. |
| `events.consumes[]` | Yes | Events this module subscribes to. |
| `health` | Yes | Health check endpoint path. |
| `integration.preferred` | Yes | Ordered list of preferred integration styles. |
| `integration.subdomain` | No | Desired subdomain name if subdomain-based integration is allocated. |
| `integration.fullDomain` | No | Desired full domain if full-domain integration is allocated. |
| `dependencies[]` | No | Other modules or platform services this module depends on. |

#### Integration Style Allocation

The manifest proposes one or more integration methods in order of preference. The platform evaluates the proposals and responds with the allocation it can satisfy. The platform attempts to honor the highest-preference style that is feasible given current infrastructure.

| Style | Pattern | When Allocated |
|-------|---------|----------------|
| Path-based | `zorbit.com/<<module>>/...` | Default. Always available. |
| Subdomain | `<<suite>>.zorbit.com/<<module>>/...` | When wildcard DNS and per-suite SPA are provisioned. |
| Full domain | `<<module>>.scalatics.com/...` | Enterprise isolation scenarios. Requires dedicated DNS + cert. |

---

## 2. Menu Item Composition

### Decision

Menu composition follows a decentralized model. Each module owns its menu fragment via `zorbit-manifest.json`. The navigation service assembles the full menu at request time.

### Assembly Rules

The navigation service applies the following rules in order when assembling a user's menu:

1. **Collect** all menu fragments from registered module manifests.
2. **Group** items by section.
3. **Sort** sections by `sectionSeq`, then items within each section by `seq`.
   - Positive values sort normally (ascending).
   - Negative indices follow Ruby-style semantics: `-1` = absolute last position, `-2` = second to last, and so on. This applies to both sections and items within sections.
4. **Filter** items by user privileges (see [Section 4](#4-privilege-model)).
5. **Apply org-level overrides** (admin-configured section/item ordering, hidden items).
6. **Apply user preference overrides** (personal reordering, hidden items, favorites).

```
Module A manifest ──┐
Module B manifest ──┼──> Navigation Service ──> Assembled Menu (per-user)
Module C manifest ──┘         |
                              |
                    ┌─────────┴──────────────────┐
                    | 1. Collect fragments        |
                    | 2. Group by section         |
                    | 3. Sort by seq (neg. index) |
                    | 4. Filter by privileges     |
                    | 5. Org-level overrides      |
                    | 6. User pref overrides      |
                    └────────────────────────────-┘
```

### Section Ownership Rules

Modules contribute menu items to sections. The platform enforces a justification model that balances clean separation with practical flexibility.

| Scenario | Justification Level | Description |
|----------|---------------------|-------------|
| Module creates its own section | **Encouraged** | Clean separation. Each module owns a dedicated section. This is the default and preferred pattern. |
| Module creates multiple sections | **Allowed with justification** | Module must explain why a single section is insufficient. Justification is recorded in `menu.justification`. |
| Module writes items into another module's section | **Higher justification** | Cross-module section contributions require explicit justification. The owning module is not consulted at runtime, but the justification is recorded for platform review. |
| Module adds items to platform sections | **Highest justification** | Adding items to platform-owned sections (Dashboard, Settings, Identity, etc.) is permitted because innovative modules may legitimately extend platform functionality. Requires clear justification. |

**Justification is for record-keeping, not automated processing.** The platform records the justification text and surfaces it in the admin console for human review. It does not block registration based on justification content.

### Why Clutter Is Not a Concern

In a typical enterprise deployment, most users are scoped to a specific department, role, and sub-department. They access 1 to 5 modules. Privilege-based filtering ensures that 98% of users never see items outside their scope. The full menu (all 50+ modules) is only visible to platform administrators, who expect and need that breadth.

---

## 3. User Menu Customization via Preferences

### Decision

Users can personalize their sidebar without affecting other users. Preferences are stored in the identity service as part of the user's preference object.

### Preference Schema Extension

```typescript
interface SidebarPreferences {
  // Per-item custom seq override (itemCode -> custom seq)
  itemOrder?: Record<string, number>;

  // Items the user has chosen to hide
  hiddenItems?: string[];

  // Pinned items shown at the top of the sidebar
  favorites?: string[];

  // Per-section custom seq override (sectionCode -> custom seq)
  sectionOrder?: Record<string, number>;
}
```

These fields are nested under the user's existing preference object:

```json
{
  "ui": {
    "sidebar": {
      "mode": "compact",
      "pinned": true,
      "collapsedSections": ["admin"],
      "itemOrder": { "products.rating.factors": 1, "products.rating.tables": 2 },
      "hiddenItems": ["products.rating.tables"],
      "favorites": ["products.rating.factors"],
      "sectionOrder": { "products": 1, "claims": 2 }
    }
  }
}
```

### Resolution Order

The menu rendering pipeline applies overrides in this order. Each layer can override the previous.

```
1. Server default seq    (from module manifest zorbit-manifest.json)
         |
         v
2. Org-level overrides   (admin-configured via admin console)
         |
         v
3. User pref overrides   (personal customization stored in identity service)
```

### UI Interactions

| Interaction | Mechanism |
|-------------|-----------|
| Reorder items | Drag-and-drop within a section |
| Reorder sections | Drag-and-drop in the section header area |
| Hide an item | Right-click context menu: "Hide" |
| Pin to favorites | Right-click context menu: "Pin to Top" |
| Reset single item | Right-click context menu: "Reset to Default" |
| Reset all | Settings page: "Reset All Menu Customizations" |
| Manage hidden items | Settings page: list of hidden items with "Show" toggle |

---

## 4. Privilege Model

### Decision

Privilege codes follow a dot-notation hierarchy that mirrors the module code structure. Wildcards grant access to all children at any level.

### Privilege Code Format

```
module.submodule.level_of_privilege
```

Or, for finer granularity:

```
module.submodule.attribute.level_of_privilege
```

### Examples

| Privilege Code | Grants |
|----------------|--------|
| `products.*` | Full access to all modules in the Products suite |
| `products.rating.*` | Full access to the Rating Engine module |
| `products.rating.read` | Read-only access to Rating Engine |
| `products.rating.factors.write` | Write access to rating factors specifically |
| `identity.users.read` | Read-only access to user management |
| `identity.users.admin` | Administrative access to user management |
| `platform.admin` | Full platform access (sees everything) |

### Wildcard Rules

- `*` at any level grants access to all children below that level.
- The most specific matching privilege applies.
- `platform.admin` is a special privilege that bypasses all filtering. Platform admins see every menu item and can access every API endpoint.

### Hierarchy

```
Platform
  +-- Suite (e.g., products, claims, policies)
       +-- Module (e.g., rating, underwriting)
            +-- Sub-module (e.g., factors, tables)
                 +-- Action (e.g., read, write, admin)
```

### Filtering Behavior

| User Privilege | Effect on Menu |
|----------------|----------------|
| `products.*` | All items under the Products section are visible |
| `products.rating.read` | Only Rating Engine read-view items are visible |
| `platform.admin` | Every item across all sections is visible |
| No matching privilege for a section | Entire section is hidden |

---

## 5. URI Layout Strategy

### Key Principles

**Strict FE/BE route consistency.** If the frontend route is `/rating/factors`, the backend resource path must be `/rating/factors` as well. Not `/rating-factors`. Not `/ratingFactors`. Convention over configuration. The only additions the backend route receives are the API version prefix and namespace scoping.

**No verbs in URIs.** All endpoints are noun-based resources.

**All API requests flow through the platform's API gateway**, which handles authentication, authorization, auditing, security scanning, and throughput control. Individual services never handle these concerns directly.

### URI Pattern

```
/api/{scope}/<<module_code>>/v1/{namespace}/{namespace_id}/<<resource_path>>
```

Where:

| Segment | Values | Description |
|---------|--------|-------------|
| `scope` | `pfs` or `app` | `pfs` = platform service, `app` = application/business module |
| `module_code` | e.g., `identity`, `products.rating` | Module identifier from manifest |
| `v1` | Semver major | API version |
| `namespace` | `G`, `O`, `D`, `U` | Namespace level (Global, Organization, Department, User) |
| `namespace_id` | e.g., `O-92AF` | Short-hash namespace identifier |
| `resource_path` | e.g., `factors`, `tables` | Resource path, matching the FE route exactly |

### Examples

| Description | Frontend Route | Backend Route |
|-------------|---------------|---------------|
| Rating factors list | `/products/rating/factors` | `/api/app/products.rating/v1/O/O-92AF/factors` |
| Single rating factor | `/products/rating/factors/FAC-92AF` | `/api/app/products.rating/v1/O/O-92AF/factors/FAC-92AF` |
| User management | `/identity/users` | `/api/pfs/identity/v1/O/O-92AF/users` |
| Audit logs | `/audit/events` | `/api/pfs/audit/v1/O/O-92AF/events` |

### Deep-Link Convention

Deep-links follow a consistent pattern that encodes the navigation path through the module hierarchy:

```
/<<module>>/<<module-hash>>/<<submodule>>/<<submodule-hash>>/<<object>>/<<attribute-and-key>>
```

Example:

```
/products/rating/MOD-RA01/factors/FAC-92AF/thresholds
```

### Integration Styles

Modules propose their preferred integration style in the manifest. The platform allocates based on current infrastructure capabilities.

| Style | Frontend Pattern | Backend Pattern | Use Case |
|-------|-----------------|-----------------|----------|
| Path-based | `zorbit.com/<<module>>/...` | `/api/{scope}/<<module>>/v1/...` | Default for all modules |
| Subdomain | `<<suite>>.zorbit.com/<<module>>/...` | Same API gateway | Suite-level isolation |
| Full domain | `<<module>>.scalatics.com/...` | Same API gateway | Enterprise-grade isolation |

Regardless of the frontend integration style, the backend API routes are always served through the same API gateway. The gateway handles authentication, authorization, auditing, and security uniformly. Identity, authorization, audit, and other common services remain the same regardless of whether the module uses path-based, subdomain, or full-domain integration. The complexity is abstracted away from the module.

### Migration Path

| Phase | Scope | Description |
|-------|-------|-------------|
| Phase 1 (Current) | All path-based | Everything under `zorbit.scalatics.com/*`. Simplest to operate. |
| Phase 2 | First suite subdomain | Provision `products.zorbit.scalatics.com` for the Products suite. Validate SSO, CORS, and routing. |
| Phase 3 | Per-suite subdomains | Each suite gets its own subdomain and SPA. Wildcard cert covers `*.zorbit.scalatics.com`. |
| Phase 4 | Full domain isolation | Enterprise customers get dedicated domains (e.g., `rating.scalatics.com`). Requires per-domain DNS and certificates. |

### Auth Across Integration Styles

- JWT cookie scoped to `*.zorbit.scalatics.com` (covers all subdomain-based integrations).
- Full-domain integrations use token exchange via the identity service.
- All subdomains and domains share the same identity service as the central authentication authority.
- CORS is configured for the appropriate origin pattern at each phase.

---

## 6. Module Dependency Graph

### Decision

Modules can declare dependencies on other modules in their `zorbit-manifest.json` via the `dependencies` array. The platform validates the dependency graph on registration.

### Rules

1. **Declaration.** Each module lists its dependencies by repository name (e.g., `zorbit-identity`, `zorbit-authorization`) or by module code (e.g., `products.catalog`).
2. **Validation.** On module registration, the platform checks that all declared dependencies are themselves registered. If a dependency is missing, registration fails with a clear error identifying the missing dependency.
3. **Circular dependency rejection.** The platform performs a topological sort of the dependency graph. If a cycle is detected, registration is rejected. The error message identifies the cycle.
4. **Soft vs. hard dependencies.** By default, all dependencies are hard (required). A future schema extension may introduce `optionalDependencies` for modules that can operate in degraded mode without a dependency.

### Platform Service Dependencies

Platform services (`zorbit-identity`, `zorbit-authorization`, `zorbit-navigation`, `zorbit-messaging`, `zorbit-audit`, `zorbit-pii-vault`) are always available. Declaring a dependency on a platform service is informational; it will never cause a registration failure.

---

## 7. Org-Level Visibility (Provision)

### Decision

The schema must accommodate org-level module visibility controls from the start, even though enforcement is not a must-have for the initial release. This avoids a schema rewrite later.

### Schema

The navigation service stores an org-level configuration that can override module visibility:

```json
{
  "orgId": "O-92AF",
  "modules": {
    "products.rating": {
      "visible": true,
      "overrides": {
        "hiddenItems": ["products.rating.tables"],
        "itemOrder": {}
      }
    },
    "claims.submission": {
      "visible": false
    }
  }
}
```

### Behavior

| `visible` | Effect |
|-----------|--------|
| `true` (default) | Module's menu items are included in assembly, subject to privilege filtering. |
| `false` | Module's menu items are excluded for all users in this org, regardless of privileges. |

The `overrides` object allows org-level admins to hide specific items or reorder items within a module's section. These overrides sit between the server defaults and user preferences in the resolution order (see [Section 3](#3-user-menu-customization-via-preferences)).

---

## 8. Module Versioning

### Decision

Modules declare their version using semantic versioning (semver) in the `module.version` field of `zorbit-manifest.json`. The platform supports running multiple major versions of the same module simultaneously.

### Rules

1. **Semver required.** All module versions follow `MAJOR.MINOR.PATCH` format per [semver.org](https://semver.org/).
2. **Breaking changes increment MAJOR.** A new major version indicates breaking API changes.
3. **Parallel version routing.** When a new major version is deployed alongside an existing one, the platform routes requests based on the API version prefix:
   - `v1` routes to the v1 deployment.
   - `v2` routes to the v2 deployment.
4. **Menu coexistence.** If both v1 and v2 of a module are registered, the navigation service shows the version that the user's org is configured to use. By default, the latest version is shown.
5. **Deprecation.** A module can declare `"deprecated": true` in its manifest. The admin console surfaces deprecated modules with a warning. Deprecated modules continue to function but are flagged for migration.

---

## 9. End-to-End Flow

The following sequence describes the complete lifecycle from a developer creating a module to a user seeing its menu items.

### Developer Phase

```
1. Developer creates a new module repository
   |
2. Developer adds zorbit-manifest.json to the repo root
   |   - Declares module identity (id, code, name, version, suite)
   |   - Declares menu fragment (section, items, seq, privileges)
   |   - Declares privileges, events, health endpoint
   |   - Declares integration style preference
   |   - Declares dependencies on other modules
   |
3. Developer implements the module following Zorbit architecture rules
   |   - REST API grammar with namespace isolation
   |   - Short-hash identifiers
   |   - Event-driven integration via Kafka
   |   - SDK middleware for auth and observability
```

### Deployment Phase

```
4. CI/CD pipeline reads zorbit-manifest.json
   |
5. Pipeline validates manifest schema
   |
6. Pipeline deploys the module (Docker/Kubernetes)
   |
7. Pipeline registers the module with the platform:
   |   +-- POST manifest to navigation service
   |   +-- Navigation service validates dependency graph
   |   +-- Navigation service stores manifest
   |   +-- Publish module.registered event to Kafka
   |
8. Downstream services react:
       +-- Authorization service registers declared privileges
       +-- Routing service updates API gateway rules
       +-- Platform responds with integration allocation
            (e.g., path-based granted, subdomain pending)
```

### User Phase

```
 9. User logs in via identity service
    |
10. Frontend requests menu:
    |   GET /api/pfs/navigation/v1/U/U-81F3/menu
    |
11. Navigation service assembles menu:
    |   a. Collects all registered module manifests
    |   b. Groups items by section
    |   c. Sorts by seq (supports negative indices)
    |   d. Filters by user's privileges
    |   e. Applies org-level overrides (hidden modules, reordering)
    |   f. Returns assembled menu JSON
    |
12. Frontend receives menu and applies user preferences:
    |   a. Applies itemOrder overrides
    |   b. Filters hiddenItems
    |   c. Prepends favorites to top
    |   d. Applies sectionOrder overrides
    |   e. Caches in sessionStorage
    |
13. User sees personalized sidebar
    |
14. User clicks a menu item
    |   +-- Path-based: SPA handles route internally
    |   +-- Subdomain: redirect to suite SPA
    |   +-- Full domain: redirect to module domain
    |
15. API request flows through gateway:
        +-- JWT validation (identity service)
        +-- Namespace verification
        +-- Privilege enforcement (authorization service)
        +-- Audit logging (audit service)
        +-- Route to module backend
```

---

## 10. Open Design Decisions

The following items have been discussed and have provisional answers, but remain open for refinement as the platform matures.

### Manifest Justification for Cross-Section Writes

The `menu.justification` field is free-text and intended for record-keeping. The platform does not parse or enforce rules based on its content. It is surfaced in the admin console for human review during module onboarding. Future iterations may introduce structured justification categories if patterns emerge.

### Platform Section Extension by Modules

Modules are permitted to add items to platform-owned sections (Dashboard, Settings, etc.) with the highest justification level. This is explicitly allowed because innovative modules may need to extend core platform functionality. However, modules are always encouraged to use their own section as the primary approach.

### Terminology Review

The current hierarchy uses the following terms:

```
Suite > Product Category > Product Line > Module > Sub-module
```

These terms should be reviewed against industry standards before the platform reaches general availability. Candidates for alignment include:

- **Suite** vs. "product family" vs. "domain"
- **Product category** vs. "capability area" vs. "vertical"
- **Module** vs. "service" vs. "application"
- **Sub-module** vs. "feature" vs. "component"

The chosen terminology will be codified in `zorbit-core` and enforced across all manifests.

### Negative Index Boundary Behavior

When multiple items declare the same negative index (e.g., two items both set `seq: -1`), the platform resolves ties by module registration order (first registered wins the position). This behavior should be documented in the SDK and validated with test cases.

---

*This document supersedes the brainstorm at `docs/module-architecture-brainstorm.md`. The brainstorm is retained for historical context.*

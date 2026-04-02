# Dashboard Collation Architecture

**Version:** 1.0
**Date:** 2026-03-13T19:00
**Status:** Approved for implementation
**Approach:** Widget Registry (Phase A) → Backend Aggregator (Phase C) → Event-sourced (Phase B)

---

## 1. Problem Statement

The platform-level Dashboard must aggregate KPIs from independent modules (PCG4, future modules) without violating MACH service isolation principles. No cross-database queries, no hardcoded module knowledge in the dashboard.

---

## 2. Solution: Tiered Widget Registry

Each module declares **dashboard widgets** in its `zorbit-manifest.json`, organized into tiers. The dashboard frontend discovers these widgets via the navigation service and renders them adaptively based on how many modules the current user has access to.

### 2.1 Widget Manifest (in zorbit-manifest.json)

```json
"dashboard": {
  "widgets": [
    {
      "id": "pcg4-config-count",
      "label": "Product Configurations",
      "type": "stats-card",
      "tier": 1,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/setup/stats",
      "field": "configurations",
      "icon": "category",
      "color": "blue",
      "link": "/org/{{org_id}}/app/pcg4/configurations",
      "refresh_interval": 60
    },
    {
      "id": "pcg4-plan-count",
      "label": "Active Plans",
      "type": "stats-card",
      "tier": 1,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/setup/stats",
      "field": "plans",
      "icon": "layers",
      "color": "green",
      "link": "/org/{{org_id}}/app/pcg4/configurations",
      "refresh_interval": 60
    },
    {
      "id": "pcg4-benefit-count",
      "label": "Benefits Configured",
      "type": "stats-card",
      "tier": 2,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/setup/stats",
      "field": "benefits",
      "icon": "shield_check",
      "color": "purple",
      "link": "/org/{{org_id}}/app/pcg4/configurations",
      "refresh_interval": 120
    },
    {
      "id": "pcg4-encounter-count",
      "label": "Encounter Types",
      "type": "stats-card",
      "tier": 2,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/setup/stats",
      "field": "encounterTypes",
      "icon": "clipboard_list",
      "color": "amber",
      "link": "/org/{{org_id}}/app/pcg4/configurations",
      "refresh_interval": 300
    },
    {
      "id": "pcg4-recent-changes",
      "label": "Recent Config Changes",
      "type": "activity-feed",
      "tier": 3,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/configurations?sort=updatedAt&limit=5",
      "refresh_interval": 30
    },
    {
      "id": "pcg4-status-breakdown",
      "label": "Configuration Status",
      "type": "donut-chart",
      "tier": 3,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/setup/stats",
      "field": "statusBreakdown",
      "refresh_interval": 120
    },
    {
      "id": "pcg4-deployments-active",
      "label": "Active Deployments",
      "type": "stats-card",
      "tier": 4,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/deployments?status=active",
      "field": "count",
      "icon": "rocket",
      "color": "teal",
      "refresh_interval": 60
    },
    {
      "id": "pcg4-coverage-gaps",
      "label": "Coverage Mapping Gaps",
      "type": "stats-card",
      "tier": 4,
      "endpoint": "/api/app/pcg4/v1/O/{{org_id}}/coverage-mappings?status=in_progress",
      "field": "count",
      "icon": "alert_triangle",
      "color": "red",
      "refresh_interval": 300
    }
  ]
}
```

### 2.2 Tier Structure

| Tier | Max widgets per module | When shown | Purpose |
|------|----------------------|------------|---------|
| **1** | 2 | Always | Hero KPIs — the two numbers that define the module's health |
| **2** | 4 | When user has ≤ 6 modules | Supporting metrics — deeper operational view |
| **3** | 8 | When user has ≤ 3 modules | Activity feeds, charts — rich context |
| **4** | 16 | When user has 1 module | Full detail — everything the module can surface |

### 2.3 Adaptive Rendering Algorithm

```
let modules = getUserModules(currentUser)
let tier = calculateMaxTier(modules.length)

function calculateMaxTier(moduleCount):
    if moduleCount <= 1:  return 4    // show everything
    if moduleCount <= 3:  return 3    // rich view
    if moduleCount <= 6:  return 2    // operational view
    return 1                          // hero KPIs only

for each module in modules:
    widgets = module.dashboard.widgets
                .filter(w => w.tier <= tier)
                .sort(by tier asc, then seq asc)
    render(widgets)
```

The dashboard grid adapts:
- **Tier 1 only** (many modules): compact row of stats cards, 2 per module
- **Tier 1+2** (medium): stats cards grid, 4-6 per module
- **Tier 1+2+3** (few modules): stats cards + activity feed + charts
- **All tiers** (single module): full module dashboard with everything

### 2.4 Standard Widget Types

| Type | Renders as | Data contract |
|------|-----------|---------------|
| `stats-card` | Number + label + icon + trend arrow | `{ value: number, trend?: number, label?: string }` |
| `activity-feed` | Chronological list of recent events | `{ items: [{ message, timestamp, actor, link }] }` |
| `donut-chart` | Proportional breakdown | `{ segments: [{ label, value, color }] }` |
| `bar-chart` | Comparison bars | `{ bars: [{ label, value }] }` |
| `table` | Compact data table | `{ columns: [...], rows: [...] }` |
| `status-grid` | Traffic-light grid | `{ items: [{ label, status: green|amber|red }] }` |

---

## 3. Data Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Module       │     │  Navigation     │     │  Dashboard       │
│  manifest.json│────▶│  Service        │────▶│  Frontend        │
│  (widgets)    │     │  /dashboard-    │     │  (renders grid)  │
│               │     │   widgets       │     │                  │
└──────────────┘     └─────────────────┘     └───────┬──────────┘
                                                      │
                                              for each widget:
                                                      │
                                              ┌───────▼──────────┐
                                              │  Module API      │
                                              │  (direct call)   │
                                              └──────────────────┘
```

1. **Registration:** Module's `zorbit-manifest.json` declares widgets. Navigation service reads these during menu assembly (same upsert pattern).
2. **Discovery:** Dashboard frontend calls `GET /api/v1/O/:orgId/navigation/dashboard-widgets` — returns all widgets the current user is privileged to see.
3. **Rendering:** Frontend calculates tier based on module count, filters widgets, renders grid.
4. **Data fetch:** Each widget makes a direct API call to its module's endpoint. Responses cached per `refresh_interval`.

---

## 4. Platform-level Widgets

The platform itself (identity, authorization, audit, messaging) also registers widgets:

```
identity:       Tier 1: Total Users, Active Sessions
                Tier 2: New Users (7d), Locked Accounts
                Tier 3: Login Activity Chart

authorization:  Tier 1: Roles, Privileges
                Tier 2: Recent Role Changes

audit:          Tier 1: Events (24h), Alerts
                Tier 2: Top Event Types Chart
                Tier 3: Recent Events Feed

messaging:      Tier 1: Topics Active, Messages (24h)
                Tier 2: DLQ Depth, Consumer Lag
```

These are always present. Module widgets appear alongside them.

---

## 5. Phase Plan

| Phase | What | When |
|-------|------|------|
| **A — Widget Registry** | manifest.json widget declarations + navigation service endpoint + frontend grid renderer | Now |
| **C — Backend Aggregator** | Dashboard service calls module APIs server-side, returns combined JSON in one call. Reduces frontend latency. | When > 5 modules |
| **B — Event-sourced** | Modules emit metric events to Kafka. Dashboard service maintains its own read model. Real-time updates via WebSocket. | When real-time dashboards needed at scale |

---

## 6. API Endpoints

### Navigation Service (new)
```
GET /api/v1/O/:orgId/navigation/dashboard-widgets
    → { modules: [{ moduleId, moduleName, widgets: [...] }] }
```

### Dashboard Frontend Logic
```
GET /dashboard-widgets → get widget list
For each widget:
    GET widget.endpoint → get data
    Render widget.type component
    Schedule refresh per widget.refresh_interval
```

---

*End of architecture document.*

import React from 'react';

// Manifest-declared FE component resolution map.
//
// Every module's manifest nav item declares `feComponent: "PageComponentName"`
// or the cross-module qualified form `"<moduleId>:ComponentName"` (SPEC-
// cross-module-feComponent.md v1.0).
//
// Same pattern as lucideIconByName: tree-shakeable. Adding a new page
// requires a one-line lazy import here; manifests stay string-only.
//
// Convention: the string key matches the exported React component name
// (PascalCase). If two manifest items should render the same component
// with different behaviour, the component reads useLocation() /
// useParams() to self-differentiate — do NOT clone components.
//
// Phase A + Phase B complete:
//   - componentByName accepts "<moduleId>:<ComponentName>" qualified strings.
//   - "@platform:X" looks up in PLATFORM_COMPONENTS.
//   - "<realModule>:X" looks up in MODULE_COMPONENT_REGISTRIES[moduleId][X].
//   - Unqualified names first try PLATFORM_COMPONENTS, then the current
//     module's registry, then a last-ditch global fallback. Local module
//     wins on collision with a console.warn.

/* eslint-disable @typescript-eslint/no-explicit-any */

type ComponentMap = Record<string, React.ComponentType<any>>;

// -----------------------------------------------------------------------------
// @platform — components shipped by unified-console itself.
// -----------------------------------------------------------------------------
//
// These are generic, module-agnostic renderers. Accessible as `@platform:X`
// in a manifest, or unqualified (legacy) falling through to this map.
const PLATFORM_COMPONENTS: ComponentMap = {
  // Platform-supplied "no dedicated screen yet" fallback. Use when a nav item
  // should appear in the sidebar but the UI isn't built.
  PlaceholderPage:           React.lazy(() => import('./PlaceholderPage')),

  // Manifest-v2 composition auto-page (US-MX-2095) — orchestrates
  // form_builder + datatable + doc_generator for any `/m/{slug}/{resource}/
  // {new|list|:id}` route declared in `composition.resources`.
  CompositionRenderer:       React.lazy(() => import('../module-composition/CompositionRenderer')),

  // Manifest-v2 guide auto-pages (US-MX-2094) — rendered from manifest.guide.*
  GuideIntroView:            React.lazy(() => import('../module-guide/IntroView')),
  GuideSlideDeck:            React.lazy(() => import('../module-guide/SlideDeckPlayer')),
  GuideLifecycle:            React.lazy(() => import('../module-guide/LifecycleView')),
  GuideVideos:               React.lazy(() => import('../module-guide/VideoList')),
  GuideDocs:                 React.lazy(() => import('../module-guide/DocsLinkList')),
  GuidePricing:              React.lazy(() => import('../module-guide/PricingTable')),

  // Manifest-v2 deployments auto-page — rendered from manifest.deployments
  DeploymentsView:           React.lazy(() => import('../module-deployments/DeploymentsView')),

  // Manifest-v2 DB auto-page — rendered from manifest.db
  DbOperationsPanel:         React.lazy(() => import('../module-db/DbOperationsPanel')),

  // Dashboard / catch-all landing.
  DashboardPage:             React.lazy(() => import('../../pages/dashboard/DashboardPage')),
};

// -----------------------------------------------------------------------------
// Per-module registries — keyed by moduleId.
// -----------------------------------------------------------------------------
//
// Each entry lists the components "owned" by that module. A cross-module
// reference `"<moduleId>:X"` resolves here. An unqualified reference from a
// nav item whose section.moduleId === <moduleId> ALSO resolves here (local
// lookup path per SPEC-cross-module-feComponent.md §"Runtime behaviour").

// ---- zorbit-cor-identity ----------------------------------------------------
const IDENTITY_COMPONENTS: ComponentMap = {
  UsersPage:                 React.lazy(() => import('../../pages/users/UsersPage')),
  UserDirectoryPage:         React.lazy(() => import('../../pages/users/UserDirectoryPage')),
  OrganizationsPage:         React.lazy(() => import('../../pages/organizations/OrganizationsPage')),
  DepartmentsPage:           React.lazy(() => import('../../pages/organizations/DepartmentsPage')),
  OrgChartPage:              React.lazy(() => import('../../pages/organizations/OrgChartPage')),
};

// ---- zorbit-cor-authorization ----------------------------------------------
const AUTHORIZATION_COMPONENTS: ComponentMap = {
  RolesPage:                 React.lazy(() => import('../../pages/roles/RolesPage')),
  PrivilegesPage:            React.lazy(() => import('../../pages/privileges/PrivilegesPage')),
};

// ---- zorbit-cor-navigation --------------------------------------------------
const NAVIGATION_COMPONENTS: ComponentMap = {
  NavigationAdminPage:       React.lazy(() => import('../../pages/navigation-admin/NavigationAdminPage')),
  RoutesPage:                React.lazy(() => import('../../pages/routes/RoutesPage')),
};

// ---- zorbit-cor-event_bus (messaging) --------------------------------------
const EVENT_BUS_COMPONENTS: ComponentMap = {
  MessagingPage:             React.lazy(() => import('../../pages/messaging/MessagingPage')),
  EventLogPage:              React.lazy(() => import('../../pages/messaging/EventLogPage')),
};

// ---- zorbit-cor-audit ------------------------------------------------------
const AUDIT_COMPONENTS: ComponentMap = {
  AuditPage:                 React.lazy(() => import('../../pages/audit/AuditPage')),
};

// ---- zorbit-cor-pii_vault --------------------------------------------------
const PII_VAULT_COMPONENTS: ComponentMap = {
  PiiVaultPage:              React.lazy(() => import('../../pages/pii-vault/PiiVaultPage')),
  PiiDataTypesPage:          React.lazy(() => import('../../pages/pii-vault/PiiDataTypesPage')),
  PiiTokenRegistryPage:      React.lazy(() => import('../../pages/pii-vault/PiiTokenRegistryPage')),
};

// ---- sample-customer-service ------------------------------------------------
const SAMPLE_CUSTOMER_COMPONENTS: ComponentMap = {
  CustomersPage:             React.lazy(() => import('../../pages/customers/CustomersPage')),
};

// ---- settings / platform admin ambient -------------------------------------
const SETTINGS_COMPONENTS: ComponentMap = {
  SettingsPage:              React.lazy(() => import('../../pages/settings/SettingsPage')),
  SecretsPage:               React.lazy(() => import('../../pages/settings/SecretsPage')),
  SecurityPage:              React.lazy(() => import('../../pages/settings/SecurityPage')),
};

// ---- zorbit-cor-module_registry -------------------------------------------
const MODULE_REGISTRY_COMPONENTS: ComponentMap = {
  ModuleRegistryPage:        React.lazy(() => import('../../pages/admin/ModuleRegistryPage')),
  LicensingPage:             React.lazy(() => import('../../pages/admin/LicensingPage')),
  SitemapPage:               React.lazy(() => import('../../pages/admin/SitemapPage')),
  DeveloperPage:             React.lazy(() => import('../../pages/admin/DeveloperPage')),
  MenuPreviewPage:           React.lazy(() => import('../../pages/admin/MenuPreviewPage')),
};

// ---- zorbit-cor-deployment_registry ----------------------------------------
const DEPLOYMENT_REGISTRY_COMPONENTS: ComponentMap = {
  DeploymentEnvironmentsPage: React.lazy(() => import('../../pages/deployment-registry/DeploymentEnvironmentsPage')),
  DeploymentsModulePage:      React.lazy(() => import('../../pages/deployment-registry/DeploymentsModulePage')),
  DeploymentRequestsPage:     React.lazy(() => import('../../pages/deployment-registry/DeploymentRequestsPage')),
};

// ---- zorbit-pfs-form_builder -----------------------------------------------
//
// FormRenderer is the cross-module exported component — any module can
// reference `zorbit-pfs-form_builder:FormRenderer` from its manifest (see
// SPEC-cross-module-feComponent.md v1.0). It renders a form definition
// fetched from the form-builder BE.
const FORM_BUILDER_COMPONENTS: ComponentMap = {
  FormBuilderPage:           React.lazy(() => import('../../pages/form-builder/FormBuilderPage')),
  FormTemplatesPage:         React.lazy(() => import('../../pages/form-builder/FormTemplatesPage')),
  FormSubmissionsPage:       React.lazy(() => import('../../pages/form-builder/FormSubmissionsPage')),
  FormRenderer:              React.lazy(() => import('./FormRenderer')),
};

// ---- zorbit-pfs-datatable --------------------------------------------------
//
// Cross-module exports (SPEC-cross-module-feComponent.md v1.0 §"Component
// registration contract"). Consumers reference these as
// `zorbit-pfs-datatable:<ComponentName>` from their manifest.
//
// `DataTable` is the headline export — config-driven list/detail surface
// per SPEC-datatable-parameters.md v1.0. The source lives inside the
// unified-console bundle for now (Phase C bundling decision); the
// resolver contract is identical regardless of where the source sits.
const DATATABLE_COMPONENTS: ComponentMap = {
  DataTable:                 React.lazy(() => import('./ConfigurableDataTable')),
  DataTableDemoPage:         React.lazy(() => import('../../pages/data-table-demo/DataTableDemoPage')),
};

// ---- zorbit-app-pcg4 -------------------------------------------------------
const PCG4_COMPONENTS: ComponentMap = {
  PCG4ConfiguratorPage:      React.lazy(() => import('../../pages/pcg4/PCG4ConfiguratorPage')),
};

// ---- zorbit-app-uw_workflow ------------------------------------------------
const UW_WORKFLOW_COMPONENTS: ComponentMap = {
  UWWorkflowPage:            React.lazy(() => import('../../pages/uw-workflow/UWWorkflowPage')),
};

// ---- zorbit-app-hi_quotation -----------------------------------------------
const HI_QUOTATION_COMPONENTS: ComponentMap = {
  HIQuotationPage:           React.lazy(() => import('../../pages/hi-quotation/HIQuotationPage')),
};

// ---- zorbit-app-hi_decisioning ---------------------------------------------
const HI_DECISIONING_COMPONENTS: ComponentMap = {
  HIDecisioningPage:         React.lazy(() => import('../../pages/hi-decisioning/HIDecisioningPage')),
};

// -----------------------------------------------------------------------------
// Assembled module registry map — keyed by moduleId.
// -----------------------------------------------------------------------------
//
// Both the new cor-* slugs and their legacy aliases are registered so
// unqualified local lookups keep working while the manifest-renaming work
// lands in parallel repos.
const MODULE_COMPONENT_REGISTRIES: Record<string, ComponentMap> = {
  // Core (cor-*)
  'zorbit-cor-identity':            IDENTITY_COMPONENTS,
  'zorbit-identity':                IDENTITY_COMPONENTS,
  'zorbit-cor-authorization':       AUTHORIZATION_COMPONENTS,
  'zorbit-authorization':           AUTHORIZATION_COMPONENTS,
  'zorbit-cor-navigation':          NAVIGATION_COMPONENTS,
  'zorbit-navigation':              NAVIGATION_COMPONENTS,
  'zorbit-cor-event_bus':           EVENT_BUS_COMPONENTS,
  'zorbit-event_bus':               EVENT_BUS_COMPONENTS,
  'zorbit-cor-audit':               AUDIT_COMPONENTS,
  'zorbit-audit':                   AUDIT_COMPONENTS,
  'zorbit-cor-pii_vault':           PII_VAULT_COMPONENTS,
  'zorbit-pii-vault':               PII_VAULT_COMPONENTS,
  'zorbit-cor-module_registry':     MODULE_REGISTRY_COMPONENTS,
  'zorbit-cor-deployment_registry': DEPLOYMENT_REGISTRY_COMPONENTS,

  // Settings / platform admin ambient
  'zorbit-cor-settings':            SETTINGS_COMPONENTS,
  'zorbit-settings':                SETTINGS_COMPONENTS,

  // PFS
  'zorbit-pfs-form_builder':        FORM_BUILDER_COMPONENTS,
  'zorbit-pfs-datatable':           DATATABLE_COMPONENTS,

  // Sample business app
  'sample-customer-service':        SAMPLE_CUSTOMER_COMPONENTS,

  // Business apps (zorbit-app-*)
  'zorbit-app-pcg4':                PCG4_COMPONENTS,
  'zorbit-app-uw_workflow':         UW_WORKFLOW_COMPONENTS,
  'zorbit-app-hi_quotation':        HI_QUOTATION_COMPONENTS,
  'zorbit-app-hi_decisioning':      HI_DECISIONING_COMPONENTS,
};

// -----------------------------------------------------------------------------
// Runtime resolver (SPEC §"Runtime behaviour").
// -----------------------------------------------------------------------------

/**
 * Resolve a manifest `feComponent` string to a React component.
 *
 * Syntax supported:
 *  - `@platform:X`            → PLATFORM_COMPONENTS[X]
 *  - `<moduleId>:X`           → MODULE_COMPONENT_REGISTRIES[moduleId][X]
 *  - unqualified `X`          → PLATFORM_COMPONENTS[X] first, then
 *                                MODULE_COMPONENT_REGISTRIES[currentModuleId][X].
 *                                Local-module wins on collision; a console
 *                                warning is emitted because the manifest
 *                                should be fully-qualified (SPEC Phase E).
 *
 * Returns `null` on miss. Callers render a stub/fallback.
 *
 * Backward-compat: the original single-arg form `componentByName(name)`
 * keeps working — `currentModuleId` defaults to `'_unknown'`, which forces
 * a global fallback across every registered module for unqualified names.
 */
export function componentByName(
  name?: string | null,
  currentModuleId: string = '_unknown',
): React.ComponentType<any> | null {
  if (!name) return null;

  // Qualified form: "<moduleId>:<ComponentName>"
  if (name.includes(':')) {
    const idx = name.indexOf(':');
    const modulePart = name.slice(0, idx);
    const componentPart = name.slice(idx + 1);
    if (!modulePart || !componentPart) return null;

    if (modulePart === '@platform') {
      return PLATFORM_COMPONENTS[componentPart] || null;
    }
    const moduleRegistry = MODULE_COMPONENT_REGISTRIES[modulePart];
    return moduleRegistry ? (moduleRegistry[componentPart] || null) : null;
  }

  // Unqualified alias path (SPEC §"Backward-compat aliases").
  // Tie-break rule: local-module wins over platform; warn on ambiguity.
  const platformHit = PLATFORM_COMPONENTS[name];
  const localRegistry =
    currentModuleId && currentModuleId !== '_unknown'
      ? MODULE_COMPONENT_REGISTRIES[currentModuleId]
      : undefined;
  const localHit = localRegistry ? localRegistry[name] : undefined;

  if (localHit && platformHit) {
    // eslint-disable-next-line no-console
    console.warn(
      `[componentRegistry] ambiguous unqualified feComponent "${name}" — ` +
        `matches both @platform and module "${currentModuleId}". ` +
        `Local wins. Fully-qualify the manifest to silence this.`,
    );
    return localHit;
  }
  if (localHit) return localHit;
  if (platformHit) return platformHit;

  // Global fallback — used when currentModuleId is `_unknown` (legacy one-arg
  // callers) OR when the caller's moduleId isn't registered yet. We scan
  // every module registry for a unique hit. Warn so the author fully
  // qualifies.
  for (const [mid, reg] of Object.entries(MODULE_COMPONENT_REGISTRIES)) {
    if (reg[name]) {
      if (currentModuleId === '_unknown') {
        // eslint-disable-next-line no-console
        console.warn(
          `[componentRegistry] unqualified feComponent "${name}" resolved ` +
            `to module "${mid}" via global fallback. Pass currentModuleId ` +
            `or fully-qualify the feComponent string.`,
        );
      }
      return reg[name];
    }
  }

  return null;
}

/**
 * True if `name` resolves to any registered component (platform or any module).
 */
export function isKnownComponent(name: string): boolean {
  if (!name) return false;
  if (name.includes(':')) return componentByName(name) !== null;
  if (Object.prototype.hasOwnProperty.call(PLATFORM_COMPONENTS, name)) return true;
  for (const reg of Object.values(MODULE_COMPONENT_REGISTRIES)) {
    if (Object.prototype.hasOwnProperty.call(reg, name)) return true;
  }
  return false;
}

/**
 * Flat sorted list of every registered component, prefixed with its module
 * scope for disambiguation. Used by Developer tooling / Sitemap.
 */
export function allRegisteredComponentNames(): string[] {
  const names = new Set<string>();
  for (const n of Object.keys(PLATFORM_COMPONENTS)) names.add(`@platform:${n}`);
  for (const [mid, reg] of Object.entries(MODULE_COMPONENT_REGISTRIES)) {
    for (const n of Object.keys(reg)) names.add(`${mid}:${n}`);
  }
  return Array.from(names).sort();
}

/**
 * Inspection helpers — exposed for tests and dev tooling.
 */
export function platformComponentNames(): string[] {
  return Object.keys(PLATFORM_COMPONENTS).sort();
}

export function registeredModuleIds(): string[] {
  return Object.keys(MODULE_COMPONENT_REGISTRIES).sort();
}

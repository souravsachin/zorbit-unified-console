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
// Phase A (SPEC §"Implementation scope — phased"):
//   - componentByName accepts `<moduleId>:<ComponentName>` qualified strings.
//   - `@platform:X` looks up in PLATFORM_COMPONENTS.
//   - `<realModule>:X` looks up in MODULE_COMPONENT_REGISTRIES[moduleId][X].
//   - Unqualified: first try PLATFORM_COMPONENTS, then the current module's
//     registry. Local wins on collision, with a console warning.
//
// Phase B (this file, subsequent commit) splits the flat PageComponents
// map into per-module blocks. In Phase A the map remains flat and
// PLATFORM_COMPONENTS is derived by name-list from it.

/* eslint-disable @typescript-eslint/no-explicit-any */

const PageComponents: Record<string, React.ComponentType<any>> = {
  // Core
  UsersPage:                 React.lazy(() => import('../../pages/users/UsersPage')),
  UserDirectoryPage:         React.lazy(() => import('../../pages/users/UserDirectoryPage')),
  OrganizationsPage:         React.lazy(() => import('../../pages/organizations/OrganizationsPage')),
  DepartmentsPage:           React.lazy(() => import('../../pages/organizations/DepartmentsPage')),
  OrgChartPage:              React.lazy(() => import('../../pages/organizations/OrgChartPage')),
  RolesPage:                 React.lazy(() => import('../../pages/roles/RolesPage')),
  PrivilegesPage:            React.lazy(() => import('../../pages/privileges/PrivilegesPage')),
  CustomersPage:             React.lazy(() => import('../../pages/customers/CustomersPage')),
  AuditPage:                 React.lazy(() => import('../../pages/audit/AuditPage')),
  MessagingPage:             React.lazy(() => import('../../pages/messaging/MessagingPage')),
  EventLogPage:              React.lazy(() => import('../../pages/messaging/EventLogPage')),
  NavigationAdminPage:       React.lazy(() => import('../../pages/navigation-admin/NavigationAdminPage')),
  RoutesPage:                React.lazy(() => import('../../pages/routes/RoutesPage')),
  PiiVaultPage:              React.lazy(() => import('../../pages/pii-vault/PiiVaultPage')),
  PiiDataTypesPage:          React.lazy(() => import('../../pages/pii-vault/PiiDataTypesPage')),
  PiiTokenRegistryPage:      React.lazy(() => import('../../pages/pii-vault/PiiTokenRegistryPage')),
  SettingsPage:              React.lazy(() => import('../../pages/settings/SettingsPage')),
  SecretsPage:               React.lazy(() => import('../../pages/settings/SecretsPage')),
  SecurityPage:              React.lazy(() => import('../../pages/settings/SecurityPage')),

  // Module registry / admin
  ModuleRegistryPage:        React.lazy(() => import('../../pages/admin/ModuleRegistryPage')),

  // Deployment Registry (US-DR-2200 — Phase 2)
  DeploymentEnvironmentsPage: React.lazy(() => import('../../pages/deployment-registry/DeploymentEnvironmentsPage')),

  // Deployment Registry (Phase 3) — maker-side wizard + DR list
  DeploymentsModulePage:     React.lazy(() => import('../../pages/deployment-registry/DeploymentsModulePage')),
  DeploymentRequestsPage:    React.lazy(() => import('../../pages/deployment-registry/DeploymentRequestsPage')),
  LicensingPage:             React.lazy(() => import('../../pages/admin/LicensingPage')),
  SitemapPage:               React.lazy(() => import('../../pages/admin/SitemapPage')),
  DeveloperPage:             React.lazy(() => import('../../pages/admin/DeveloperPage')),
  MenuPreviewPage:           React.lazy(() => import('../../pages/admin/MenuPreviewPage')),

  // PFS
  FormBuilderPage:           React.lazy(() => import('../../pages/form-builder/FormBuilderPage')),
  FormTemplatesPage:         React.lazy(() => import('../../pages/form-builder/FormTemplatesPage')),
  FormSubmissionsPage:       React.lazy(() => import('../../pages/form-builder/FormSubmissionsPage')),
  DataTableDemoPage:         React.lazy(() => import('../../pages/data-table-demo/DataTableDemoPage')),

  // Business
  PCG4ConfiguratorPage:      React.lazy(() => import('../../pages/pcg4/PCG4ConfiguratorPage')),
  UWWorkflowPage:            React.lazy(() => import('../../pages/uw-workflow/UWWorkflowPage')),
  HIQuotationPage:           React.lazy(() => import('../../pages/hi-quotation/HIQuotationPage')),
  HIDecisioningPage:         React.lazy(() => import('../../pages/hi-decisioning/HIDecisioningPage')),

  // Dashboard / catch-all
  DashboardPage:             React.lazy(() => import('../../pages/dashboard/DashboardPage')),

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

  // Platform-supplied "no dedicated screen yet" fallback.
  // Use when a nav item should appear in the sidebar but the UI isn't built.
  // Shows a friendly explanation + "report missing page" action.
  PlaceholderPage:           React.lazy(() => import('./PlaceholderPage')),

  // Manifest-v2 composition auto-page (US-MX-2095) — orchestrates form_builder + datatable + doc_generator
  // for any `/m/{slug}/{resource}/{new|list|:id}` route declared in `composition.resources`.
  CompositionRenderer:       React.lazy(() => import('../module-composition/CompositionRenderer')),
};

// -----------------------------------------------------------------------------
// Phase A — @platform namespace derivation.
// -----------------------------------------------------------------------------
//
// In Phase B we will split PageComponents into proper per-module registries.
// For Phase A we keep the existing flat map and carve out the subset of names
// that belong to the `@platform` namespace (module-agnostic, unified-console-
// shipped components) so that `@platform:X` references resolve correctly.
const PLATFORM_COMPONENT_NAMES = new Set<string>([
  'PlaceholderPage',
  'CompositionRenderer',
  'GuideIntroView',
  'GuideSlideDeck',
  'GuideLifecycle',
  'GuideVideos',
  'GuideDocs',
  'GuidePricing',
  'DeploymentsView',
  'DbOperationsPanel',
  'DashboardPage',
]);

const PLATFORM_COMPONENTS: Record<string, React.ComponentType<any>> = {};
for (const name of PLATFORM_COMPONENT_NAMES) {
  const c = PageComponents[name];
  if (c) PLATFORM_COMPONENTS[name] = c;
}

// Phase-A stub — module-keyed registries land fully in Phase B. For now the
// flat PageComponents map acts as the implicit single registry for every
// module (anything resolves by name). This mirrors legacy behaviour.
const MODULE_COMPONENT_REGISTRIES: Record<string, Record<string, React.ComponentType<any>>> = {};

/**
 * Resolve a manifest `feComponent` string to a React component.
 *
 * Syntax supported (SPEC-cross-module-feComponent.md §"Syntax"):
 *  - `@platform:X`            → PLATFORM_COMPONENTS[X]
 *  - `<moduleId>:X`           → MODULE_COMPONENT_REGISTRIES[moduleId][X]
 *  - unqualified `X`          → PLATFORM_COMPONENTS[X] first, then
 *                                MODULE_COMPONENT_REGISTRIES[currentModuleId][X],
 *                                then a final fallback to the flat legacy map.
 *
 * On a collision between an unqualified name that lives in both the local
 * module registry AND PLATFORM_COMPONENTS, local wins per SPEC §"Runtime
 * behaviour", and a one-line console.warn is emitted so the manifest author
 * knows to fully-qualify.
 *
 * Backward-compat: the original single-arg form `componentByName(name)` keeps
 * working — `currentModuleId` defaults to `'_unknown'`.
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
    if (moduleRegistry && moduleRegistry[componentPart]) {
      return moduleRegistry[componentPart];
    }
    // Phase-A fallthrough — in Phase B every moduleId has its own registry
    // block. Until then, accept the component from the flat legacy map if
    // the moduleId matches a known registry key, otherwise null.
    return null;
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

  // Final fallback — flat legacy map. Preserves every existing manifest's
  // behaviour. Removed in Phase E once all manifests are fully-qualified.
  return PageComponents[name] || null;
}

export function isKnownComponent(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PageComponents, name);
}

export function allRegisteredComponentNames(): string[] {
  return Object.keys(PageComponents).sort();
}

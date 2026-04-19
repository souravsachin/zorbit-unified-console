import React from 'react';

// Manifest-declared FE component resolution map.
//
// Every module's manifest nav item declares `feComponent: "PageComponentName"`.
// This map resolves that string to the actual React component.
//
// Same pattern as lucideIconByName: tree-shakeable. Adding a new page
// requires a one-line lazy import here; manifests stay string-only.
//
// Convention: the string key matches the exported React component name
// (PascalCase). If two manifest items should render the same component
// with different behaviour, the component reads useLocation() /
// useParams() to self-differentiate — do NOT clone components.

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
};

export function componentByName(name?: string | null): React.ComponentType<any> | null {
  if (!name) return null;
  return PageComponents[name] || null;
}

export function isKnownComponent(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PageComponents, name);
}

export function allRegisteredComponentNames(): string[] {
  return Object.keys(PageComponents).sort();
}

import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ToastProvider } from './components/shared/Toast';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';

/**
 * Wrapper around React.lazy that retries chunk loads on failure.
 * Handles stale chunk hashes after deploys (browser has old index cached).
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((err) => {
      if (retries > 0) {
        console.warn(`[Zorbit] Chunk load failed, retrying (${retries} left)...`, err?.message);
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(lazyWithRetry(factory, retries - 1) as any), 500),
        );
      }
      // Final failure — force reload to get fresh chunks
      console.error('[Zorbit] Chunk load failed after retries, reloading page', err);
      window.location.reload();
      // Return a never-resolving promise so reload takes effect
      return new Promise<{ default: T }>(() => {});
    }),
  );
}

const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage'));
const ForceChangePasswordPage = lazyWithRetry(() => import('./pages/auth/ForceChangePasswordPage'));
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import OrganizationsPage from './pages/organizations/OrganizationsPage';
const DepartmentsPage = lazyWithRetry(() => import('./pages/organizations/DepartmentsPage'));
const OrgChartPage = lazyWithRetry(() => import('./pages/organizations/OrgChartPage'));
const UserDirectoryPage = lazyWithRetry(() => import('./pages/users/UserDirectoryPage'));
import RolesPage from './pages/roles/RolesPage';
import PrivilegesPage from './pages/privileges/PrivilegesPage';
import CustomersPage from './pages/customers/CustomersPage';
import AuditPage from './pages/audit/AuditPage';
import MessagingPage from './pages/messaging/MessagingPage';
import EventLogPage from './pages/messaging/EventLogPage';
import NavigationAdminPage from './pages/navigation-admin/NavigationAdminPage';
import RoutesPage from './pages/routes/RoutesPage';
import PiiVaultPage from './pages/pii-vault/PiiVaultPage';
import ApiDocsPage from './pages/api-docs/ApiDocsPage';
import SettingsPage from './pages/settings/SettingsPage';
import SecretsPage from './pages/settings/SecretsPage';
const SecurityPage = lazyWithRetry(() => import('./pages/settings/SecurityPage'));
import DemoPage from './pages/demo/DemoPage';
import DemoTrainingCenter from './pages/DemoTrainingCenter/DemoTrainingCenter';
import DemoSegmentEditor from './pages/DemoSegmentEditor/DemoSegmentEditor';
const DevCenterPage = lazyWithRetry(() => import('./pages/dev-center/DevCenterPage'));
const DevCenterGuidePage = lazyWithRetry(() => import('./pages/dev-center/DevCenterGuidePage'));
const TutorialsPage = lazyWithRetry(() => import('./pages/dev-center/TutorialsPage'));
const ZmbGuidePage = lazyWithRetry(() => import('./pages/dev-center/ZmbGuidePage'));
const ArchitecturePage = lazyWithRetry(() => import('./pages/dev-center/ArchitecturePage'));
import DashboardViewPage from './pages/DashboardView/DashboardViewPage';
import DashboardDesignerPage from './pages/DashboardDesigner/DashboardDesignerPage';
import DataTableDemoPage from './pages/data-table-demo/DataTableDemoPage';
import StepperDemoPage from './pages/stepper-demo/StepperDemoPage';
import TreePickerDemoPage from './pages/tree-picker-demo/TreePickerDemoPage';
import NotFoundPage from './pages/NotFoundPage';

const PCG4DashboardPage = lazyWithRetry(() => import('./pages/pcg4/PCG4DashboardPage'));
const PCG4ConfiguratorPage = lazyWithRetry(() => import('./pages/pcg4/PCG4ConfiguratorPage'));
const PCG4AdminPage = lazyWithRetry(() => import('./pages/pcg4/PCG4AdminPage'));
const PCG4SetupPage = lazyWithRetry(() => import('./pages/pcg4/PCG4SetupPage'));
const PCG4OverviewPage = lazyWithRetry(() => import('./pages/pcg4/PCG4OverviewPage'));
const PCG4ReferenceLibraryPage = lazyWithRetry(() => import('./pages/pcg4/PCG4ReferenceLibraryPage'));
const PCG4CoverageMapperPage = lazyWithRetry(() => import('./pages/pcg4/PCG4CoverageMapperPage'));
const PCG4DeploymentsPage = lazyWithRetry(() => import('./pages/pcg4/PCG4DeploymentsPage'));
const PCG4PricingPage = lazyWithRetry(() => import('./pages/pcg4/PCG4PricingPage'));
const PCG4ConfiguratorFBPage = lazyWithRetry(() => import('./pages/pcg4/PCG4ConfiguratorFBPage'));
// PCG4HelpPage removed — Video Tutorials tab in PCG4 Hub replaces it
const PIIShowcasePage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcasePage'));
const PIIDashboardPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIDashboardPage'));
const PIIUploadPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIUploadPage'));
const PIIConfigPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIConfigPage'));
const DirectoryPage = lazyWithRetry(() => import('./pages/directory/DirectoryPage'));
const SupportCenterPage = lazyWithRetry(() => import('./pages/support-center/SupportCenterPage'));
const FormTemplatesPage = lazyWithRetry(() => import('./pages/form-builder/FormTemplatesPage'));
const FormCreatePage = lazyWithRetry(() => import('./pages/form-builder/FormCreatePage'));
const FormSubmissionsPage = lazyWithRetry(() => import('./pages/form-builder/FormSubmissionsPage'));
const FormEditorPage = lazyWithRetry(() => import('./pages/form-builder/FormEditorPage'));
const FormBuilderHelpPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderHelpPage'));
const FormBuilderOverviewPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderOverviewPage'));
const FormRenderPage = lazyWithRetry(() => import('./pages/form-builder/FormRenderPage'));
const ModuleRegistryPage = lazyWithRetry(() => import('./pages/admin/ModuleRegistryPage'));
const LicensingPage = lazyWithRetry(() => import('./pages/admin/LicensingPage'));
const SitemapPage = lazyWithRetry(() => import('./pages/admin/SitemapPage'));
const DeveloperPage = lazyWithRetry(() => import('./pages/admin/DeveloperPage'));
const MenuPreviewPage = lazyWithRetry(() => import('./pages/admin/MenuPreviewPage'));
const UWWorkflowPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowPage'));
const HIDecisioningPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningPage'));
const HIQuotationPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationPage'));
const MIQuotationPage = lazyWithRetry(() => import('./pages/mi-quotation/MIQuotationPage'));
const NewHIApplicationPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationPage'));
const RegionSelectorPage = lazyWithRetry(() => import('./pages/hi-quotation/RegionSelectorPage'));
const NewApplicationIndiaPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationIndiaPage'));
const NewApplicationUAEPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationUAEPage'));
const NewApplicationUSPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationUSPage'));
const GenericApplicationPage = lazyWithRetry(() => import('./pages/hi-quotation/GenericApplicationPage'));
const HIQuotationHelpPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationHelpPage'));
const UWWorkflowHelpPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowHelpPage'));
const HIDecisioningHelpPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningHelpPage'));
const MIQuotationHelpPage = lazyWithRetry(() => import('./pages/mi-quotation/MIQuotationHelpPage'));
const VerificationHelpPage = lazyWithRetry(() => import('./pages/verification/VerificationHelpPage'));
const PaymentGatewayPage = lazyWithRetry(() => import('./pages/payments/PaymentGatewayPage'));

// Module Setup Pages (reusable ModuleSetupPage wrappers)
const IdentitySetupPage = lazyWithRetry(() => import('./pages/identity/IdentitySetupPage'));
const IdentityDeploymentsPage = lazyWithRetry(() => import('./pages/identity/IdentityDeploymentsPage'));
const AuthorizationSetupPage = lazyWithRetry(() => import('./pages/authorization/AuthorizationSetupPage'));
const AuthorizationDeploymentsPage = lazyWithRetry(() => import('./pages/authorization/AuthorizationDeploymentsPage'));
const NavigationSetupPage = lazyWithRetry(() => import('./pages/navigation-admin/NavigationSetupPage'));
const NavigationDeploymentsPage = lazyWithRetry(() => import('./pages/navigation-admin/NavigationDeploymentsPage'));
const MessagingSetupPage = lazyWithRetry(() => import('./pages/messaging/MessagingSetupPage'));
const MessagingDeploymentsPage = lazyWithRetry(() => import('./pages/messaging/MessagingDeploymentsPage'));
const AuditSetupPage = lazyWithRetry(() => import('./pages/audit/AuditSetupPage'));
const AuditDeploymentsPage = lazyWithRetry(() => import('./pages/audit/AuditDeploymentsPage'));
const PiiVaultSetupPage = lazyWithRetry(() => import('./pages/pii-vault/PiiVaultSetupPage'));
const PiiVaultDeploymentsPage = lazyWithRetry(() => import('./pages/pii-vault/PiiVaultDeploymentsPage'));
const FormBuilderSetupPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderSetupPage'));
const FormBuilderDeploymentsPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderDeploymentsPage'));
const DashboardSetupPage = lazyWithRetry(() => import('./pages/dashboard/DashboardSetupPage'));
const DashboardDeploymentsPage = lazyWithRetry(() => import('./pages/dashboard/DashboardDeploymentsPage'));
const HIQuotationSetupPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationSetupPage'));
const HIQuotationDeploymentsPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationDeploymentsPage'));
const UWWorkflowSetupPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowSetupPage'));
const UWWorkflowDeploymentsPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowDeploymentsPage'));
const HIDecisioningSetupPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningSetupPage'));
const HIDecisioningDeploymentsPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningDeploymentsPage'));
const MIQuotationSetupPage = lazyWithRetry(() => import('./pages/mi-quotation/MIQuotationSetupPage'));
const MIQuotationDeploymentsPage = lazyWithRetry(() => import('./pages/mi-quotation/MIQuotationDeploymentsPage'));
const FeeManagementSetupPage = lazyWithRetry(() => import('./pages/fee-management/FeeManagementSetupPage'));
const FeeManagementDeploymentsPage = lazyWithRetry(() => import('./pages/fee-management/FeeManagementDeploymentsPage'));
const ClaimsSetupPage = lazyWithRetry(() => import('./pages/claims/ClaimsSetupPage'));
const ClaimsDeploymentsPage = lazyWithRetry(() => import('./pages/claims/ClaimsDeploymentsPage'));
const AdminSetupPage = lazyWithRetry(() => import('./pages/admin/AdminSetupPage'));
const AdminDeploymentsPage = lazyWithRetry(() => import('./pages/admin/AdminDeploymentsPage'));

// MUW-52 Ported Modules — Setup & Deployments
const EndorsementsSetupPage = lazyWithRetry(() => import('./pages/endorsements/EndorsementsSetupPage'));
const EndorsementsDeploymentsPage = lazyWithRetry(() => import('./pages/endorsements/EndorsementsDeploymentsPage'));
const RenewalsSetupPage = lazyWithRetry(() => import('./pages/renewals/RenewalsSetupPage'));
const RenewalsDeploymentsPage = lazyWithRetry(() => import('./pages/renewals/RenewalsDeploymentsPage'));
const SMECorporateSetupPage = lazyWithRetry(() => import('./pages/sme-corporate/SMECorporateSetupPage'));
const SMECorporateDeploymentsPage = lazyWithRetry(() => import('./pages/sme-corporate/SMECorporateDeploymentsPage'));
const ReinsuranceSetupPage = lazyWithRetry(() => import('./pages/reinsurance/ReinsuranceSetupPage'));
const ReinsuranceDeploymentsPage = lazyWithRetry(() => import('./pages/reinsurance/ReinsuranceDeploymentsPage'));
const ClaimsTPASetupPage = lazyWithRetry(() => import('./pages/claims-tpa/ClaimsTPASetupPage'));
const ClaimsTPADeploymentsPage = lazyWithRetry(() => import('./pages/claims-tpa/ClaimsTPADeploymentsPage'));
const MedicalCodingSetupPage = lazyWithRetry(() => import('./pages/medical-coding/MedicalCodingSetupPage'));
const MedicalCodingDeploymentsPage = lazyWithRetry(() => import('./pages/medical-coding/MedicalCodingDeploymentsPage'));
const MAFEngineSetupPage = lazyWithRetry(() => import('./pages/maf-engine/MAFEngineSetupPage'));
const MAFEngineDeploymentsPage = lazyWithRetry(() => import('./pages/maf-engine/MAFEngineDeploymentsPage'));
const RPAIntegrationSetupPage = lazyWithRetry(() => import('./pages/rpa-integration/RPAIntegrationSetupPage'));
const RPAIntegrationDeploymentsPage = lazyWithRetry(() => import('./pages/rpa-integration/RPAIntegrationDeploymentsPage'));
const APIIntegrationSetupPage = lazyWithRetry(() => import('./pages/api-integration/APIIntegrationSetupPage'));
const APIIntegrationDeploymentsPage = lazyWithRetry(() => import('./pages/api-integration/APIIntegrationDeploymentsPage'));
const ReportingSetupPage = lazyWithRetry(() => import('./pages/reporting/ReportingSetupPage'));
const ReportingDeploymentsPage = lazyWithRetry(() => import('./pages/reporting/ReportingDeploymentsPage'));
const PolicyIssuanceSetupPage = lazyWithRetry(() => import('./pages/policy-issuance/PolicyIssuanceSetupPage'));
const PolicyIssuanceDeploymentsPage = lazyWithRetry(() => import('./pages/policy-issuance/PolicyIssuanceDeploymentsPage'));
const DocumentManagementSetupPage = lazyWithRetry(() => import('./pages/document-management/DocumentManagementSetupPage'));
const DocumentManagementDeploymentsPage = lazyWithRetry(() => import('./pages/document-management/DocumentManagementDeploymentsPage'));

// Module Hub Pages — Platform Core
const IdentityHubPage = lazyWithRetry(() => import('./pages/identity/IdentityHubPage'));
const AuthorizationHubPage = lazyWithRetry(() => import('./pages/authorization/AuthorizationHubPage'));
const NavigationHubPage = lazyWithRetry(() => import('./pages/navigation-admin/NavigationHubPage'));
const MessagingHubPage = lazyWithRetry(() => import('./pages/messaging/MessagingHubPage'));
const AuditHubPage = lazyWithRetry(() => import('./pages/audit/AuditHubPage'));
const PIIVaultHubPage = lazyWithRetry(() => import('./pages/pii-vault/PIIVaultHubPage'));
const DashboardHubPage = lazyWithRetry(() => import('./pages/dashboard/DashboardHubPage'));

// Module Hub Pages — Business & Feature Services
const PCG4HubPage = lazyWithRetry(() => import('./pages/pcg4/PCG4HubPage'));
const HIQuotationHubPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationHubPage'));
const MIQuotationHubPage = lazyWithRetry(() => import('./pages/mi-quotation/MIQuotationHubPage'));
const UWWorkflowHubPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowHubPage'));
const HIDecisioningHubPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningHubPage'));
const FeeManagementHubPage = lazyWithRetry(() => import('./pages/fee-management/FeeManagementHubPage'));
const ClaimsHubPage = lazyWithRetry(() => import('./pages/claims/ClaimsHubPage'));
const ProductPricingHubPage = lazyWithRetry(() => import('./pages/product-pricing/ProductPricingHubPage'));
const RateTablesPage = lazyWithRetry(() => import('./pages/product-pricing/RateTablesPage'));
const RateCardImportPage = lazyWithRetry(() => import('./pages/product-pricing/RateCardImportPage'));
const ProductPricingSetupPage = lazyWithRetry(() => import('./pages/product-pricing/ProductPricingSetupPage'));
const ProductPricingDeploymentsPage = lazyWithRetry(() => import('./pages/product-pricing/ProductPricingDeploymentsPage'));
const FormBuilderHubPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderHubPage'));
const FormBuilderPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderPage'));
const FormBuilderDetailPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderDetailPage'));
const FormBuilderTokensPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderTokensPage'));

// MUW-52 Ported Module Hub Pages
const EndorsementsHubPage = lazyWithRetry(() => import('./pages/endorsements/EndorsementsHubPage'));
const RenewalsHubPage = lazyWithRetry(() => import('./pages/renewals/RenewalsHubPage'));
const SMECorporateHubPage = lazyWithRetry(() => import('./pages/sme-corporate/SMECorporateHubPage'));
const ReinsuranceHubPage = lazyWithRetry(() => import('./pages/reinsurance/ReinsuranceHubPage'));
const ClaimsTPAHubPage = lazyWithRetry(() => import('./pages/claims-tpa/ClaimsTPAHubPage'));
const MedicalCodingHubPage = lazyWithRetry(() => import('./pages/medical-coding/MedicalCodingHubPage'));
const MAFEngineHubPage = lazyWithRetry(() => import('./pages/maf-engine/MAFEngineHubPage'));
const RPAIntegrationHubPage = lazyWithRetry(() => import('./pages/rpa-integration/RPAIntegrationHubPage'));
const APIIntegrationHubPage = lazyWithRetry(() => import('./pages/api-integration/APIIntegrationHubPage'));
const ReportingHubPage = lazyWithRetry(() => import('./pages/reporting/ReportingHubPage'));
const PolicyIssuanceHubPage = lazyWithRetry(() => import('./pages/policy-issuance/PolicyIssuanceHubPage'));
const DocumentManagementHubPage = lazyWithRetry(() => import('./pages/document-management/DocumentManagementHubPage'));

// PII Showcase — Hub, Setup, Deployments
const PIIShowcaseHubPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcaseHubPage'));
const PIIShowcaseSetupPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcaseSetupPage'));
const PIIShowcaseDeploymentsPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcaseDeploymentsPage'));

// Directory — Hub, Setup, Deployments
const DirectoryHubPage = lazyWithRetry(() => import('./pages/directory/DirectoryHubPage'));
const DirectorySetupPage = lazyWithRetry(() => import('./pages/directory/DirectorySetupPage'));
const DirectoryDeploymentsPage = lazyWithRetry(() => import('./pages/directory/DirectoryDeploymentsPage'));

// Support Center — Hub, Setup, Deployments
const SupportCenterHubPage = lazyWithRetry(() => import('./pages/support-center/SupportCenterHubPage'));
const SupportCenterSetupPage = lazyWithRetry(() => import('./pages/support-center/SupportCenterSetupPage'));
const SupportCenterDeploymentsPage = lazyWithRetry(() => import('./pages/support-center/SupportCenterDeploymentsPage'));

// Voice Engine — Hub, Setup, Deployments, Demo
const VoiceEngineHubPage = lazyWithRetry(() => import('./pages/voice-engine/VoiceEngineHubPage'));
const VoiceEngineSetupPage = lazyWithRetry(() => import('./pages/voice-engine/VoiceEngineSetupPage'));
const VoiceEngineDeploymentsPage = lazyWithRetry(() => import('./pages/voice-engine/VoiceEngineDeploymentsPage'));
const VoiceEngineDemoPage = lazyWithRetry(() => import('./pages/voice-engine/VoiceEngineDemoPage'));

// Jayna AI Calling — Hub, Agents, Workflows, Calls, Test Call, Setup, Deployments
const JaynaHubPage = lazyWithRetry(() => import('./pages/jayna/JaynaHubPage'));
const JaynaAgentsPage = lazyWithRetry(() => import('./pages/jayna/JaynaAgentsPage'));
const JaynaAgentCreatePage = lazyWithRetry(() => import('./pages/jayna/JaynaAgentCreatePage'));
const JaynaAgentDetailPage = lazyWithRetry(() => import('./pages/jayna/JaynaAgentDetailPage'));
const JaynaAgentEditPage = lazyWithRetry(() => import('./pages/jayna/JaynaAgentEditPage'));
const JaynaWorkflowsPage = lazyWithRetry(() => import('./pages/jayna/JaynaWorkflowsPage'));
const JaynaWorkflowCreatePage = lazyWithRetry(() => import('./pages/jayna/JaynaWorkflowCreatePage'));
const JaynaWorkflowDetailPage = lazyWithRetry(() => import('./pages/jayna/JaynaWorkflowDetailPage'));
const JaynaCallHistoryPage = lazyWithRetry(() => import('./pages/jayna/JaynaCallHistoryPage'));
const JaynaTestCallPage = lazyWithRetry(() => import('./pages/jayna/JaynaTestCallPage'));
const JaynaSetupPage = lazyWithRetry(() => import('./pages/jayna/JaynaSetupPage'));
const JaynaDeploymentsPage = lazyWithRetry(() => import('./pages/jayna/JaynaDeploymentsPage'));

// Workflow Engine (FQP) — Hub, Filters, Queues, Pipelines, Setup, Deployments
const WorkflowEngineHubPage = lazyWithRetry(() => import('./pages/workflow-engine/WorkflowEngineHubPage'));
const WorkflowFiltersPage = lazyWithRetry(() => import('./pages/workflow-engine/WorkflowFiltersPage'));
const WorkflowQueuesPage = lazyWithRetry(() => import('./pages/workflow-engine/WorkflowQueuesPage'));
const WorkflowPipelinesPage = lazyWithRetry(() => import('./pages/workflow-engine/WorkflowPipelinesPage'));
const WorkflowSetupPage = lazyWithRetry(() => import('./pages/workflow-engine/WorkflowSetupPage'));
const WorkflowDeploymentsPage = lazyWithRetry(() => import('./pages/workflow-engine/WorkflowDeploymentsPage'));

// Secrets Vault — Hub, List, Create, Audit, Setup, Deployments
const SecretsHubPage = lazyWithRetry(() => import('./pages/secrets/SecretsHubPage'));
const SecretsListPage = lazyWithRetry(() => import('./pages/secrets/SecretsListPage'));
const SecretsCreatePage = lazyWithRetry(() => import('./pages/secrets/SecretsCreatePage'));
const SecretsAuditPage = lazyWithRetry(() => import('./pages/secrets/SecretsAuditPage'));
const SecretsSetupPage = lazyWithRetry(() => import('./pages/secrets/SecretsSetupPage'));
const SecretsDeploymentsPage = lazyWithRetry(() => import('./pages/secrets/SecretsDeploymentsPage'));

// Broker Dashboard & Channel Analytics
const BrokerDashboardPage = lazyWithRetry(() => import('./pages/broker/BrokerDashboardPage'));
const ChannelAnalyticsPage = lazyWithRetry(() => import('./pages/analytics/ChannelAnalyticsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('zorbit_token');
  if (!token) {
    // Preserve the intended URL so login can redirect back
    const intended = window.location.pathname + window.location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(intended)}`} replace />;
  }
  return <>{children}</>;
}

/** Redirect helper that preserves URL params */
function PCG4ConfigRedirect() {
  const { configId } = useParams<{ configId: string }>();
  return <Navigate to={`/app/pcg4/configurations/${configId}`} replace />;
}

const SuspenseFallback = (
  <div className="flex items-center justify-center h-64">
    <span className="text-gray-400">Loading...</span>
  </div>
);

/** Wraps lazy-loaded pages in ErrorBoundary + Suspense */
function SafeLazy({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={SuspenseFallback}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}

/**
 * Shared page routes — mounted at /, /O/:orgId/, and (legacy) /org/:orgId/.
 * The navigation service returns namespace-prefixed routes (e.g. /O/O-OZPY/users)
 * following the Zorbit REST API grammar (/api/v1/O/:orgId/...).
 * Legacy /org/... routes redirect to /O/... for backward compatibility.
 * The org context comes from the JWT, not the URL.
 */
function PageRoutes() {
  return (
    <>
      <Route index element={<DashboardPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="dashboard/designer" element={<DashboardDesignerPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="user-directory" element={<SafeLazy><UserDirectoryPage /></SafeLazy>} />
      <Route path="organizations" element={<OrganizationsPage />} />
      <Route path="organizations/:orgId/departments" element={<SafeLazy><DepartmentsPage /></SafeLazy>} />
      <Route path="organizations/:orgId/org-chart" element={<SafeLazy><OrgChartPage /></SafeLazy>} />
      <Route path="roles" element={<RolesPage />} />
      <Route path="privileges" element={<PrivilegesPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="audit" element={<AuditPage />} />
      <Route path="audit/logs" element={<AuditPage />} />
      <Route path="messaging" element={<MessagingPage />} />
      <Route path="messaging/topics" element={<MessagingPage />} />
      <Route path="messaging/events" element={<EventLogPage />} />
      <Route path="navigation/menus" element={<NavigationAdminPage />} />
      <Route path="navigation/routes" element={<RoutesPage />} />
      <Route path="navigation" element={<NavigationAdminPage />} />
      <Route path="pii-vault" element={<PiiVaultPage />} />
      <Route path="pii-vault/tokens" element={<PiiVaultPage />} />
      <Route path="api-docs" element={<ApiDocsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="settings/general" element={<SettingsPage />} />
      <Route path="settings/secrets" element={<SecretsPage />} />
      <Route path="settings/security" element={<SafeLazy><SecurityPage /></SafeLazy>} />
      <Route path="admin/platform" element={<DashboardPage />} />
      <Route path="admin/guide/*" element={<DashboardPage />} />
      <Route path="admin/licensing" element={<SafeLazy><LicensingPage /></SafeLazy>} />
      <Route path="settings/guide/*" element={<SettingsPage />} />

      {/* Platform Core — Guide (renamed from Overview) & Hub Pages */}
      <Route path="identity/guide/*" element={<SafeLazy><IdentityHubPage /></SafeLazy>} />
      <Route path="identity/hub" element={<SafeLazy><IdentityHubPage /></SafeLazy>} />
      <Route path="identity/overview" element={<Navigate to="identity/guide" replace />} />
      <Route path="authorization/guide/*" element={<SafeLazy><AuthorizationHubPage /></SafeLazy>} />
      <Route path="authorization/hub" element={<SafeLazy><AuthorizationHubPage /></SafeLazy>} />
      <Route path="authorization/overview" element={<Navigate to="authorization/guide" replace />} />
      <Route path="navigation/guide/*" element={<SafeLazy><NavigationHubPage /></SafeLazy>} />
      <Route path="navigation/hub" element={<SafeLazy><NavigationHubPage /></SafeLazy>} />
      <Route path="navigation/overview" element={<Navigate to="navigation/guide" replace />} />
      <Route path="messaging/guide/*" element={<SafeLazy><MessagingHubPage /></SafeLazy>} />
      <Route path="messaging/hub" element={<SafeLazy><MessagingHubPage /></SafeLazy>} />
      <Route path="messaging/overview" element={<Navigate to="messaging/guide" replace />} />
      <Route path="audit/guide/*" element={<SafeLazy><AuditHubPage /></SafeLazy>} />
      <Route path="audit/hub" element={<SafeLazy><AuditHubPage /></SafeLazy>} />
      <Route path="audit/overview" element={<Navigate to="audit/guide" replace />} />
      <Route path="pii-vault/guide/*" element={<SafeLazy><PIIVaultHubPage /></SafeLazy>} />
      <Route path="pii-vault/hub" element={<SafeLazy><PIIVaultHubPage /></SafeLazy>} />
      <Route path="pii-vault/overview" element={<Navigate to="pii-vault/guide" replace />} />
      <Route path="dashboard/guide/*" element={<SafeLazy><DashboardHubPage /></SafeLazy>} />
      <Route path="dashboard/hub" element={<SafeLazy><DashboardHubPage /></SafeLazy>} />
      <Route path="dashboard/overview" element={<Navigate to="dashboard/guide" replace />} />

      {/* PII Showcase (own section + microservice via pii-vault) */}
      <Route path="pii-showcase" element={<SafeLazy><PIIShowcasePage /></SafeLazy>} />
      <Route path="pii-showcase/guide/*" element={<SafeLazy><PIIShowcaseHubPage /></SafeLazy>} />
      <Route path="pii-showcase/hub" element={<SafeLazy><PIIShowcaseHubPage /></SafeLazy>} />
      <Route path="pii-showcase/dashboard" element={<SafeLazy><PIIDashboardPage /></SafeLazy>} />
      <Route path="pii-showcase/upload" element={<SafeLazy><PIIUploadPage /></SafeLazy>} />
      <Route path="pii-showcase/config" element={<SafeLazy><PIIConfigPage /></SafeLazy>} />
      <Route path="pii-showcase/setup" element={<SafeLazy><PIIShowcaseSetupPage /></SafeLazy>} />
      <Route path="pii-showcase/deployments" element={<SafeLazy><PIIShowcaseDeploymentsPage /></SafeLazy>} />

      {/* PCG4 routes — new /app/pcg4/* convention with lazy loading */}
      <Route path="app/pcg4/hub" element={<SafeLazy><PCG4HubPage /></SafeLazy>} />
      <Route path="app/pcg4/guide/*" element={<SafeLazy><PCG4HubPage /></SafeLazy>} />
      <Route path="app/pcg4/overview" element={<Navigate to="/app/pcg4/guide" replace />} />
      <Route path="app/pcg4/configurations" element={<SafeLazy><PCG4DashboardPage /></SafeLazy>} />
      <Route path="app/pcg4/configurations/new" element={<SafeLazy><PCG4ConfiguratorPage /></SafeLazy>} />
      <Route path="app/pcg4/configurations/:configId" element={<SafeLazy><PCG4ConfiguratorPage /></SafeLazy>} />
      <Route path="app/pcg4/reference-library" element={<SafeLazy><PCG4ReferenceLibraryPage /></SafeLazy>} />
      <Route path="app/pcg4/coverage-mapper" element={<SafeLazy><PCG4CoverageMapperPage /></SafeLazy>} />
      <Route path="app/pcg4/encounters" element={<SafeLazy><PCG4AdminPage /></SafeLazy>} />
      <Route path="app/pcg4/deployments" element={<SafeLazy><PCG4DeploymentsPage /></SafeLazy>} />
      <Route path="app/pcg4/setup" element={<SafeLazy><PCG4SetupPage /></SafeLazy>} />
      <Route path="app/pcg4/pricing" element={<SafeLazy><PCG4PricingPage /></SafeLazy>} />
      <Route path="app/pcg4/configurations-fb" element={<SafeLazy><PCG4ConfiguratorFBPage /></SafeLazy>} />
      {/* PCG4 Help removed — Video Tutorials tab in PCG4 Hub replaces it */}
      <Route path="app/pcg4/help" element={<Navigate to="/app/pcg4/hub" replace />} />

      {/* Organization Directory (own section) */}
      <Route path="directory" element={<SafeLazy><DirectoryPage /></SafeLazy>} />
      <Route path="directory/guide/*" element={<SafeLazy><DirectoryHubPage /></SafeLazy>} />
      <Route path="directory/hub" element={<SafeLazy><DirectoryHubPage /></SafeLazy>} />
      <Route path="directory/setup" element={<SafeLazy><DirectorySetupPage /></SafeLazy>} />
      <Route path="directory/deployments" element={<SafeLazy><DirectoryDeploymentsPage /></SafeLazy>} />

      {/* Platform Support Center (own section + microservice via chat) */}
      <Route path="support-center" element={<SafeLazy><SupportCenterPage /></SafeLazy>} />
      <Route path="support-center/guide/*" element={<SafeLazy><SupportCenterHubPage /></SafeLazy>} />
      <Route path="support-center/hub" element={<SafeLazy><SupportCenterHubPage /></SafeLazy>} />
      <Route path="support-center/setup" element={<SafeLazy><SupportCenterSetupPage /></SafeLazy>} />
      <Route path="support-center/deployments" element={<SafeLazy><SupportCenterDeploymentsPage /></SafeLazy>} />

      {/* Voice Engine */}
      <Route path="voice-engine" element={<SafeLazy><VoiceEngineHubPage /></SafeLazy>} />
      <Route path="voice-engine/guide/*" element={<SafeLazy><VoiceEngineHubPage /></SafeLazy>} />
      <Route path="voice-engine/hub" element={<SafeLazy><VoiceEngineHubPage /></SafeLazy>} />
      <Route path="voice-engine/setup" element={<SafeLazy><VoiceEngineSetupPage /></SafeLazy>} />
      <Route path="voice-engine/deployments" element={<SafeLazy><VoiceEngineDeploymentsPage /></SafeLazy>} />
      <Route path="voice-engine/demo" element={<SafeLazy><VoiceEngineDemoPage /></SafeLazy>} />

      {/* Jayna AI Calling */}
      <Route path="jayna" element={<SafeLazy><JaynaHubPage /></SafeLazy>} />
      <Route path="jayna/guide/*" element={<SafeLazy><JaynaHubPage /></SafeLazy>} />
      <Route path="jayna/hub" element={<SafeLazy><JaynaHubPage /></SafeLazy>} />
      <Route path="jayna/agents/new" element={<SafeLazy><JaynaAgentCreatePage /></SafeLazy>} />
      <Route path="jayna/agents/:id/edit" element={<SafeLazy><JaynaAgentEditPage /></SafeLazy>} />
      <Route path="jayna/agents/:id" element={<SafeLazy><JaynaAgentDetailPage /></SafeLazy>} />
      <Route path="jayna/agents" element={<SafeLazy><JaynaAgentsPage /></SafeLazy>} />
      <Route path="jayna/workflows/new" element={<SafeLazy><JaynaWorkflowCreatePage /></SafeLazy>} />
      <Route path="jayna/workflows/:id" element={<SafeLazy><JaynaWorkflowDetailPage /></SafeLazy>} />
      <Route path="jayna/workflows" element={<SafeLazy><JaynaWorkflowsPage /></SafeLazy>} />
      <Route path="jayna/calls" element={<SafeLazy><JaynaCallHistoryPage /></SafeLazy>} />
      <Route path="jayna/test-call" element={<SafeLazy><JaynaTestCallPage /></SafeLazy>} />
      <Route path="jayna/setup" element={<SafeLazy><JaynaSetupPage /></SafeLazy>} />
      <Route path="jayna/deployments" element={<SafeLazy><JaynaDeploymentsPage /></SafeLazy>} />

      {/* Form Builder */}
      <Route path="form-builder" element={<SafeLazy><FormBuilderPage /></SafeLazy>} />
      <Route path="form-builder/templates" element={<SafeLazy><FormTemplatesPage /></SafeLazy>} />
      <Route path="form-builder/create" element={<SafeLazy><FormCreatePage /></SafeLazy>} />
      <Route path="form-builder/submissions" element={<SafeLazy><FormSubmissionsPage /></SafeLazy>} />
      <Route path="form-builder/edit/:slug" element={<SafeLazy><FormEditorPage /></SafeLazy>} />
      <Route path="form-builder/render/:slug" element={<SafeLazy><FormRenderPage /></SafeLazy>} />
      <Route path="form-builder/help" element={<SafeLazy><FormBuilderHelpPage /></SafeLazy>} />
      <Route path="form-builder/guide/*" element={<SafeLazy><FormBuilderOverviewPage /></SafeLazy>} />
      <Route path="form-builder/overview" element={<Navigate to="form-builder/guide" replace />} />
      <Route path="form-builder/hub" element={<SafeLazy><FormBuilderHubPage /></SafeLazy>} />
      <Route path="form-builder/tokens" element={<SafeLazy><FormBuilderTokensPage /></SafeLazy>} />
      <Route path="form-builder/:slug" element={<SafeLazy><FormBuilderDetailPage /></SafeLazy>} />

      {/* Workflow Engine (FQP) */}
      <Route path="workflow-engine" element={<SafeLazy><WorkflowEngineHubPage /></SafeLazy>} />
      <Route path="workflow-engine/guide/*" element={<SafeLazy><WorkflowEngineHubPage /></SafeLazy>} />
      <Route path="workflow-engine/hub" element={<SafeLazy><WorkflowEngineHubPage /></SafeLazy>} />
      <Route path="workflow-engine/filters" element={<SafeLazy><WorkflowFiltersPage /></SafeLazy>} />
      <Route path="workflow-engine/queues" element={<SafeLazy><WorkflowQueuesPage /></SafeLazy>} />
      <Route path="workflow-engine/pipelines" element={<SafeLazy><WorkflowPipelinesPage /></SafeLazy>} />
      <Route path="workflow-engine/setup" element={<SafeLazy><WorkflowSetupPage /></SafeLazy>} />
      <Route path="workflow-engine/deployments" element={<SafeLazy><WorkflowDeploymentsPage /></SafeLazy>} />

      {/* Admin */}
      <Route path="admin/modules" element={<SafeLazy><ModuleRegistryPage /></SafeLazy>} />
      <Route path="admin/sitemap" element={<SafeLazy><SitemapPage /></SafeLazy>} />
      <Route path="admin/developer" element={<SafeLazy><DeveloperPage /></SafeLazy>} />
      <Route path="admin/menu-preview" element={<SafeLazy><MenuPreviewPage /></SafeLazy>} />

      {/* ============================================================ */}
      {/* Module Setup & Deployments Pages                             */}
      {/* (Must be before wildcard routes like uw-workflow/*)           */}
      {/* ============================================================ */}

      {/* Platform Services — Setup & Deployments */}
      <Route path="identity/setup" element={<SafeLazy><IdentitySetupPage /></SafeLazy>} />
      <Route path="identity/deployments" element={<SafeLazy><IdentityDeploymentsPage /></SafeLazy>} />
      <Route path="authorization/setup" element={<SafeLazy><AuthorizationSetupPage /></SafeLazy>} />
      <Route path="authorization/deployments" element={<SafeLazy><AuthorizationDeploymentsPage /></SafeLazy>} />
      <Route path="navigation/setup" element={<SafeLazy><NavigationSetupPage /></SafeLazy>} />
      <Route path="navigation/deployments" element={<SafeLazy><NavigationDeploymentsPage /></SafeLazy>} />
      <Route path="messaging/setup" element={<SafeLazy><MessagingSetupPage /></SafeLazy>} />
      <Route path="messaging/deployments" element={<SafeLazy><MessagingDeploymentsPage /></SafeLazy>} />
      <Route path="audit/setup" element={<SafeLazy><AuditSetupPage /></SafeLazy>} />
      <Route path="audit/deployments" element={<SafeLazy><AuditDeploymentsPage /></SafeLazy>} />
      <Route path="pii-vault/setup" element={<SafeLazy><PiiVaultSetupPage /></SafeLazy>} />
      <Route path="pii-vault/deployments" element={<SafeLazy><PiiVaultDeploymentsPage /></SafeLazy>} />

      {/* Secrets Vault */}
      <Route path="secrets" element={<SafeLazy><SecretsHubPage /></SafeLazy>} />
      <Route path="secrets/guide/*" element={<SafeLazy><SecretsHubPage /></SafeLazy>} />
      <Route path="secrets/hub" element={<SafeLazy><SecretsHubPage /></SafeLazy>} />
      <Route path="secrets/list" element={<SafeLazy><SecretsListPage /></SafeLazy>} />
      <Route path="secrets/new" element={<SafeLazy><SecretsCreatePage /></SafeLazy>} />
      <Route path="secrets/audit" element={<SafeLazy><SecretsAuditPage /></SafeLazy>} />
      <Route path="secrets/setup" element={<SafeLazy><SecretsSetupPage /></SafeLazy>} />
      <Route path="secrets/deployments" element={<SafeLazy><SecretsDeploymentsPage /></SafeLazy>} />

      {/* Platform Capabilities — Setup & Deployments */}
      <Route path="form-builder/setup" element={<SafeLazy><FormBuilderSetupPage /></SafeLazy>} />
      <Route path="form-builder/deployments" element={<SafeLazy><FormBuilderDeploymentsPage /></SafeLazy>} />
      <Route path="dashboard/setup" element={<SafeLazy><DashboardSetupPage /></SafeLazy>} />
      <Route path="dashboard/deployments" element={<SafeLazy><DashboardDeploymentsPage /></SafeLazy>} />

      {/* Business Modules — Setup & Deployments */}
      <Route path="hi-quotation/setup" element={<SafeLazy><HIQuotationSetupPage /></SafeLazy>} />
      <Route path="hi-quotation/deployments" element={<SafeLazy><HIQuotationDeploymentsPage /></SafeLazy>} />
      <Route path="uw-workflow/setup" element={<SafeLazy><UWWorkflowSetupPage /></SafeLazy>} />
      <Route path="uw-workflow/deployments" element={<SafeLazy><UWWorkflowDeploymentsPage /></SafeLazy>} />
      <Route path="hi-decisioning/setup" element={<SafeLazy><HIDecisioningSetupPage /></SafeLazy>} />
      <Route path="hi-decisioning/deployments" element={<SafeLazy><HIDecisioningDeploymentsPage /></SafeLazy>} />
      <Route path="mi-quotation/setup" element={<SafeLazy><MIQuotationSetupPage /></SafeLazy>} />
      <Route path="mi-quotation/deployments" element={<SafeLazy><MIQuotationDeploymentsPage /></SafeLazy>} />
      <Route path="fee-management/setup" element={<SafeLazy><FeeManagementSetupPage /></SafeLazy>} />
      <Route path="fee-management/deployments" element={<SafeLazy><FeeManagementDeploymentsPage /></SafeLazy>} />
      <Route path="claims/setup" element={<SafeLazy><ClaimsSetupPage /></SafeLazy>} />
      <Route path="claims/deployments" element={<SafeLazy><ClaimsDeploymentsPage /></SafeLazy>} />

      {/* Admin — Setup & Deployments */}
      <Route path="admin/setup" element={<SafeLazy><AdminSetupPage /></SafeLazy>} />
      <Route path="admin/deployments" element={<SafeLazy><AdminDeploymentsPage /></SafeLazy>} />

      {/* Business Modules — Retail Insurance */}
      <Route path="uw-workflow" element={<SafeLazy><UWWorkflowPage /></SafeLazy>} />
      <Route path="uw-workflow/guide/*" element={<SafeLazy><UWWorkflowHubPage /></SafeLazy>} />
      <Route path="uw-workflow/hub" element={<SafeLazy><UWWorkflowHubPage /></SafeLazy>} />
      <Route path="uw-workflow/help" element={<SafeLazy><UWWorkflowHelpPage /></SafeLazy>} />
      <Route path="uw-workflow/*" element={<SafeLazy><UWWorkflowPage /></SafeLazy>} />
      <Route path="hi-decisioning" element={<SafeLazy><HIDecisioningPage /></SafeLazy>} />
      <Route path="hi-decisioning/guide/*" element={<SafeLazy><HIDecisioningHubPage /></SafeLazy>} />
      <Route path="hi-decisioning/hub" element={<SafeLazy><HIDecisioningHubPage /></SafeLazy>} />
      <Route path="hi-decisioning/help" element={<SafeLazy><HIDecisioningHelpPage /></SafeLazy>} />
      <Route path="hi-decisioning/*" element={<SafeLazy><HIDecisioningPage /></SafeLazy>} />
      <Route path="hi-quotation" element={<SafeLazy><HIQuotationPage /></SafeLazy>} />
      <Route path="hi-quotation/guide/*" element={<SafeLazy><HIQuotationHubPage /></SafeLazy>} />
      <Route path="hi-quotation/hub" element={<SafeLazy><HIQuotationHubPage /></SafeLazy>} />
      <Route path="hi-quotation/help" element={<SafeLazy><HIQuotationHelpPage /></SafeLazy>} />
      <Route path="hi-quotation/new" element={<SafeLazy><RegionSelectorPage /></SafeLazy>} />
      <Route path="hi-quotation/new/india" element={<SafeLazy><NewApplicationIndiaPage /></SafeLazy>} />
      <Route path="hi-quotation/new/uae" element={<SafeLazy><NewApplicationUAEPage /></SafeLazy>} />
      <Route path="hi-quotation/new/us" element={<SafeLazy><NewApplicationUSPage /></SafeLazy>} />
      <Route path="hi-quotation/new/legacy" element={<SafeLazy><NewHIApplicationPage /></SafeLazy>} />
      <Route path="hi-quotation/new/:countrySlug" element={<SafeLazy><GenericApplicationPage /></SafeLazy>} />
      <Route path="hi-quotation/*" element={<SafeLazy><HIQuotationPage /></SafeLazy>} />

      {/* Business Modules — Motor Insurance */}
      <Route path="mi-quotation" element={<SafeLazy><MIQuotationPage /></SafeLazy>} />
      <Route path="mi-quotation/guide/*" element={<SafeLazy><MIQuotationHubPage /></SafeLazy>} />
      <Route path="mi-quotation/hub" element={<SafeLazy><MIQuotationHubPage /></SafeLazy>} />
      <Route path="mi-quotation/help" element={<SafeLazy><MIQuotationHelpPage /></SafeLazy>} />
      <Route path="mi-quotation/*" element={<SafeLazy><MIQuotationPage /></SafeLazy>} />

      {/* Business Modules — Product Pricing (own section + microservice) */}
      <Route path="product-pricing" element={<SafeLazy><ProductPricingHubPage /></SafeLazy>} />
      <Route path="product-pricing/guide/*" element={<SafeLazy><ProductPricingHubPage /></SafeLazy>} />
      <Route path="product-pricing/hub" element={<SafeLazy><ProductPricingHubPage /></SafeLazy>} />
      <Route path="product-pricing/rate-tables" element={<SafeLazy><RateTablesPage /></SafeLazy>} />
      <Route path="product-pricing/import" element={<SafeLazy><RateCardImportPage /></SafeLazy>} />
      <Route path="product-pricing/calculator" element={<SafeLazy><RateTablesPage /></SafeLazy>} />
      <Route path="product-pricing/setup" element={<SafeLazy><ProductPricingSetupPage /></SafeLazy>} />
      <Route path="product-pricing/deployments" element={<SafeLazy><ProductPricingDeploymentsPage /></SafeLazy>} />

      {/* Business Modules — Fee Management (own section + microservice) */}
      <Route path="fee-management" element={<SafeLazy><FeeManagementHubPage /></SafeLazy>} />
      <Route path="fee-management/hub" element={<SafeLazy><FeeManagementHubPage /></SafeLazy>} />
      <Route path="fee-management/guide/*" element={<SafeLazy><FeeManagementHubPage /></SafeLazy>} />

      {/* Business Modules — Claims (own section + microservice) */}
      <Route path="claims" element={<SafeLazy><ClaimsHubPage /></SafeLazy>} />
      <Route path="claims/hub" element={<SafeLazy><ClaimsHubPage /></SafeLazy>} />
      <Route path="claims/guide/*" element={<SafeLazy><ClaimsHubPage /></SafeLazy>} />

      {/* ============================================================ */}
      {/* MUW-52 Ported Modules — Hub, Setup & Deployments             */}
      {/* ============================================================ */}

      {/* Endorsements */}
      <Route path="endorsements" element={<SafeLazy><EndorsementsHubPage /></SafeLazy>} />
      <Route path="endorsements/guide/*" element={<SafeLazy><EndorsementsHubPage /></SafeLazy>} />
      <Route path="endorsements/hub" element={<SafeLazy><EndorsementsHubPage /></SafeLazy>} />
      <Route path="endorsements/setup" element={<SafeLazy><EndorsementsSetupPage /></SafeLazy>} />
      <Route path="endorsements/deployments" element={<SafeLazy><EndorsementsDeploymentsPage /></SafeLazy>} />

      {/* Renewals */}
      <Route path="renewals" element={<SafeLazy><RenewalsHubPage /></SafeLazy>} />
      <Route path="renewals/guide/*" element={<SafeLazy><RenewalsHubPage /></SafeLazy>} />
      <Route path="renewals/hub" element={<SafeLazy><RenewalsHubPage /></SafeLazy>} />
      <Route path="renewals/setup" element={<SafeLazy><RenewalsSetupPage /></SafeLazy>} />
      <Route path="renewals/deployments" element={<SafeLazy><RenewalsDeploymentsPage /></SafeLazy>} />

      {/* SME & Corporate Insurance */}
      <Route path="sme-corporate" element={<SafeLazy><SMECorporateHubPage /></SafeLazy>} />
      <Route path="sme-corporate/guide/*" element={<SafeLazy><SMECorporateHubPage /></SafeLazy>} />
      <Route path="sme-corporate/hub" element={<SafeLazy><SMECorporateHubPage /></SafeLazy>} />
      <Route path="sme-corporate/setup" element={<SafeLazy><SMECorporateSetupPage /></SafeLazy>} />
      <Route path="sme-corporate/deployments" element={<SafeLazy><SMECorporateDeploymentsPage /></SafeLazy>} />

      {/* Reinsurance */}
      <Route path="reinsurance" element={<SafeLazy><ReinsuranceHubPage /></SafeLazy>} />
      <Route path="reinsurance/guide/*" element={<SafeLazy><ReinsuranceHubPage /></SafeLazy>} />
      <Route path="reinsurance/hub" element={<SafeLazy><ReinsuranceHubPage /></SafeLazy>} />
      <Route path="reinsurance/setup" element={<SafeLazy><ReinsuranceSetupPage /></SafeLazy>} />
      <Route path="reinsurance/deployments" element={<SafeLazy><ReinsuranceDeploymentsPage /></SafeLazy>} />

      {/* Claims TPA */}
      <Route path="claims-tpa" element={<SafeLazy><ClaimsTPAHubPage /></SafeLazy>} />
      <Route path="claims-tpa/guide/*" element={<SafeLazy><ClaimsTPAHubPage /></SafeLazy>} />
      <Route path="claims-tpa/hub" element={<SafeLazy><ClaimsTPAHubPage /></SafeLazy>} />
      <Route path="claims-tpa/setup" element={<SafeLazy><ClaimsTPASetupPage /></SafeLazy>} />
      <Route path="claims-tpa/deployments" element={<SafeLazy><ClaimsTPADeploymentsPage /></SafeLazy>} />

      {/* Medical Coding */}
      <Route path="medical-coding" element={<SafeLazy><MedicalCodingHubPage /></SafeLazy>} />
      <Route path="medical-coding/guide/*" element={<SafeLazy><MedicalCodingHubPage /></SafeLazy>} />
      <Route path="medical-coding/hub" element={<SafeLazy><MedicalCodingHubPage /></SafeLazy>} />
      <Route path="medical-coding/setup" element={<SafeLazy><MedicalCodingSetupPage /></SafeLazy>} />
      <Route path="medical-coding/deployments" element={<SafeLazy><MedicalCodingDeploymentsPage /></SafeLazy>} />

      {/* MAF Engine */}
      <Route path="maf-engine" element={<SafeLazy><MAFEngineHubPage /></SafeLazy>} />
      <Route path="maf-engine/guide/*" element={<SafeLazy><MAFEngineHubPage /></SafeLazy>} />
      <Route path="maf-engine/hub" element={<SafeLazy><MAFEngineHubPage /></SafeLazy>} />
      <Route path="maf-engine/setup" element={<SafeLazy><MAFEngineSetupPage /></SafeLazy>} />
      <Route path="maf-engine/deployments" element={<SafeLazy><MAFEngineDeploymentsPage /></SafeLazy>} />

      {/* RPA Integration */}
      <Route path="rpa-integration" element={<SafeLazy><RPAIntegrationHubPage /></SafeLazy>} />
      <Route path="rpa-integration/guide/*" element={<SafeLazy><RPAIntegrationHubPage /></SafeLazy>} />
      <Route path="rpa-integration/hub" element={<SafeLazy><RPAIntegrationHubPage /></SafeLazy>} />
      <Route path="rpa-integration/setup" element={<SafeLazy><RPAIntegrationSetupPage /></SafeLazy>} />
      <Route path="rpa-integration/deployments" element={<SafeLazy><RPAIntegrationDeploymentsPage /></SafeLazy>} />

      {/* API Integration */}
      <Route path="api-integration" element={<SafeLazy><APIIntegrationHubPage /></SafeLazy>} />
      <Route path="api-integration/guide/*" element={<SafeLazy><APIIntegrationHubPage /></SafeLazy>} />
      <Route path="api-integration/hub" element={<SafeLazy><APIIntegrationHubPage /></SafeLazy>} />
      <Route path="api-integration/setup" element={<SafeLazy><APIIntegrationSetupPage /></SafeLazy>} />
      <Route path="api-integration/deployments" element={<SafeLazy><APIIntegrationDeploymentsPage /></SafeLazy>} />

      {/* Reporting & Analytics */}
      <Route path="reporting" element={<SafeLazy><ReportingHubPage /></SafeLazy>} />
      <Route path="reporting/guide/*" element={<SafeLazy><ReportingHubPage /></SafeLazy>} />
      <Route path="reporting/hub" element={<SafeLazy><ReportingHubPage /></SafeLazy>} />
      <Route path="reporting/setup" element={<SafeLazy><ReportingSetupPage /></SafeLazy>} />
      <Route path="reporting/deployments" element={<SafeLazy><ReportingDeploymentsPage /></SafeLazy>} />

      {/* Policy Issuance */}
      <Route path="policy-issuance" element={<SafeLazy><PolicyIssuanceHubPage /></SafeLazy>} />
      <Route path="policy-issuance/guide/*" element={<SafeLazy><PolicyIssuanceHubPage /></SafeLazy>} />
      <Route path="policy-issuance/hub" element={<SafeLazy><PolicyIssuanceHubPage /></SafeLazy>} />
      <Route path="policy-issuance/setup" element={<SafeLazy><PolicyIssuanceSetupPage /></SafeLazy>} />
      <Route path="policy-issuance/deployments" element={<SafeLazy><PolicyIssuanceDeploymentsPage /></SafeLazy>} />

      {/* Document Management */}
      <Route path="document-management" element={<SafeLazy><DocumentManagementHubPage /></SafeLazy>} />
      <Route path="document-management/guide/*" element={<SafeLazy><DocumentManagementHubPage /></SafeLazy>} />
      <Route path="document-management/hub" element={<SafeLazy><DocumentManagementHubPage /></SafeLazy>} />
      <Route path="document-management/setup" element={<SafeLazy><DocumentManagementSetupPage /></SafeLazy>} />
      <Route path="document-management/deployments" element={<SafeLazy><DocumentManagementDeploymentsPage /></SafeLazy>} />

      {/* Broker Dashboard */}
      <Route path="broker/dashboard" element={<SafeLazy><BrokerDashboardPage /></SafeLazy>} />

      {/* Channel Analytics */}
      <Route path="analytics/channels" element={<SafeLazy><ChannelAnalyticsPage /></SafeLazy>} />

      {/* Verification */}
      <Route path="verification/help" element={<SafeLazy><VerificationHelpPage /></SafeLazy>} />

      {/* Legacy redirects: old /products/* and /pcg4/* routes */}
      <Route path="products" element={<Navigate to="/app/pcg4/configurations" replace />} />
      <Route path="products/designer" element={<Navigate to="/app/pcg4/configurations/new" replace />} />
      <Route path="products/encounters" element={<Navigate to="/app/pcg4/encounters" replace />} />
      <Route path="products/rating" element={<NotFoundPage />} />
      <Route path="products/rules" element={<NotFoundPage />} />
      <Route path="products/forms" element={<NotFoundPage />} />
      <Route path="products/setup" element={<Navigate to="/app/pcg4/setup" replace />} />
      <Route path="pcg4" element={<Navigate to="/app/pcg4/configurations" replace />} />
      <Route path="pcg4/configurator" element={<Navigate to="/app/pcg4/configurations/new" replace />} />
      <Route path="pcg4/configurator/:configId" element={<PCG4ConfigRedirect />} />

      <Route path="demo" element={<DemoPage />} />
      <Route path="demo/:id" element={<DemoPage />} />
      <Route path="dashboard-view" element={<DashboardViewPage />} />
      <Route path="dashboard-designer" element={<DashboardDesignerPage />} />
      <Route path="demo-training" element={<DemoTrainingCenter />} />
      <Route path="demo-training/segments/new" element={<DemoSegmentEditor />} />
      <Route path="demo-training/segments/:id/edit" element={<DemoSegmentEditor />} />
      <Route path="data-table-demo" element={<DataTableDemoPage />} />
      <Route path="stepper-demo" element={<StepperDemoPage />} />
      <Route path="tree-picker-demo" element={<TreePickerDemoPage />} />

      {/* Dev Center */}
      <Route path="dev-center" element={<SafeLazy><DevCenterPage /></SafeLazy>} />
      <Route path="dev-center/guide/*" element={<SafeLazy><DevCenterGuidePage /></SafeLazy>} />
      <Route path="dev-center/tutorials" element={<SafeLazy><TutorialsPage /></SafeLazy>} />
      <Route path="dev-center/zmb-guide" element={<SafeLazy><ZmbGuidePage /></SafeLazy>} />
      <Route path="dev-center/architecture" element={<SafeLazy><ArchitecturePage /></SafeLazy>} />

      {/* Catch-all: show Not Found page instead of silent redirect */}
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}

/** Redirect /org/:orgId/* → /O/:orgId/* for backward compatibility */
function OrgLegacyRedirect() {
  const { orgId, '*': rest } = useParams<{ orgId: string; '*': string }>();
  return <Navigate to={`/O/${orgId}/${rest || ''}`} replace />;
}

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<SafeLazy><ForgotPasswordPage /></SafeLazy>} />
        <Route path="/reset-password" element={<SafeLazy><ResetPasswordPage /></SafeLazy>} />
        <Route path="/auth/change-password-required" element={<SafeLazy><ForceChangePasswordPage /></SafeLazy>} />
        {/* Payment gateway — public, no auth required (customer-facing) */}
        <Route path="/payments/:paymentId" element={<SafeLazy><PaymentGatewayPage /></SafeLazy>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {PageRoutes()}
        </Route>
        {/* Namespace-prefixed routes: /O/:orgId/... (matches REST API grammar) */}
        <Route
          path="/O/:orgId"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {PageRoutes()}
        </Route>
        {/* Backward compatibility: /org/:orgId/* → /O/:orgId/* */}
        <Route path="/org/:orgId/*" element={<OrgLegacyRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

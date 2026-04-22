import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ToastProvider, useToast } from './components/shared/Toast';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import NoAccessPage from './pages/auth/NoAccessPage';
import { useAuth } from './hooks/useAuth';
import { authorizationService } from './services/authorization';
import { initPlatformEvents, destroyPlatformEvents, registerBannerFn } from './services/platformEvents';

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
const PiiDataTypesPage = lazyWithRetry(() => import('./pages/pii-vault/PiiDataTypesPage'));
const PiiTokenRegistryPage = lazyWithRetry(() => import('./pages/pii-vault/PiiTokenRegistryPage'));
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
const DataTableSetupPage = lazyWithRetry(() => import('./pages/data-table-demo/DataTableSetupPage'));
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
// SupportCenterPage removed 2026-04-23 (Soldier AX J62/J63, decision #7).
// Canonical Support Center UI lives in zorbit-adm-help_support registered module.
// Video manifests preserved in src/data/video-manifests/platform-tour.ts for cross-module reuse.
const FormTemplatesPage = lazyWithRetry(() => import('./pages/form-builder/FormTemplatesPage'));
const FormCreatePage = lazyWithRetry(() => import('./pages/form-builder/FormCreatePage'));
const FormSubmissionsPage = lazyWithRetry(() => import('./pages/form-builder/FormSubmissionsPage'));
const FormEditorPage = lazyWithRetry(() => import('./pages/form-builder/FormEditorPage'));
const FormBuilderHelpPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderHelpPage'));
const FormBuilderOverviewPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderOverviewPage'));
const FormRenderPage = lazyWithRetry(() => import('./pages/form-builder/FormRenderPage'));
const ModuleRegistryPage = lazyWithRetry(() => import('./pages/admin/ModuleRegistryPage'));
const ManifestRouter = lazyWithRetry(() => import('./components/layout/ManifestRouter'));
const LicensingPage = lazyWithRetry(() => import('./pages/admin/LicensingPage'));
const SitemapPage = lazyWithRetry(() => import('./pages/admin/SitemapPage'));
const DeveloperPage = lazyWithRetry(() => import('./pages/admin/DeveloperPage'));
const MenuPreviewPage = lazyWithRetry(() => import('./pages/admin/MenuPreviewPage'));
const UWWorkflowPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowPage'));
const HIDecisioningPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningPage'));
const HIQuotationPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationPage'));
const NewHIApplicationPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationPage'));
const RegionSelectorPage = lazyWithRetry(() => import('./pages/hi-quotation/RegionSelectorPage'));
const NewApplicationIndiaPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationIndiaPage'));
const NewApplicationUAEPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationUAEPage'));
const NewApplicationUSPage = lazyWithRetry(() => import('./pages/hi-quotation/NewApplicationUSPage'));
const GenericApplicationPage = lazyWithRetry(() => import('./pages/hi-quotation/GenericApplicationPage'));
const HIQuotationHelpPage = lazyWithRetry(() => import('./pages/hi-quotation/HIQuotationHelpPage'));
const UWWorkflowHelpPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowHelpPage'));
const HIDecisioningHelpPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningHelpPage'));
const VerificationHelpPage = lazyWithRetry(() => import('./pages/verification/VerificationHelpPage'));
const PaymentGatewayPage = lazyWithRetry(() => import('./pages/payments/PaymentGatewayPage'));
const PaymentGatewaySandboxPage = lazyWithRetry(() => import('./pages/payments/PaymentGatewaySandboxPage'));

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
const FeeManagementSetupPage = lazyWithRetry(() => import('./pages/fee-management/FeeManagementSetupPage'));
const FeeManagementDeploymentsPage = lazyWithRetry(() => import('./pages/fee-management/FeeManagementDeploymentsPage'));
const AdminSetupPage = lazyWithRetry(() => import('./pages/admin/AdminSetupPage'));
const AdminDeploymentsPage = lazyWithRetry(() => import('./pages/admin/AdminDeploymentsPage'));

// PFS Module Setup Pages
const WhiteLabelSetupPage = lazyWithRetry(() => import('./pages/white-label/WhiteLabelSetupPage'));
const DocGeneratorSetupPage = lazyWithRetry(() => import('./pages/doc-generator/DocGeneratorSetupPage'));

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
const UWWorkflowHubPage = lazyWithRetry(() => import('./pages/uw-workflow/UWWorkflowHubPage'));
const HIDecisioningHubPage = lazyWithRetry(() => import('./pages/hi-decisioning/HIDecisioningHubPage'));
const FeeManagementHubPage = lazyWithRetry(() => import('./pages/fee-management/FeeManagementHubPage'));
const ProductPricingHubPage = lazyWithRetry(() => import('./pages/product-pricing/ProductPricingHubPage'));
const RateTablesPage = lazyWithRetry(() => import('./pages/product-pricing/RateTablesPage'));
const RateCardImportPage = lazyWithRetry(() => import('./pages/product-pricing/RateCardImportPage'));
const ProductPricingSetupPage = lazyWithRetry(() => import('./pages/product-pricing/ProductPricingSetupPage'));
const ProductPricingDeploymentsPage = lazyWithRetry(() => import('./pages/product-pricing/ProductPricingDeploymentsPage'));
const FormBuilderHubPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderHubPage'));
const ZmbModuleDraftsPage = lazyWithRetry(() => import('./pages/zmb-factory/module-drafts/ModuleDraftsPage'));
// Seeder Generator (Phase 1+2, 2026-04-23)
const SeedBundlesListPage = lazyWithRetry(() => import('./pages/seeder/seed-bundles/SeedBundlesListPage'));
const SeedBundleWizardPage = lazyWithRetry(() => import('./pages/seeder/seed-bundles/SeedBundleWizardPage'));
const SeedBundleDetailPage = lazyWithRetry(() => import('./pages/seeder/seed-bundles/SeedBundleDetailPage'));
const SeedBundleRunDetailPage = lazyWithRetry(() => import('./pages/seeder/seed-bundles/SeedBundleRunDetailPage'));
const FormBuilderPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderPage'));
const FormBuilderDetailPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderDetailPage'));
const FormBuilderTokensPage = lazyWithRetry(() => import('./pages/form-builder/FormBuilderTokensPage'));

// PII Showcase — Hub, Setup, Deployments
const PIIShowcaseHubPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcaseHubPage'));
const PIIShowcaseSetupPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcaseSetupPage'));
const PIIShowcaseDeploymentsPage = lazyWithRetry(() => import('./pages/pii-showcase/PIIShowcaseDeploymentsPage'));

// Directory — Hub, Setup, Deployments
const DirectoryHubPage = lazyWithRetry(() => import('./pages/directory/DirectoryHubPage'));
const DirectorySetupPage = lazyWithRetry(() => import('./pages/directory/DirectorySetupPage'));
const DirectoryDeploymentsPage = lazyWithRetry(() => import('./pages/directory/DirectoryDeploymentsPage'));

// Support Center hub/setup/deployments removed 2026-04-23 (Soldier AX J62/J63).
// zorbit-adm-help_support registered module is canonical.

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
// EPIC 16 Phase 2 — bpmn-js designer inside workflow_engine module. This is
// the FQP authoring surface rewritten as BPMN 2.0 native. Registered as
// `@platform:WorkflowDesigner` so other modules can embed it too, but the
// direct /m/workflow-engine/designer route below gives the nav entry a
// predictable home while the manifest pipeline finishes landing.
const WorkflowDesignerPage = lazyWithRetry(() => import('./components/shared/WorkflowDesigner'));

// Secrets Vault — Hub, List, Create, Audit, Setup, Deployments
const SecretsHubPage = lazyWithRetry(() => import('./pages/secrets/SecretsHubPage'));
const SecretsListPage = lazyWithRetry(() => import('./pages/secrets/SecretsListPage'));
const SecretsCreatePage = lazyWithRetry(() => import('./pages/secrets/SecretsCreatePage'));
const SecretsAuditPage = lazyWithRetry(() => import('./pages/secrets/SecretsAuditPage'));
const SecretsSetupPage = lazyWithRetry(() => import('./pages/secrets/SecretsSetupPage'));
const SecretsDeploymentsPage = lazyWithRetry(() => import('./pages/secrets/SecretsDeploymentsPage'));

// Channel Analytics
// BrokerDashboardPage removed 2026-04-23 (Soldier AX J62/J63). Canonical broker UI is zorbit-app-broker registered module at /m/broker/*.
const ChannelAnalyticsPage = lazyWithRetry(() => import('./pages/analytics/ChannelAnalyticsPage'));

// ── Module update banner ──────────────────────────────────────────────────────

interface UpdateBannerProps {
  message: string;
  onDismiss: () => void;
}

function ModuleUpdateBanner({ message, onDismiss }: UpdateBannerProps) {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1d4ed8',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
      <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#fff',
            color: '#1d4ed8',
            border: 'none',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refresh now
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

// ── Platform events initialiser (mounted inside ToastProvider) ────────────────

function PlatformEventsInit() {
  const { toast } = useToast();
  const [updateBannerMessage, setUpdateBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    // Register the banner function before init so it's available immediately
    registerBannerFn((msg: string) => setUpdateBannerMessage(msg));

    // Only connect when the WS URL is explicitly configured —
    // the module registry uses socket.io but platformEvents uses plain WebSocket.
    // Until the registry WS endpoint is ready this would storm-reconnect.
    if (import.meta.env.VITE_PLATFORM_WS_URL) {
      initPlatformEvents({ toast });
    }

    return () => {
      destroyPlatformEvents();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!updateBannerMessage) return null;

  return (
    <ModuleUpdateBanner
      message={updateBannerMessage}
      onDismiss={() => setUpdateBannerMessage(null)}
    />
  );
}

// ── Protected route ───────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const token = localStorage.getItem('zorbit_token');
    if (!token) {
      const intended = window.location.pathname + window.location.search;
      navigate(`/login?returnTo=${encodeURIComponent(intended)}`, { replace: true });
      return;
    }
    // Wait until useAuth has decoded the user from the token
    if (!user) return;

    const orgId = user.organizationId || 'O-DEMO';
    authorizationService.getRoles(orgId)
      .then((res) => {
        const roles = res.data;
        if (Array.isArray(roles) && roles.length > 0) {
          setAuthState('authorized');
        } else {
          setAuthState('unauthorized');
        }
      })
      .catch(() => {
        setAuthState('unauthorized');
      });
  }, [user, navigate]);

  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (authState === 'unauthorized') {
    return <Navigate to="/no-access" replace />;
  }

  return <>{children}</>;
}

/** Redirect helper — legacy pcg4/configurator/:configId */
function PCG4ConfigRedirect() {
  const { configId } = useParams<{ configId: string }>();
  return <Navigate to={`/m/pcg4/configs/${configId}`} replace />;
}

/** Redirect helper — legacy /app/pcg4/configurations/:configId → /m/pcg4/configs/:configId */
function PCG4AppConfigRedirect() {
  const { configId } = useParams<{ configId: string }>();
  return <Navigate to={`/m/pcg4/configs/${configId}`} replace />;
}

/**
 * /m/:slug — module-level redirect to the primary feature page for
 * modules that have an explicit literal Route match (e.g. `m/pcg4`).
 *
 * Bug-fix 2026-04-20 (US-RT-2093 P1 Cluster 2): the original impl read
 * useParams<{ moduleSlug: string }>() but the Route declarations use
 * literal paths like `m/pcg4` with no `:moduleSlug` placeholder, so the
 * param was always undefined and the fallback target `/` kicked in —
 * sending every bare `/m/<slug>` to Dashboard. Now we derive the slug
 * from the pathname directly.
 */
function ModuleIndexRedirect() {
  const location = useLocation();
  // Path shape: "/m/<slug>" or "/m/<slug>/"
  const match = location.pathname.match(/^\/m\/([^/]+)\/?$/);
  const slug = match ? match[1] : '';
  const MODULE_DEFAULTS: Record<string, string> = {
    'pcg4':           '/m/pcg4/configs',
    'hi-quotation':   '/m/hi-quotation/quotes',
    'mi-quotation':   '/m/mi-quotation/quotes',
    'uw-workflow':    '/m/uw-workflow/queues',
    'hi-decisioning': '/m/hi-decisioning/rules',
    'form-builder':   '/m/form-builder/forms',
    'datatable':      '/m/datatable/tables',
    'payment-gateway':'/m/payment-gateway/sandbox',
  };
  const target = MODULE_DEFAULTS[slug] || '/';
  return <Navigate to={target} replace />;
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
      <Route path="pii-vault/tokens" element={<SafeLazy><PiiTokenRegistryPage /></SafeLazy>} />
      <Route path="pii-vault/data-types" element={<SafeLazy><PiiDataTypesPage /></SafeLazy>} />
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

      {/* ============================================================ */}
      {/* /m/{module-slug}/... — canonical module routes               */}
      {/* Per uri-conventions.md §3: no org scope in FE URLs           */}
      {/* ============================================================ */}

      {/* PCG4 — /m/pcg4/* */}
      <Route path="m/pcg4" element={<ModuleIndexRedirect />} />
      <Route path="m/pcg4/guide/*" element={<SafeLazy><PCG4HubPage /></SafeLazy>} />
      <Route path="m/pcg4/hub" element={<SafeLazy><PCG4HubPage /></SafeLazy>} />
      <Route path="m/pcg4/overview" element={<Navigate to="/m/pcg4/guide" replace />} />
      <Route path="m/pcg4/configs" element={<SafeLazy><PCG4DashboardPage /></SafeLazy>} />
      <Route path="m/pcg4/configs/new" element={<SafeLazy><PCG4ConfiguratorPage /></SafeLazy>} />
      <Route path="m/pcg4/configs/:configId" element={<SafeLazy><PCG4ConfiguratorPage /></SafeLazy>} />
      <Route path="m/pcg4/refs" element={<SafeLazy><PCG4ReferenceLibraryPage /></SafeLazy>} />
      <Route path="m/pcg4/coverage-mapper" element={<SafeLazy><PCG4CoverageMapperPage /></SafeLazy>} />
      <Route path="m/pcg4/encounters" element={<SafeLazy><PCG4AdminPage /></SafeLazy>} />
      {/* /m/pcg4/deployments now served via ManifestRouter → DeploymentsModulePage (Phase 3 of deployment-registry rollout). Route intentionally removed so the manifest feComponent wins. */}
      <Route path="m/pcg4/setup" element={<SafeLazy><PCG4SetupPage /></SafeLazy>} />
      <Route path="m/pcg4/pricing" element={<SafeLazy><PCG4PricingPage /></SafeLazy>} />
      <Route path="m/pcg4/help" element={<Navigate to="/m/pcg4/hub" replace />} />

      {/* ZMB Factory — /m/zmb-factory/* (noun-based RESTful, 2026-04-23) */}
      <Route path="m/zmb-factory/modules/new" element={<SafeLazy><ZmbModuleDraftsPage /></SafeLazy>} />
      <Route path="m/zmb-factory/modules/:draftId" element={<SafeLazy><ZmbModuleDraftsPage /></SafeLazy>} />

      {/* Payment Gateway Sandbox — /m/payment-gateway/* (AX1 2026-04-22, zorbit-pfs-payment_gateway) */}
      <Route path="m/payment-gateway" element={<ModuleIndexRedirect />} />
      <Route path="m/payment-gateway/sandbox" element={<SafeLazy><PaymentGatewaySandboxPage /></SafeLazy>} />
      <Route path="m/payment-gateway/gateways" element={<SafeLazy><PaymentGatewaySandboxPage /></SafeLazy>} />
      <Route path="m/payment-gateway/attempts" element={<SafeLazy><PaymentGatewaySandboxPage /></SafeLazy>} />

      {/* Seeder Generator — /m/seeder/seed-bundles/* (added 2026-04-23) */}
      <Route path="m/seeder/seed-bundles" element={<SafeLazy><SeedBundlesListPage /></SafeLazy>} />
      <Route path="m/seeder/seed-bundles/new" element={<SafeLazy><SeedBundleWizardPage /></SafeLazy>} />
      <Route path="m/seeder/seed-bundles/:bundleId" element={<SafeLazy><SeedBundleDetailPage /></SafeLazy>} />
      <Route path="m/seeder/seed-bundles/:bundleId/runs" element={<SafeLazy><SeedBundleDetailPage /></SafeLazy>} />
      <Route path="m/seeder/seed-bundles/:bundleId/runs/:runId" element={<SafeLazy><SeedBundleRunDetailPage /></SafeLazy>} />

      {/* HI Quotation — /m/hi-quotation/* */}
      <Route path="m/hi-quotation" element={<ModuleIndexRedirect />} />
      <Route path="m/hi-quotation/guide/*" element={<SafeLazy><HIQuotationHubPage /></SafeLazy>} />
      <Route path="m/hi-quotation/hub" element={<SafeLazy><HIQuotationHubPage /></SafeLazy>} />
      <Route path="m/hi-quotation/quotes" element={<SafeLazy><HIQuotationPage /></SafeLazy>} />
      <Route path="m/hi-quotation/quotes/new" element={<SafeLazy><RegionSelectorPage /></SafeLazy>} />
      <Route path="m/hi-quotation/quotes/new/india" element={<SafeLazy><NewApplicationIndiaPage /></SafeLazy>} />
      <Route path="m/hi-quotation/quotes/new/uae" element={<SafeLazy><NewApplicationUAEPage /></SafeLazy>} />
      <Route path="m/hi-quotation/quotes/new/us" element={<SafeLazy><NewApplicationUSPage /></SafeLazy>} />
      <Route path="m/hi-quotation/quotes/new/:countrySlug" element={<SafeLazy><GenericApplicationPage /></SafeLazy>} />
      <Route path="m/hi-quotation/setup" element={<SafeLazy><HIQuotationSetupPage /></SafeLazy>} />
      <Route path="m/hi-quotation/deployments" element={<SafeLazy><HIQuotationDeploymentsPage /></SafeLazy>} />
      <Route path="m/hi-quotation/help" element={<SafeLazy><HIQuotationHelpPage /></SafeLazy>} />

      {/* UW Workflow — /m/uw-workflow/* */}
      <Route path="m/uw-workflow" element={<ModuleIndexRedirect />} />
      <Route path="m/uw-workflow/guide/*" element={<SafeLazy><UWWorkflowHubPage /></SafeLazy>} />
      <Route path="m/uw-workflow/hub" element={<SafeLazy><UWWorkflowHubPage /></SafeLazy>} />
      <Route path="m/uw-workflow/queues" element={<SafeLazy><UWWorkflowPage /></SafeLazy>} />
      <Route path="m/uw-workflow/queues/:queueId" element={<SafeLazy><UWWorkflowPage /></SafeLazy>} />
      <Route path="m/uw-workflow/setup" element={<SafeLazy><UWWorkflowSetupPage /></SafeLazy>} />
      <Route path="m/uw-workflow/deployments" element={<SafeLazy><UWWorkflowDeploymentsPage /></SafeLazy>} />
      <Route path="m/uw-workflow/help" element={<SafeLazy><UWWorkflowHelpPage /></SafeLazy>} />

      {/* HI Decisioning — /m/hi-decisioning/* */}
      <Route path="m/hi-decisioning" element={<ModuleIndexRedirect />} />
      <Route path="m/hi-decisioning/guide/*" element={<SafeLazy><HIDecisioningHubPage /></SafeLazy>} />
      <Route path="m/hi-decisioning/hub" element={<SafeLazy><HIDecisioningHubPage /></SafeLazy>} />
      <Route path="m/hi-decisioning/rules" element={<SafeLazy><HIDecisioningPage /></SafeLazy>} />
      <Route path="m/hi-decisioning/rules/:ruleId" element={<SafeLazy><HIDecisioningPage /></SafeLazy>} />
      <Route path="m/hi-decisioning/setup" element={<SafeLazy><HIDecisioningSetupPage /></SafeLazy>} />
      <Route path="m/hi-decisioning/deployments" element={<SafeLazy><HIDecisioningDeploymentsPage /></SafeLazy>} />
      <Route path="m/hi-decisioning/help" element={<SafeLazy><HIDecisioningHelpPage /></SafeLazy>} />

      {/* Form Builder — /m/form-builder/* */}
      <Route path="m/form-builder" element={<ModuleIndexRedirect />} />
      <Route path="m/form-builder/guide/*" element={<SafeLazy><FormBuilderOverviewPage /></SafeLazy>} />
      <Route path="m/form-builder/hub" element={<SafeLazy><FormBuilderHubPage /></SafeLazy>} />
      <Route path="m/form-builder/forms" element={<SafeLazy><FormBuilderPage /></SafeLazy>} />
      <Route path="m/form-builder/forms/:formId" element={<SafeLazy><FormBuilderDetailPage /></SafeLazy>} />
      <Route path="m/form-builder/templates" element={<SafeLazy><FormTemplatesPage /></SafeLazy>} />
      <Route path="m/form-builder/tokens" element={<SafeLazy><FormBuilderTokensPage /></SafeLazy>} />
      <Route path="m/form-builder/setup" element={<SafeLazy><FormBuilderSetupPage /></SafeLazy>} />
      <Route path="m/form-builder/deployments" element={<SafeLazy><FormBuilderDeploymentsPage /></SafeLazy>} />
      <Route path="m/form-builder/help" element={<SafeLazy><FormBuilderHelpPage /></SafeLazy>} />

      {/* DataTable — /m/datatable/* */}
      <Route path="m/datatable" element={<Navigate to="/m/datatable/tables" replace />} />
      <Route path="m/datatable/tables" element={<DataTableDemoPage />} />
      <Route path="m/datatable/tables/:tableId" element={<DataTableDemoPage />} />
      <Route path="m/datatable/setup" element={<SafeLazy><DataTableSetupPage /></SafeLazy>} />

      {/* Workflow Engine — /m/workflow-engine/* */}
      <Route path="m/workflow-engine" element={<SafeLazy><WorkflowEngineHubPage /></SafeLazy>} />
      <Route path="m/workflow-engine/guide/*" element={<SafeLazy><WorkflowEngineHubPage /></SafeLazy>} />
      <Route path="m/workflow-engine/hub" element={<SafeLazy><WorkflowEngineHubPage /></SafeLazy>} />
      <Route path="m/workflow-engine/designer" element={<SafeLazy><WorkflowDesignerPage /></SafeLazy>} />
      <Route path="m/workflow-engine/designer/:processHashId" element={<SafeLazy><WorkflowDesignerPage /></SafeLazy>} />
      <Route path="m/workflow-engine/filters" element={<SafeLazy><WorkflowFiltersPage /></SafeLazy>} />
      <Route path="m/workflow-engine/queues" element={<SafeLazy><WorkflowQueuesPage /></SafeLazy>} />
      <Route path="m/workflow-engine/pipelines" element={<SafeLazy><WorkflowPipelinesPage /></SafeLazy>} />
      <Route path="m/workflow-engine/setup" element={<SafeLazy><WorkflowSetupPage /></SafeLazy>} />
      <Route path="m/workflow-engine/deployments" element={<SafeLazy><WorkflowDeploymentsPage /></SafeLazy>} />

      {/* Jayna — /m/jayna/* */}
      <Route path="m/jayna" element={<SafeLazy><JaynaHubPage /></SafeLazy>} />
      <Route path="m/jayna/guide/*" element={<SafeLazy><JaynaHubPage /></SafeLazy>} />
      <Route path="m/jayna/hub" element={<SafeLazy><JaynaHubPage /></SafeLazy>} />
      <Route path="m/jayna/agents/new" element={<SafeLazy><JaynaAgentCreatePage /></SafeLazy>} />
      <Route path="m/jayna/agents/:id/edit" element={<SafeLazy><JaynaAgentEditPage /></SafeLazy>} />
      <Route path="m/jayna/agents/:id" element={<SafeLazy><JaynaAgentDetailPage /></SafeLazy>} />
      <Route path="m/jayna/agents" element={<SafeLazy><JaynaAgentsPage /></SafeLazy>} />
      <Route path="m/jayna/workflows/new" element={<SafeLazy><JaynaWorkflowCreatePage /></SafeLazy>} />
      <Route path="m/jayna/workflows/:id" element={<SafeLazy><JaynaWorkflowDetailPage /></SafeLazy>} />
      <Route path="m/jayna/workflows" element={<SafeLazy><JaynaWorkflowsPage /></SafeLazy>} />
      <Route path="m/jayna/calls" element={<SafeLazy><JaynaCallHistoryPage /></SafeLazy>} />
      <Route path="m/jayna/test-call" element={<SafeLazy><JaynaTestCallPage /></SafeLazy>} />
      <Route path="m/jayna/setup" element={<SafeLazy><JaynaSetupPage /></SafeLazy>} />
      <Route path="m/jayna/deployments" element={<SafeLazy><JaynaDeploymentsPage /></SafeLazy>} />

      {/* Legacy aliases retired on 2026-04-20 (US-RT-2093). Canonical paths
          now served by explicit /m/<slug>/... Routes above and by the
          ManifestRouter catch-all at /m/:slug/. Retired redirects:
            /app/pcg4/configurations               -> /m/pcg4/configs
            /app/pcg4/configurations/new           -> /m/pcg4/configs/new
            /app/pcg4/configurations/:configId     -> /m/pcg4/configs/:configId
            /app/pcg4/reference-library            -> /m/pcg4/refs
            /app/pcg4/hub                          -> /m/pcg4/hub
            /app/pcg4/guide/(splat)                -> /m/pcg4/guide
            /app/pcg4/overview                     -> /m/pcg4/guide
            /app/pcg4/coverage-mapper              -> /m/pcg4/coverage-mapper
            /app/pcg4/encounters                   -> /m/pcg4/encounters
            /app/pcg4/deployments                  -> /m/pcg4/deployments
            /app/pcg4/setup                        -> /m/pcg4/setup
            /app/pcg4/pricing                      -> /m/pcg4/pricing
            /app/pcg4/configurations-fb            -> /m/pcg4/configs
            /app/pcg4/help                         -> /m/pcg4/hub
            /app/hi-quotation/(splat)              -> /m/hi-quotation/quotes
            /app/uw-workflow/(splat)               -> /m/uw-workflow/queues
            /app/hi-decisioning/(splat)            -> /m/hi-decisioning/rules
            /app/form-builder/(splat)              -> /m/form-builder/forms
      */}

      {/* Organization Directory (own section) */}
      <Route path="directory" element={<SafeLazy><DirectoryPage /></SafeLazy>} />
      <Route path="directory/guide/*" element={<SafeLazy><DirectoryHubPage /></SafeLazy>} />
      <Route path="directory/hub" element={<SafeLazy><DirectoryHubPage /></SafeLazy>} />
      <Route path="directory/setup" element={<SafeLazy><DirectorySetupPage /></SafeLazy>} />
      <Route path="directory/deployments" element={<SafeLazy><DirectoryDeploymentsPage /></SafeLazy>} />

      {/* support-center/* routes removed 2026-04-23 (Soldier AX J62/J63).
          Canonical help/support UI is provided by zorbit-adm-help_support registered module at /m/help-support/*.
          Video manifests preserved in src/data/video-manifests/platform-tour.ts. */}

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
      {/* Canonical route is /m/module-registry/modules (Zorbit URI convention). */}
      {/* /admin/modules kept as a redirect-quality alias for bookmarks during migration. */}
      <Route path="m/module-registry/modules" element={<SafeLazy><ModuleRegistryPage /></SafeLazy>} />
      <Route path="admin/modules" element={<SafeLazy><ModuleRegistryPage /></SafeLazy>} />

      {/* Manifest-driven catch-all: /m/:slug/* routes resolve to the
          feComponent declared by the matching nav item's manifest.
          See PLAN-manifest-fe-component-resolver.md (US-FC-2098). This
          route MUST come after every explicit /m/... Route above so
          specific routes win. */}
      <Route path="m/:slug/*" element={<SafeLazy><ManifestRouter /></SafeLazy>} />
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
      <Route path="hi-uw-decisioning/setup" element={<SafeLazy><HIDecisioningSetupPage /></SafeLazy>} />
      <Route path="hi-uw-decisioning/deployments" element={<SafeLazy><HIDecisioningDeploymentsPage /></SafeLazy>} />
      <Route path="fee-management/setup" element={<SafeLazy><FeeManagementSetupPage /></SafeLazy>} />
      <Route path="fee-management/deployments" element={<SafeLazy><FeeManagementDeploymentsPage /></SafeLazy>} />

      {/* Admin — Setup & Deployments */}
      <Route path="admin/setup" element={<SafeLazy><AdminSetupPage /></SafeLazy>} />
      <Route path="admin/deployments" element={<SafeLazy><AdminDeploymentsPage /></SafeLazy>} />

      {/* Business Modules — Retail Insurance */}
      <Route path="uw-workflow" element={<SafeLazy><UWWorkflowPage /></SafeLazy>} />
      <Route path="uw-workflow/guide/*" element={<SafeLazy><UWWorkflowHubPage /></SafeLazy>} />
      <Route path="uw-workflow/hub" element={<SafeLazy><UWWorkflowHubPage /></SafeLazy>} />
      <Route path="uw-workflow/help" element={<SafeLazy><UWWorkflowHelpPage /></SafeLazy>} />
      <Route path="uw-workflow/*" element={<SafeLazy><UWWorkflowPage /></SafeLazy>} />
      <Route path="hi-uw-decisioning" element={<SafeLazy><HIDecisioningPage /></SafeLazy>} />
      <Route path="hi-uw-decisioning/guide/*" element={<SafeLazy><HIDecisioningHubPage /></SafeLazy>} />
      <Route path="hi-uw-decisioning/hub" element={<SafeLazy><HIDecisioningHubPage /></SafeLazy>} />
      <Route path="hi-uw-decisioning/help" element={<SafeLazy><HIDecisioningHelpPage /></SafeLazy>} />
      <Route path="hi-uw-decisioning/*" element={<SafeLazy><HIDecisioningPage /></SafeLazy>} />
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

      {/* PFS Module Setup */}
      <Route path="white-label/setup" element={<SafeLazy><WhiteLabelSetupPage /></SafeLazy>} />
      <Route path="doc-generator/setup" element={<SafeLazy><DocGeneratorSetupPage /></SafeLazy>} />

      {/* Broker Dashboard removed 2026-04-23 (Soldier AX J62/J63) — canonical is /m/broker/* via zorbit-app-broker registered module */}

      {/* Channel Analytics */}
      <Route path="analytics/channels" element={<SafeLazy><ChannelAnalyticsPage /></SafeLazy>} />

      {/* Verification */}
      <Route path="verification/help" element={<SafeLazy><VerificationHelpPage /></SafeLazy>} />

      {/* Legacy aliases retired on 2026-04-20 (US-RT-2093). Canonical paths:
            /products                       -> /m/pcg4/configs
            /products/designer              -> /m/pcg4/configs/new
            /products/encounters            -> /m/pcg4/encounters
            /products/setup                 -> /m/pcg4/setup
            /pcg4                           -> /m/pcg4/configs
            /pcg4/configurator              -> /m/pcg4/configs/new
            /pcg4/configurator/:configId    -> /m/pcg4/configs/:configId
          /products/rating|rules|forms kept as NotFoundPage stubs — no canonical equivalent yet. */}
      <Route path="products/rating" element={<NotFoundPage />} />
      <Route path="products/rules" element={<NotFoundPage />} />
      <Route path="products/forms" element={<NotFoundPage />} />

      <Route path="demo" element={<DemoPage />} />
      <Route path="demo/:id" element={<DemoPage />} />
      <Route path="dashboard-view" element={<DashboardViewPage />} />
      <Route path="dashboard-designer" element={<DashboardDesignerPage />} />
      <Route path="demo-training" element={<DemoTrainingCenter />} />
      <Route path="demo-training/segments/new" element={<DemoSegmentEditor />} />
      <Route path="demo-training/segments/:id/edit" element={<DemoSegmentEditor />} />
      <Route path="data-table-demo" element={<DataTableDemoPage />} />
      <Route path="data-table-demo/setup" element={<SafeLazy><DataTableSetupPage /></SafeLazy>} />
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
      {/* Initialise platform WebSocket events (MODULE_REGISTERED / MODULE_UPDATED) */}
      <PlatformEventsInit />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/no-access" element={<NoAccessPage />} />
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

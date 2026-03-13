import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/shared/Toast';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import RolesPage from './pages/roles/RolesPage';
import CustomersPage from './pages/customers/CustomersPage';
import AuditPage from './pages/audit/AuditPage';
import MessagingPage from './pages/messaging/MessagingPage';
import NavigationAdminPage from './pages/navigation-admin/NavigationAdminPage';
import PiiVaultPage from './pages/pii-vault/PiiVaultPage';
import ApiDocsPage from './pages/api-docs/ApiDocsPage';
import SettingsPage from './pages/settings/SettingsPage';
import DemoPage from './pages/demo/DemoPage';
import DemoTrainingCenter from './pages/DemoTrainingCenter/DemoTrainingCenter';
import DemoSegmentEditor from './pages/DemoSegmentEditor/DemoSegmentEditor';
import DashboardViewPage from './pages/DashboardView/DashboardViewPage';
import DashboardDesignerPage from './pages/DashboardDesigner/DashboardDesignerPage';
import DataTableDemoPage from './pages/data-table-demo/DataTableDemoPage';
import StepperDemoPage from './pages/stepper-demo/StepperDemoPage';
import TreePickerDemoPage from './pages/tree-picker-demo/TreePickerDemoPage';
import PCG4DashboardPage from './pages/pcg4/PCG4DashboardPage';
import PCG4ConfiguratorPage from './pages/pcg4/PCG4ConfiguratorPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('zorbit_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Shared page routes — used both at root level (/) and under /org/:orgId/.
 * The navigation service returns org-prefixed routes (e.g. /org/O-OZPY/users)
 * while legacy bookmarks may use bare paths (e.g. /users).
 * Both work identically — the org context comes from the JWT, not the URL.
 */
function PageRoutes() {
  return (
    <>
      <Route index element={<DashboardPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="dashboard/designer" element={<DashboardDesignerPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="organizations" element={<OrganizationsPage />} />
      <Route path="roles" element={<RolesPage />} />
      <Route path="privileges" element={<RolesPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="audit" element={<AuditPage />} />
      <Route path="audit/logs" element={<AuditPage />} />
      <Route path="messaging" element={<MessagingPage />} />
      <Route path="messaging/topics" element={<MessagingPage />} />
      <Route path="messaging/events" element={<MessagingPage />} />
      <Route path="navigation/menus" element={<NavigationAdminPage />} />
      <Route path="navigation/routes" element={<NavigationAdminPage />} />
      <Route path="navigation" element={<NavigationAdminPage />} />
      <Route path="pii-vault" element={<PiiVaultPage />} />
      <Route path="pii-vault/tokens" element={<PiiVaultPage />} />
      <Route path="api-docs" element={<ApiDocsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="settings/general" element={<SettingsPage />} />
      <Route path="settings/secrets" element={<SettingsPage />} />
      <Route path="admin/platform" element={<DashboardPage />} />
      <Route path="admin/licensing" element={<NotFoundPage />} />
      <Route path="products" element={<PCG4DashboardPage />} />
      <Route path="products/designer" element={<PCG4ConfiguratorPage />} />
      <Route path="products/encounters" element={<NotFoundPage />} />
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
      <Route path="stepper-demo" element={<StepperDemoPage />} />
      <Route path="tree-picker-demo" element={<TreePickerDemoPage />} />
      <Route path="pcg4" element={<PCG4DashboardPage />} />
      <Route path="pcg4/configurator" element={<PCG4ConfiguratorPage />} />
      <Route path="pcg4/configurator/:configId" element={<PCG4ConfiguratorPage />} />
      {/* Catch-all: show Not Found page instead of silent redirect */}
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
        {/* Org-prefixed routes from navigation service menu */}
        <Route
          path="/org/:orgId"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {PageRoutes()}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

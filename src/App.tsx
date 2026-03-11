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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('zorbit_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="messaging" element={<MessagingPage />} />
          <Route path="navigation" element={<NavigationAdminPage />} />
          <Route path="pii-vault" element={<PiiVaultPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="demo/:id" element={<DemoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

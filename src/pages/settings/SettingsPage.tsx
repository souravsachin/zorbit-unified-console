import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SettingsPage: React.FC = () => {
  const { user, orgId } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">General Settings</h1>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">User Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Display Name</label>
            <p className="font-medium">{user?.displayName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="font-medium">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{user?.id || 'N/A'}</code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Organization ID</label>
            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{orgId}</code>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Application Configuration</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500">Theme</span>
            <span className="text-sm">System default</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500">Language</span>
            <span className="text-sm">English</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500">Timezone</span>
            <span className="text-sm">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500">Date Format</span>
            <span className="text-sm">DD/MM/YYYY</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-500">Notifications</span>
            <span className="text-sm">Enabled</span>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Security</h2>
        <Link
          to="/settings/security"
          className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Two-Factor Authentication (MFA)</p>
              <p className="text-xs text-gray-500">Protect your account with Google Authenticator or any TOTP app</p>
            </div>
          </div>
          <span className="text-sm text-primary-600 group-hover:underline">Manage</span>
        </Link>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Session</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500">Authentication</span>
            <span className="text-sm text-green-600">Active (JWT)</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-500">Token Expiry</span>
            <span className="text-sm">1 hour</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

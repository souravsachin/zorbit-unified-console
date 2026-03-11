import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config';

const SettingsPage: React.FC = () => {
  const { user, orgId } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

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
        <h2 className="font-semibold text-lg">API Endpoints</h2>
        <div className="space-y-2">
          {Object.entries(API_CONFIG).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm font-medium text-gray-500">{key}</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{value}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

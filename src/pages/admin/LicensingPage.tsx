import React from 'react';
import { Key, Clock } from 'lucide-react';

const LicensingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
          <Key className="w-7 h-7 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Licensing</h1>
          <p className="text-sm text-gray-500">Platform licensing and subscription management</p>
        </div>
      </div>

      <div className="card p-8 text-center">
        <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Coming Soon</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          The Licensing module will provide license key management, subscription tracking,
          feature flag control, and usage metering for the Zorbit platform.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Planned Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-sm mb-1">License Key Management</h3>
            <p className="text-xs text-gray-500">Generate, activate, and revoke license keys per organization</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-sm mb-1">Subscription Tracking</h3>
            <p className="text-xs text-gray-500">Track subscription tiers, renewal dates, and billing cycles</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-sm mb-1">Feature Flags</h3>
            <p className="text-xs text-gray-500">Control feature access per organization and subscription tier</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-sm mb-1">Usage Metering</h3>
            <p className="text-xs text-gray-500">Track API calls, storage, and compute usage per organization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensingPage;

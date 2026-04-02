import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const SecretsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
          <Lock className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Secrets Management</h1>
          <p className="text-sm text-gray-500">Manage platform secrets and encryption keys</p>
        </div>
      </div>

      <div className="card p-6 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-3">
          <ShieldAlert size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Secrets are managed via environment variables</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Platform secrets (JWT_SECRET, PII_ENCRYPTION_KEY, database credentials, OAuth client secrets)
              are stored as environment variables on the server and are not accessible through the UI.
              Contact your platform administrator for secret management.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Secret Categories</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-sm font-medium">JWT Signing Keys</span>
              <p className="text-xs text-gray-500 mt-0.5">Used for token signing and verification</p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Configured</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-sm font-medium">PII Vault Encryption Keys</span>
              <p className="text-xs text-gray-500 mt-0.5">AES-256-GCM keys for PII encryption at rest</p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Configured</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-sm font-medium">OAuth Client Secrets</span>
              <p className="text-xs text-gray-500 mt-0.5">Google, GitHub, LinkedIn provider secrets</p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Configured</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-sm font-medium">Database Credentials</span>
              <p className="text-xs text-gray-500 mt-0.5">PostgreSQL and MongoDB connection strings</p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Configured</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <span className="text-sm font-medium">Kafka Credentials</span>
              <p className="text-xs text-gray-500 mt-0.5">Broker connection and SASL credentials</p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Configured</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretsPage;

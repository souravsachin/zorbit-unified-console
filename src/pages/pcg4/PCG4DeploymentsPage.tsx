import React from 'react';
import {
  Rocket,
  Server,
  Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const COLUMNS = ['Environment', 'Type', 'Region', 'Status', 'Deployed Configs'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4DeploymentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deployments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Publish configurations to target environments
          </p>
        </div>
        <div className="relative group">
          <button
            disabled
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <Plus size={16} className="mr-2" />
            Deploy Configuration
          </button>
          <div className="absolute right-0 top-full mt-1 px-3 py-1.5 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Coming soon
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {COLUMNS.map((col) => (
                  <th key={col} className="px-4 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Empty state row */}
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <Server size={24} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      No environments configured
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Connect to the platform environment registry to start deploying configurations.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Info section */}
      <div className="card p-6">
        <div className="flex items-start space-x-3">
          <Rocket size={20} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">About Deployments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              The Deployments page lets you publish approved configurations to target environments
              (development, staging, production). Each deployment creates an immutable snapshot of the
              configuration that can be rolled back if needed. Environment connections are managed
              through the platform environment registry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCG4DeploymentsPage;

import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const PCG4PricingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Module Pricing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          PCG4 Product Configurator pricing and licensing
        </p>
      </div>

      {/* Coming Soon card */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card p-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Lock size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Pricing and licensing details for the PCG4 Product Configurator module will be available here.
          </p>

          {/* Access restricted note */}
          <div className="flex items-start space-x-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300 text-left leading-relaxed">
              This page is access-restricted. Contact your administrator for pricing details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCG4PricingPage;

import React, { useState } from 'react';
import {
  Library,
  Upload,
  FileText,
  Building2,
  Globe,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = 'platform' | 'organization';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'platform', label: 'Platform Library', icon: Globe },
  { key: 'organization', label: 'Organization Library', icon: Building2 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4ReferenceLibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('platform');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reference Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize real-world insurance policy documents
          </p>
        </div>
        <div className="relative group">
          <button
            disabled
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <Upload size={16} className="mr-2" />
            Upload Document
          </button>
          <div className="absolute right-0 top-full mt-1 px-3 py-1.5 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Coming soon
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Empty state */}
      <div className="card">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <FileText size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
            No documents yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Upload your first policy PDF to get started with the{' '}
            {activeTab === 'platform' ? 'Platform' : 'Organization'} Library.
          </p>
          <div className="relative group">
            <button
              disabled
              className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium cursor-not-allowed hover:border-gray-400"
            >
              <Upload size={16} className="mr-2" />
              Upload Document
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-3 py-1.5 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Coming soon
            </div>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="card p-6">
        <div className="flex items-start space-x-3">
          <Library size={20} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">About the Reference Library</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              The Reference Library lets you store and organize real-world insurance policy documents
              (PDFs, Word files). These documents serve as the source-of-truth when building configurations
              in the Coverage Mapper. The Platform Library contains shared templates; the Organization
              Library is specific to your organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCG4ReferenceLibraryPage;

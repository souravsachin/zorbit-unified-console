import React from 'react';
import {
  GitCompare,
  FileText,
  FolderTree,
  Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Coverage legend items
// ---------------------------------------------------------------------------

const LEGEND_ITEMS = [
  { label: 'Mapped', color: 'bg-green-500', desc: 'Fully mapped to configuration' },
  { label: 'Partial', color: 'bg-amber-500', desc: 'Partially mapped, needs review' },
  { label: 'Gap', color: 'bg-red-500', desc: 'Not mapped — coverage gap' },
  { label: 'Informational', color: 'bg-gray-400', desc: 'Reference only, no mapping needed' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4CoverageMapperPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coverage Mapper</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Map policy documents to configurations
          </p>
        </div>
        <div className="relative group">
          <button
            disabled
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <Plus size={16} className="mr-2" />
            Start New Mapping
          </button>
          <div className="absolute right-0 top-full mt-1 px-3 py-1.5 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Coming soon
          </div>
        </div>
      </div>

      {/* Split pane mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: PDF Viewer */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <FileText size={16} className="text-gray-500" />
            <span className="text-sm font-medium">PDF Viewer</span>
          </div>
          <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 mb-3">
                <FileText size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Policy PDF will render here
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Select a document from the Reference Library
              </p>
            </div>
          </div>
        </div>

        {/* Right: Configuration Tree */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <FolderTree size={16} className="text-gray-500" />
            <span className="text-sm font-medium">Configuration Tree</span>
          </div>
          <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 mb-3">
                <FolderTree size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configuration tree will render here
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Benefits, encounters, and rules hierarchy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage legend bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Coverage Legend
          </span>
          <div className="flex items-center space-x-6">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center space-x-2" title={item.desc}>
                <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="card p-6">
        <div className="flex items-start space-x-3">
          <GitCompare size={20} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">About the Coverage Mapper</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              The Coverage Mapper lets you place a policy document side-by-side with a configuration
              tree and visually map clauses to benefits, encounters, and rules. Highlights indicate
              coverage completeness: green for fully mapped, amber for partial, red for gaps, and grey
              for informational sections that don't require mapping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCG4CoverageMapperPage;

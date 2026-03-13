import React from 'react';
import { List, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '../../types/dataTable';

interface ViewToggleProps {
  modes: ViewMode[];
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ modes, active, onChange }) => {
  if (modes.length <= 1) return null;

  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {modes.map((mode) => {
        const isActive = mode === active;
        const Icon = mode === 'list' ? List : LayoutGrid;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`px-3 py-1.5 flex items-center space-x-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={mode === 'list' ? 'List View' : 'Grid View'}
          >
            <Icon size={16} />
            <span className="hidden sm:inline capitalize">{mode}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;

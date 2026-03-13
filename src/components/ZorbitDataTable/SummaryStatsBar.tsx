import React from 'react';
import { Hash, List, Filter, Lock, type LucideIcon } from 'lucide-react';
import type { SummaryStat, StatColor } from '../../types/dataTable';

interface SummaryStatsBarProps {
  stats: SummaryStat[];
  values: Record<string, number>;
}

const colorMap: Record<StatColor, string> = {
  primary: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
  info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  success: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  neutral: 'text-gray-600 bg-gray-50 dark:bg-gray-700/20',
};

const iconMap: Record<string, LucideIcon> = {
  functions: Hash,
  view_list: List,
  filter_alt: Filter,
  lock: Lock,
};

const defaultStats: SummaryStat[] = [
  { key: 'total', label: 'Total Results', icon: 'functions', color: 'primary' },
  { key: 'page_count', label: 'This Page', icon: 'view_list', color: 'info' },
  { key: 'active_filters', label: 'Active Filters', icon: 'filter_alt', color: 'warning' },
  { key: 'locked', label: 'Locked', icon: 'lock', color: 'neutral' },
];

const SummaryStatsBar: React.FC<SummaryStatsBarProps> = ({ stats, values }) => {
  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {displayStats.map((stat) => {
        const Icon = iconMap[stat.icon || 'functions'] || Hash;
        const colors = colorMap[stat.color || 'primary'];
        const val = values[stat.key] ?? 0;
        return (
          <div key={stat.key} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5">{val.toLocaleString()}</p>
              </div>
              <div className={`p-2 rounded-lg ${colors}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryStatsBar;

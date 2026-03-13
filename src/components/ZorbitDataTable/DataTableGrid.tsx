import React from 'react';
import type { ColumnDef, ActionButton } from '../../types/dataTable';
import StatusBadgeEnhanced from './StatusBadgeEnhanced';
import { maskPiiValue } from './PiiMask';

// ---------------------------------------------------------------------------
// Grid Card
// ---------------------------------------------------------------------------

function formatValue(val: unknown, col: ColumnDef): React.ReactNode {
  if (val === null || val === undefined) return '';

  if (col.pii_sensitive) {
    return <span className="font-mono text-gray-500">{maskPiiValue(val, col.name)}</span>;
  }

  switch (col.type) {
    case 'enum':
    case 'badge':
      return <StatusBadgeEnhanced value={String(val)} enumValues={col.enum_values} />;
    case 'date':
    case 'datetime': {
      const d = new Date(String(val));
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    case 'number':
      return Number(val).toLocaleString();
    case 'currency': {
      const n = Number(val);
      const cur = col.format || 'USD';
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
      } catch {
        return `${cur} ${n.toLocaleString()}`;
      }
    }
    case 'boolean':
      return val ? 'Yes' : 'No';
    default:
      return String(val);
  }
}

interface DataTableGridProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: ActionButton[];
  loading?: boolean;
  emptyMessage?: string;
}

const DataTableGrid: React.FC<DataTableGridProps> = ({
  columns,
  data,
  onRowClick,
  actions,
  loading,
  emptyMessage = 'No results found.',
}) => {
  const visibleCols = columns.filter((c) => c.visible !== false);
  // Primary fields shown at the top of the card
  const primaryCols = visibleCols.slice(0, 3);
  // Secondary fields shown in the card body
  const secondaryCols = visibleCols.slice(3);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((row, idx) => (
        <div
          key={(row.id as string) || idx}
          className={`card p-4 ${
            onRowClick ? 'cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600' : ''
          } transition-all`}
          onClick={() => onRowClick?.(row)}
        >
          {/* Card header with primary fields */}
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1 flex-1 min-w-0">
              {primaryCols.map((col) => (
                <div key={col.name}>
                  {col === primaryCols[0] ? (
                    <p className="text-sm font-semibold truncate">
                      {formatValue(row[col.name], col)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formatValue(row[col.name], col)}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {/* Status badge if any enum/badge column exists in primary */}
            {primaryCols.find((c) => c.type === 'enum' || c.type === 'badge') && (
              <div className="ml-2 flex-shrink-0">
                {primaryCols
                  .filter((c) => c.type === 'enum' || c.type === 'badge')
                  .map((col) => (
                    <StatusBadgeEnhanced
                      key={col.name}
                      value={String(row[col.name] || '')}
                      enumValues={col.enum_values}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Secondary fields */}
          {secondaryCols.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1.5">
              {secondaryCols.map((col) => (
                <div key={col.name} className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{col.label}</span>
                  <span className="font-medium truncate ml-2 max-w-[60%] text-right">
                    {formatValue(row[col.name], col)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {actions && actions.length > 0 && (
            <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              {actions
                .filter((a) => !a.visible || a.visible(row))
                .map((a) => (
                  <button
                    key={a.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      a.onClick(row);
                    }}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                      a.variant === 'danger'
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : a.variant === 'primary'
                          ? 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                          : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DataTableGrid;

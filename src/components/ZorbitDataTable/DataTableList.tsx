import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import type { ColumnDef, SortState, ActionButton } from '../../types/dataTable';
import StatusBadgeEnhanced from './StatusBadgeEnhanced';
import { maskPiiValue } from './PiiMask';

// ---------------------------------------------------------------------------
// Cell Rendering
// ---------------------------------------------------------------------------

function formatDate(value: unknown, format?: string): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);

  if (format === 'relative') {
    const now = Date.now();
    const diff = now - d.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  // Default: DD MMM YYYY
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDatetime(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatNumber(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (isNaN(n)) return String(value);
  return n.toLocaleString();
}

function formatCurrency(value: unknown, format?: string): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (isNaN(n)) return String(value);
  const currency = format || 'USD';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

function renderCellContent(
  row: Record<string, unknown>,
  col: ColumnDef,
): React.ReactNode {
  const val = row[col.name];

  // PII masking
  if (col.pii_sensitive) {
    const masked = maskPiiValue(val, col.name);
    return <span className="font-mono text-gray-500" title="PII masked">{masked}</span>;
  }

  // By column type
  switch (col.type) {
    case 'enum':
    case 'badge':
      return <StatusBadgeEnhanced value={String(val || '')} enumValues={col.enum_values} />;

    case 'date':
      return <span className="tabular-nums">{formatDate(val, col.format)}</span>;

    case 'datetime':
      return <span className="tabular-nums">{formatDatetime(val)}</span>;

    case 'number':
      return <span className="tabular-nums">{formatNumber(val)}</span>;

    case 'currency':
      return <span className="tabular-nums">{formatCurrency(val, col.format)}</span>;

    case 'boolean':
      return val ? (
        <span className="text-green-600 font-medium">Yes</span>
      ) : (
        <span className="text-gray-400">No</span>
      );

    case 'link':
      return val ? (
        <a
          href={String(val)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {col.truncate ? String(val).slice(0, col.truncate) + '...' : String(val)}
        </a>
      ) : (
        ''
      );

    default: {
      // String type
      const str = val !== null && val !== undefined ? String(val) : '';
      if (col.truncate && str.length > col.truncate) {
        return <span title={str}>{str.slice(0, col.truncate)}...</span>;
      }
      return str;
    }
  }
}

// ---------------------------------------------------------------------------
// Sort Icon
// ---------------------------------------------------------------------------

function SortIcon({ col, sort }: { col: ColumnDef; sort?: SortState }) {
  if (!col.sortable && col.sortable !== undefined) return null;
  if (sort?.column === col.name) {
    return sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }
  return <ArrowUpDown size={12} className="opacity-30" />;
}

// ---------------------------------------------------------------------------
// Action Cell
// ---------------------------------------------------------------------------

function ActionCell({
  row,
  actions,
}: {
  row: Record<string, unknown>;
  actions: ActionButton[];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleActions = actions.filter((a) => !a.visible || a.visible(row));
  if (visibleActions.length === 0) return null;

  // Inline if 3 or fewer
  if (visibleActions.length <= 3) {
    return (
      <div className="flex items-center space-x-1">
        {visibleActions.map((a) => {
          const iconMap: Record<string, React.ReactNode> = {
            view: <Eye size={14} />,
            edit: <Pencil size={14} />,
            delete: <Trash2 size={14} />,
          };
          const variantClass =
            a.variant === 'danger'
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700';
          return (
            <button
              key={a.key}
              onClick={(e) => {
                e.stopPropagation();
                a.onClick(row);
              }}
              className={`p-1.5 rounded-lg transition-colors ${variantClass}`}
              title={a.label}
            >
              {iconMap[a.key] || <span className="text-xs">{a.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown for 4+
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]">
          {visibleActions.map((a) => (
            <button
              key={a.key}
              onClick={(e) => {
                e.stopPropagation();
                a.onClick(row);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                a.variant === 'danger' ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTableList Component
// ---------------------------------------------------------------------------

interface DataTableListProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  sort?: SortState;
  onSort: (column: string) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: ActionButton[];
  loading?: boolean;
  emptyMessage?: string;
}

const DataTableList: React.FC<DataTableListProps> = ({
  columns,
  data,
  sort,
  onSort,
  onRowClick,
  actions,
  loading,
  emptyMessage = 'No results found.',
}) => {
  const visibleCols = columns.filter((c) => c.visible !== false);

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-100 dark:bg-gray-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-6 py-3 space-x-4">
                {visibleCols.map((_, j) => (
                  <div key={j} className="h-3 bg-gray-200 dark:bg-gray-600 rounded flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
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
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              {visibleCols.map((col) => {
                const isSortable = col.sortable !== false;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';
                return (
                  <th
                    key={col.name}
                    className={`px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${alignClass} ${
                      isSortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => isSortable && onSort(col.name)}
                  >
                    <span className="inline-flex items-center space-x-1">
                      <span>{col.label}</span>
                      {isSortable && <SortIcon col={col} sort={sort} />}
                    </span>
                  </th>
                );
              })}
              {actions && actions.length > 0 && (
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, idx) => (
              <tr
                key={(row.id as string) || idx}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30' : ''
                } transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {visibleCols.map((col) => {
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                  return (
                    <td
                      key={col.name}
                      className={`px-4 py-3 text-sm ${alignClass} whitespace-nowrap`}
                    >
                      {renderCellContent(row, col)}
                    </td>
                  );
                })}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3 text-right">
                    <ActionCell row={row} actions={actions} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTableList;

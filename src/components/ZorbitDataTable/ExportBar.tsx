import React from 'react';
import { Download } from 'lucide-react';
import type { ExportFormat, ColumnDef } from '../../types/dataTable';
import { exportToCsv } from '../../api/dataTableApi';

interface ExportBarProps {
  formats: ExportFormat[];
  data: Record<string, unknown>[];
  columns: ColumnDef[];
  filename?: string;
}

const ExportBar: React.FC<ExportBarProps> = ({
  formats,
  data,
  columns,
  filename = 'export',
}) => {
  if (!formats || formats.length === 0) return null;

  const visibleCols = columns.filter((c) => c.visible !== false);

  const handleExport = (format: ExportFormat) => {
    if (format === 'csv') {
      exportToCsv(data, visibleCols, filename);
    }
    // Excel export would require a library (xlsx); CSV covers the core need
    if (format === 'excel') {
      // Fallback to CSV with .csv extension
      exportToCsv(data, visibleCols, filename);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {formats.map((fmt) => (
        <button
          key={fmt}
          onClick={() => handleExport(fmt)}
          disabled={data.length === 0}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={`Export as ${fmt.toUpperCase()}`}
        >
          <Download size={14} />
          <span>{fmt.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
};

export default ExportBar;

import React from 'react';
import { Widget } from '../../services/dashboard';

interface TableWidgetProps {
  widget: Widget;
}

const TableWidget: React.FC<TableWidgetProps> = ({ widget }) => {
  const config = widget.config || {};
  const headers = (config.headers as string[]) || ['Column 1', 'Column 2', 'Column 3'];
  const rows = (config.rows as string[][]) || [];

  return (
    <div className="h-full overflow-auto p-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-600">
            {headers.map((h, i) => (
              <th key={i} className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-2 py-3 text-center text-gray-400 text-xs">
                No data
              </td>
            </tr>
          )}
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1.5 text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableWidget;

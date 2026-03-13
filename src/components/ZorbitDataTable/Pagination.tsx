import React from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageSizes: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  pageSizes,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Page numbers to display (max 5 centered on current)
  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
      {/* Info */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {total > 0 ? `Showing ${from}-${to} of ${total.toLocaleString()} results` : 'No results'}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-primary-500"
        >
          {pageSizes.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((pn) => (
            <button
              key={pn}
              onClick={() => onPageChange(pn)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                pn === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {pn}
            </button>
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;

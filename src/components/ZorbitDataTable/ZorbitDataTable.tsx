// =============================================================================
// ZorbitDataTable — THE Crown Jewel Shared Component
// =============================================================================
// A single, highly configurable React component that takes a configuration
// object and renders a complete data view. Every business module uses this.
//
// ONE component + ONE backend + config = ALL views with zero code per new view.
// =============================================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import type {
  ZorbitDataTableProps,
  ViewMode,
  SortState,
  ActiveFilter,
  SortDirection,
} from '../../types/dataTable';
import { fetchDataTableData } from '../../api/dataTableApi';
import SummaryStatsBar from './SummaryStatsBar';
import ViewToggle from './ViewToggle';
import FilterBar from './FilterBar';
import TimeRangeBar from './TimeRangeBar';
import SearchBar from './SearchBar';
import DataTableList from './DataTableList';
import DataTableGrid from './DataTableGrid';
import ExportBar from './ExportBar';
import Pagination from './Pagination';

const ZorbitDataTable: React.FC<ZorbitDataTableProps> = ({
  config,
  dataEndpoint,
  orgId,
  userId,
  onRowClick,
  actions,
  title,
  createButton,
  lockedFilters,
  className,
}) => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.default_page_size || 25);
  const [sort, setSort] = useState<SortState | undefined>(
    config.default_sort_column
      ? { column: config.default_sort_column, direction: config.default_sort_direction || 'desc' }
      : undefined,
  );
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(
    config.view_modes?.[0] || 'list',
  );
  const [timeRange, setTimeRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchIdRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const templateVars: Record<string, string> = {};
      if (orgId) templateVars.org_id = orgId;
      if (userId) templateVars.user_id = userId;

      const result = await fetchDataTableData(config, {
        page,
        pageSize,
        sort,
        search: search || undefined,
        filters: activeFilters,
        lockedFilters,
        templateVars,
        endpointOverride: dataEndpoint,
        timeRange: timeRange !== 'all' ? timeRange : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      // Only apply if this is still the latest fetch
      if (fetchId === fetchIdRef.current) {
        setData(result.data);
        setTotal(result.total);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setData([]);
        setTotal(0);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    config,
    dataEndpoint,
    orgId,
    userId,
    page,
    pageSize,
    sort,
    search,
    activeFilters,
    lockedFilters,
    timeRange,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSort = useCallback(
    (column: string) => {
      setSort((prev) => {
        if (prev?.column === column) {
          const newDir: SortDirection = prev.direction === 'asc' ? 'desc' : 'asc';
          return { column, direction: newDir };
        }
        return { column, direction: 'asc' };
      });
      setPage(1);
    },
    [],
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleApplyFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setPage(1);
  }, []);

  const handleRemoveFilter = useCallback((column: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.column !== column));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
    setPage(1);
  }, []);

  const handleCustomDateApply = useCallback(() => {
    setPage(1);
    // Trigger refetch (dependencies already include dateFrom/dateTo)
  }, []);

  // ---------------------------------------------------------------------------
  // Summary Stats Values
  // ---------------------------------------------------------------------------

  const statsValues: Record<string, number> = {
    total,
    page_count: data.length,
    active_filters: activeFilters.length,
    locked: lockedFilters ? Object.keys(lockedFilters).length : 0,
  };

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const pageSizes = config.page_sizes || [10, 25, 50, 100];
  const viewModes = config.view_modes || ['list'];
  const exportFormats = config.export_formats || ['csv'];
  const isSearchable = config.searchable !== false;
  const emptyMsg = config.empty_state_message || 'No results found.';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Title + Create Button */}
      {(title || createButton) && (
        <div className="flex items-center justify-between">
          {title && (
            <h1 className="text-2xl font-bold">{title}</h1>
          )}
          {createButton && (
            <button
              onClick={createButton.onClick}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>{createButton.label}</span>
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {config.summary_stats && (
        <SummaryStatsBar stats={config.summary_stats} values={statsValues} />
      )}

      {/* Toolbar Row: View Toggle + Search + Time Range + Export */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle modes={viewModes} active={viewMode} onChange={setViewMode} />
          {isSearchable && (
            <SearchBar
              value={search}
              onChange={handleSearch}
              placeholder="Search across all fields..."
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {config.time_filter_column && (
            <TimeRangeBar
              presets={config.time_range_presets}
              active={timeRange}
              onPresetChange={handleTimeRangeChange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onCustomApply={handleCustomDateApply}
            />
          )}
          <ExportBar
            formats={exportFormats}
            data={data}
            columns={config.columns}
            filename={title?.replace(/\s+/g, '_').toLowerCase() || 'export'}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        columns={config.columns}
        filters={config.filters}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearFilters}
        data={data}
      />

      {/* Error State */}
      {error && (
        <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="text-sm text-red-700 underline mt-1">
            Retry
          </button>
        </div>
      )}

      {/* Data View */}
      {viewMode === 'list' ? (
        <DataTableList
          columns={config.columns}
          data={data}
          sort={sort}
          onSort={handleSort}
          onRowClick={onRowClick}
          actions={actions}
          loading={loading}
          emptyMessage={emptyMsg}
        />
      ) : (
        <DataTableGrid
          columns={config.columns}
          data={data}
          onRowClick={onRowClick}
          actions={actions}
          loading={loading}
          emptyMessage={emptyMsg}
        />
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        pageSizes={pageSizes}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default ZorbitDataTable;

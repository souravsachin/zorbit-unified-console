// =============================================================================
// ZorbitDataTable Demo Page
// =============================================================================
// Demonstrates all features of ZorbitDataTable with mock config and data.
// Runs fully standalone with no backend dependency using local mock data.
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import {
  SummaryStatsBar,
  ViewToggle,
  FilterBar,
  TimeRangeBar,
  SearchBar,
  DataTableList,
  DataTableGrid,
  ExportBar,
  Pagination,
} from '../../components/ZorbitDataTable';
import type {
  DataTableConfig,
  WorkflowQueueConfig,
  WorkflowQueueDef,
  ActionButton,
  ViewMode,
  SortState,
  ActiveFilter,
  SortDirection,
} from '../../types/dataTable';

// ---------------------------------------------------------------------------
// Mock Data Generator
// ---------------------------------------------------------------------------

const STATUSES = ['New', 'Active', 'Pending', 'Approved', 'Rejected', 'Completed'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function mockRow(i: number): Record<string, unknown> {
  const status = STATUSES[i % STATUSES.length];
  const dept = DEPARTMENTS[i % DEPARTMENTS.length];
  const priority = PRIORITIES[i % PRIORITIES.length];
  const created = new Date(Date.now() - i * 86400000 * Math.random());
  return {
    id: `REC-${String(1000 + i).slice(1)}${String.fromCharCode(65 + (i % 26))}`,
    name: `Record ${i + 1}`,
    email: `user${i + 1}@example.com`,
    phone: `+1555${String(1000000 + i).slice(1)}`,
    status,
    department: dept,
    priority,
    amount: Math.round(Math.random() * 50000 * 100) / 100,
    score: Math.round(Math.random() * 100),
    is_verified: i % 3 === 0,
    created_at: created.toISOString(),
    website: i % 5 === 0 ? `https://example.com/record/${i}` : null,
  };
}

const MOCK_DATA = Array.from({ length: 87 }, (_, i) => mockRow(i));

// ---------------------------------------------------------------------------
// Local data filter/sort/page engine
// ---------------------------------------------------------------------------

function applyLocalQuery(
  allData: Record<string, unknown>[],
  params: {
    page: number;
    pageSize: number;
    search?: string;
    sort?: SortState;
    filters?: ActiveFilter[];
    lockedFilters?: Record<string, unknown>;
  },
): { data: Record<string, unknown>[]; total: number } {
  let filtered = [...allData];

  // Locked filters
  if (params.lockedFilters) {
    for (const [key, val] of Object.entries(params.lockedFilters)) {
      if (Array.isArray(val)) {
        filtered = filtered.filter((r) => (val as string[]).includes(String(r[key])));
      } else if (val !== undefined) {
        filtered = filtered.filter((r) => r[key] === val);
      }
    }
  }

  // User filters
  if (params.filters) {
    for (const f of params.filters) {
      if (f.type === 'multiselect' && Array.isArray(f.value) && (f.value as string[]).length > 0) {
        filtered = filtered.filter((r) => (f.value as string[]).includes(String(r[f.column])));
      } else if (f.type === 'search' && f.value) {
        const term = String(f.value).toLowerCase();
        filtered = filtered.filter((r) => String(r[f.column] || '').toLowerCase().includes(term));
      } else if (f.type === 'range' && typeof f.value === 'object') {
        const range = f.value as { min?: string; max?: string };
        if (range.min) filtered = filtered.filter((r) => Number(r[f.column]) >= Number(range.min));
        if (range.max) filtered = filtered.filter((r) => Number(r[f.column]) <= Number(range.max));
      } else if (f.type === 'boolean' && f.value !== undefined) {
        filtered = filtered.filter((r) => r[f.column] === f.value);
      }
    }
  }

  // Global search
  if (params.search) {
    const term = params.search.toLowerCase();
    filtered = filtered.filter((r) =>
      Object.values(r).some((v) => v !== null && String(v).toLowerCase().includes(term)),
    );
  }

  // Sort
  if (params.sort) {
    const { column, direction } = params.sort;
    filtered.sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return direction === 'asc' ? cmp : -cmp;
    });
  }

  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);
  return { data, total };
}

// ---------------------------------------------------------------------------
// MockDataTable — ZorbitDataTable with local data instead of API calls
// ---------------------------------------------------------------------------

interface MockDataTableProps {
  allData: Record<string, unknown>[];
  config: DataTableConfig;
  title?: string;
  orgId?: string;
  userId?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: ActionButton[];
  createButton?: { label: string; onClick: () => void };
  lockedFilters?: Record<string, unknown>;
}

const MockDataTable: React.FC<MockDataTableProps> = ({
  allData,
  config,
  title,
  onRowClick,
  actions,
  createButton,
  lockedFilters,
}) => {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.default_page_size || 25);
  const [sort, setSort] = useState<SortState | undefined>(
    config.default_sort_column
      ? { column: config.default_sort_column, direction: (config.default_sort_direction || 'desc') as SortDirection }
      : undefined,
  );
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(config.view_modes?.[0] || 'list');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [timeRange, setTimeRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load data with simulated delay
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const result = applyLocalQuery(allData, {
        page,
        pageSize,
        search: search || undefined,
        sort,
        filters: activeFilters,
        lockedFilters,
      });
      setData(result.data);
      setTotal(result.total);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [allData, page, pageSize, sort, search, activeFilters, lockedFilters]);

  const handleSort = useCallback((col: string) => {
    setSort((prev) => {
      if (prev?.column === col) {
        return { column: col, direction: (prev.direction === 'asc' ? 'desc' : 'asc') as SortDirection };
      }
      return { column: col, direction: 'asc' as SortDirection };
    });
    setPage(1);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleApplyFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setPage(1);
  }, []);

  const handleRemoveFilter = useCallback((col: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.column !== col));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setPage(1);
  }, []);

  const statsValues = useMemo(() => ({
    total,
    page_count: data.length,
    active_filters: activeFilters.length,
    locked: lockedFilters ? Object.keys(lockedFilters).length : 0,
  }), [total, data.length, activeFilters.length, lockedFilters]);

  return (
    <div className="space-y-4">
      {(title || createButton) && (
        <div className="flex items-center justify-between">
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {createButton && (
            <button onClick={createButton.onClick} className="btn-primary flex items-center space-x-2">
              <Plus size={18} />
              <span>{createButton.label}</span>
            </button>
          )}
        </div>
      )}

      {config.summary_stats && (
        <SummaryStatsBar stats={config.summary_stats} values={statsValues} />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle modes={config.view_modes || ['list']} active={viewMode} onChange={setViewMode} />
          {config.searchable !== false && (
            <SearchBar value={search} onChange={handleSearch} placeholder="Search across all fields..." />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {config.time_filter_column && (
            <TimeRangeBar
              presets={config.time_range_presets}
              active={timeRange}
              onPresetChange={(v) => { setTimeRange(v); setPage(1); }}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onCustomApply={() => setPage(1)}
            />
          )}
          <ExportBar
            formats={config.export_formats || ['csv']}
            data={data}
            columns={config.columns}
            filename={title?.replace(/\s+/g, '_').toLowerCase() || 'export'}
          />
        </div>
      </div>

      <FilterBar
        columns={config.columns}
        filters={config.filters}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearFilters}
        data={data}
      />

      {viewMode === 'list' ? (
        <DataTableList
          columns={config.columns}
          data={data}
          sort={sort}
          onSort={handleSort}
          onRowClick={onRowClick}
          actions={actions}
          loading={loading}
          emptyMessage={config.empty_state_message}
        />
      ) : (
        <DataTableGrid
          columns={config.columns}
          data={data}
          onRowClick={onRowClick}
          actions={actions}
          loading={loading}
          emptyMessage={config.empty_state_message}
        />
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        pageSizes={config.page_sizes || [10, 25, 50, 100]}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Demo Config
// ---------------------------------------------------------------------------

const demoConfig: DataTableConfig = {
  columns: [
    { name: 'id', label: 'ID', type: 'string', width: '100px', filterable: false },
    { name: 'name', label: 'Name', type: 'string', filterable: true, searchable: true },
    {
      name: 'status',
      label: 'Status',
      type: 'enum',
      filterable: true,
      enum_values: [
        { value: 'New', label: 'New', color: '#2196F3' },
        { value: 'Active', label: 'Active', color: '#4CAF50' },
        { value: 'Pending', label: 'Pending', color: '#FFC107' },
        { value: 'Approved', label: 'Approved', color: '#4CAF50' },
        { value: 'Rejected', label: 'Rejected', color: '#F44336' },
        { value: 'Completed', label: 'Completed', color: '#9E9E9E' },
      ],
    },
    { name: 'department', label: 'Department', type: 'string', filterable: true },
    {
      name: 'priority',
      label: 'Priority',
      type: 'badge',
      filterable: true,
      enum_values: [
        { value: 'Low', label: 'Low', color: '#9E9E9E' },
        { value: 'Medium', label: 'Medium', color: '#2196F3' },
        { value: 'High', label: 'High', color: '#FFC107' },
        { value: 'Critical', label: 'Critical', color: '#F44336' },
      ],
    },
    { name: 'email', label: 'Email', type: 'string', pii_sensitive: true, filterable: false },
    { name: 'phone', label: 'Phone', type: 'string', pii_sensitive: true, visible: false, filterable: false },
    { name: 'amount', label: 'Amount', type: 'currency', format: 'USD', align: 'right', filterable: true },
    { name: 'score', label: 'Score', type: 'number', align: 'right', filterable: true },
    { name: 'is_verified', label: 'Verified', type: 'boolean', align: 'center', filterable: true },
    { name: 'created_at', label: 'Created', type: 'date', sortable: true },
    { name: 'website', label: 'Website', type: 'link', visible: false, truncate: 30 },
  ],
  summary_stats: [
    { key: 'total', label: 'Total Records', icon: 'functions', color: 'primary' },
    { key: 'page_count', label: 'This Page', icon: 'view_list', color: 'info' },
    { key: 'active_filters', label: 'Active Filters', icon: 'filter_alt', color: 'warning' },
    { key: 'locked', label: 'Locked Filters', icon: 'lock', color: 'neutral' },
  ],
  view_modes: ['list', 'grid'],
  export_formats: ['csv'],
  searchable: true,
  sortable: true,
  page_sizes: [10, 25, 50, 100],
  default_page_size: 10,
  default_sort_column: 'created_at',
  default_sort_direction: 'desc',
  time_filter_column: 'created_at',
  empty_state_message: 'No records match your criteria.',
  data_source: {
    endpoint_template: '/api/v1/O/{{org_id}}/demo/records',
    response_data_path: 'data',
    response_total_path: 'total',
  },
};

// ---------------------------------------------------------------------------
// Workflow Queue Demo Config
// ---------------------------------------------------------------------------

const workflowConfig: WorkflowQueueConfig = {
  queues: [
    { name: 'all', label: 'All Records', lockedFilters: {}, count: 87 },
    { name: 'new', label: 'New', lockedFilters: { status: ['New'] }, count: 15 },
    { name: 'active', label: 'Active', lockedFilters: { status: ['Active'] }, count: 14 },
    { name: 'pending', label: 'Pending Review', lockedFilters: { status: ['Pending'] }, count: 15 },
    { name: 'approved', label: 'Approved', lockedFilters: { status: ['Approved'] }, count: 14 },
    { name: 'rejected', label: 'Rejected', lockedFilters: { status: ['Rejected'] }, count: 15 },
    { name: 'completed', label: 'Completed', lockedFilters: { status: ['Completed'] }, count: 14 },
  ],
  tableConfig: demoConfig,
  dataEndpoint: '/api/v1/O/{{org_id}}/demo/records',
};

// ---------------------------------------------------------------------------
// Demo Actions
// ---------------------------------------------------------------------------

const demoActions: ActionButton[] = [
  { key: 'view', label: 'View', onClick: (row) => alert(`View: ${row.id}`) },
  { key: 'edit', label: 'Edit', variant: 'primary', onClick: (row) => alert(`Edit: ${row.id}`) },
  {
    key: 'delete',
    label: 'Delete',
    variant: 'danger',
    onClick: (row) => alert(`Delete: ${row.id}`),
    visible: (row) => row.status !== 'Completed',
  },
];

// ---------------------------------------------------------------------------
// Mock Workflow Queue (local data)
// ---------------------------------------------------------------------------

const MockWorkflowQueue: React.FC<{
  allData: Record<string, unknown>[];
  config: WorkflowQueueConfig;
  orgId?: string;
  actions?: ActionButton[];
  onRowClick?: (row: Record<string, unknown>) => void;
  title?: string;
}> = ({ allData, config, orgId, actions, onRowClick, title }) => {
  const [activeQueue, setActiveQueue] = useState(config.queues[0]);

  const queueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of config.queues) {
      if (Object.keys(q.lockedFilters).length === 0) {
        counts[q.name] = allData.length;
      } else {
        let filtered = allData;
        for (const [key, val] of Object.entries(q.lockedFilters)) {
          if (Array.isArray(val)) {
            filtered = filtered.filter((r) => (val as string[]).includes(String(r[key])));
          }
        }
        counts[q.name] = filtered.length;
      }
    }
    return counts;
  }, [allData, config.queues]);

  return (
    <div className="space-y-4">
      {title && <h1 className="text-2xl font-bold">{title}</h1>}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-1">
        {config.queues.map((queue) => {
          const isActive = queue.name === activeQueue.name;
          return (
            <button
              key={queue.name}
              onClick={() => setActiveQueue(queue)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-primary-600 border border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-800 -mb-px'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>{queue.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {queueCounts[queue.name] ?? 0}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <MockDataTable
        key={activeQueue.name}
        allData={allData}
        config={config.tableConfig}
        orgId={orgId}
        onRowClick={onRowClick}
        actions={actions}
        lockedFilters={activeQueue.lockedFilters}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Demo Page
// ---------------------------------------------------------------------------

const DataTableDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'workflow'>('basic');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ZorbitDataTable Demo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            The crown jewel shared component -- 87 mock records, all features, zero backend.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'basic'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Basic Table
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'workflow'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Workflow Queues
          </button>
        </div>
      </div>

      {activeTab === 'basic' ? (
        <MockDataTable
          allData={MOCK_DATA}
          config={demoConfig}
          title="Demo Records"
          orgId="O-DEMO"
          actions={demoActions}
          onRowClick={(row) => console.log('Row clicked:', row)}
          createButton={{
            label: 'New Record',
            onClick: () => alert('Create new record'),
          }}
        />
      ) : (
        <MockWorkflowQueue
          allData={MOCK_DATA}
          config={workflowConfig}
          orgId="O-DEMO"
          actions={demoActions}
          onRowClick={(row) => console.log('Row clicked:', row)}
          title="Workflow Queues Demo"
        />
      )}
    </div>
  );
};

export default DataTableDemoPage;

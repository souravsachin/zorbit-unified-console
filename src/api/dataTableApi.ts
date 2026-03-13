// =============================================================================
// Zorbit Data Table — API Utilities
// =============================================================================
// Generic fetch function for the ZorbitDataTable component.
// Resolves endpoint templates, applies filters/sorting/pagination/search.
// =============================================================================

import api from '../services/api';
import type {
  DataTableConfig,
  DataTableApiResponse,
  SortState,
  ActiveFilter,
} from '../types/dataTable';

// ---------------------------------------------------------------------------
// Template Resolution
// ---------------------------------------------------------------------------

function resolveTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// ---------------------------------------------------------------------------
// Filter Serialization
// ---------------------------------------------------------------------------

function serializeFilters(
  filters: ActiveFilter[],
  lockedFilters?: Record<string, unknown>,
): Record<string, string> {
  const params: Record<string, string> = {};

  // Locked filters first
  if (lockedFilters) {
    for (const [key, val] of Object.entries(lockedFilters)) {
      if (Array.isArray(val)) {
        params[key] = val.join(',');
      } else if (val !== null && val !== undefined) {
        params[key] = String(val);
      }
    }
  }

  // User filters
  for (const f of filters) {
    if (f.type === 'multiselect' && Array.isArray(f.value)) {
      params[f.column] = (f.value as string[]).join(',');
    } else if (f.type === 'range' && typeof f.value === 'object' && f.value !== null) {
      const range = f.value as { min?: number; max?: number; operator?: string };
      if (range.operator === 'between' || (!range.operator && range.min !== undefined && range.max !== undefined)) {
        params[`${f.column}_min`] = String(range.min ?? '');
        params[`${f.column}_max`] = String(range.max ?? '');
      } else if (range.operator && range.min !== undefined) {
        params[`${f.column}_${range.operator}`] = String(range.min);
      }
    } else if (f.type === 'daterange' && typeof f.value === 'object' && f.value !== null) {
      const range = f.value as { from?: string; to?: string };
      if (range.from) params[`${f.column}_from`] = range.from;
      if (range.to) params[`${f.column}_to`] = range.to;
    } else if (f.type === 'boolean') {
      params[f.column] = String(f.value);
    } else if (f.type === 'search' && f.value) {
      params[f.column] = String(f.value);
    }
  }

  return params;
}

// ---------------------------------------------------------------------------
// Main Fetch Function
// ---------------------------------------------------------------------------

export async function fetchDataTableData(
  config: DataTableConfig,
  options: {
    page: number;
    pageSize: number;
    sort?: SortState;
    search?: string;
    filters: ActiveFilter[];
    lockedFilters?: Record<string, unknown>;
    templateVars?: Record<string, string>;
    endpointOverride?: string;
    timeRange?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<DataTableApiResponse> {
  const ds = config.data_source;

  // Resolve endpoint
  const template = options.endpointOverride || ds.endpoint_template;
  const url = resolveTemplate(template, options.templateVars || {});

  // Build query params
  const params: Record<string, string> = {};

  // Static query params
  if (ds.query_params) {
    Object.assign(params, ds.query_params);
  }

  // Pagination
  params[ds.page_param || 'page'] = String(options.page);
  params[ds.page_size_param || 'limit'] = String(options.pageSize);

  // Sort
  if (options.sort) {
    params[ds.sort_param || 'sort'] = options.sort.column;
    params[ds.sort_dir_param || 'order'] = options.sort.direction;
  }

  // Global search
  if (options.search) {
    params[ds.search_param || 'search'] = options.search;
  }

  // Time range
  if (options.timeRange && options.timeRange !== 'all') {
    params[ds.time_range_param || 'time_range'] = options.timeRange;
  }
  if (options.dateFrom) {
    params[ds.date_from_param || 'from'] = options.dateFrom;
  }
  if (options.dateTo) {
    params[ds.date_to_param || 'to'] = options.dateTo;
  }

  // Filters
  const filterParams = serializeFilters(options.filters, options.lockedFilters);
  Object.assign(params, filterParams);

  // Execute request
  const method = ds.method || 'GET';
  let response;

  if (method === 'POST') {
    response = await api.post(url, params);
  } else {
    response = await api.get(url, { params });
  }

  const body = response.data;

  // Extract data and total using configured paths
  const dataPath = ds.response_data_path || 'data';
  const totalPath = ds.response_total_path || 'total';

  const data = (getByPath(body, dataPath) as Record<string, unknown>[]) || [];
  const total = (getByPath(body, totalPath) as number) || 0;

  return {
    data: Array.isArray(data) ? data : [],
    total: typeof total === 'number' ? total : 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

export function exportToCsv(
  data: Record<string, unknown>[],
  columns: { name: string; label: string }[],
  filename: string,
): void {
  const headers = columns.map((c) => c.label);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.name];
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Escape CSV values
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }),
  );

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

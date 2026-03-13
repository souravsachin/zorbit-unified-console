// =============================================================================
// Zorbit Data Table — Type Definitions
// =============================================================================
// Full TypeScript interfaces for the database-driven configurable data table.
// Mirrors the JSON schema at zorbit-core/schemas/data-table/data-table-config.schema.json
// =============================================================================

// ---------------------------------------------------------------------------
// Column Types
// ---------------------------------------------------------------------------

export type ColumnType =
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'enum'
  | 'badge'
  | 'currency'
  | 'link';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface EnumValue {
  value: string;
  label: string;
  color?: string; // hex or semantic: "success", "warning", "error"
}

export interface ColumnDef {
  name: string;           // data field key
  label: string;          // display header
  type: ColumnType;
  visible?: boolean;      // default true
  sortable?: boolean;     // default true
  filterable?: boolean;   // default false
  searchable?: boolean;   // included in global search
  pii_sensitive?: boolean;
  width?: string;         // CSS value
  align?: ColumnAlign;
  enum_values?: EnumValue[];
  format?: string;        // date format, currency code, etc.
  truncate?: number;      // max chars before ellipsis
}

// ---------------------------------------------------------------------------
// Filter Types
// ---------------------------------------------------------------------------

export type FilterType = 'search' | 'multiselect' | 'range' | 'daterange' | 'boolean' | 'custom';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  column: string;
  type: FilterType;
  label?: string;
  placeholder?: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  default_value?: unknown;
}

// ---------------------------------------------------------------------------
// Time Range Presets
// ---------------------------------------------------------------------------

export interface TimeRangePreset {
  label: string;
  value: string;
  duration_hours: number | null; // null = ALL (no limit)
}

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

export type StatColor = 'primary' | 'info' | 'warning' | 'error' | 'success' | 'neutral';

export interface SummaryStat {
  key: string;    // built-in: 'total', 'page_count', 'active_filters', 'locked'
  label: string;
  icon?: string;
  color?: StatColor;
}

// ---------------------------------------------------------------------------
// Data Source
// ---------------------------------------------------------------------------

export interface DataSource {
  endpoint_template: string;
  method?: 'GET' | 'POST';
  query_params?: Record<string, string>;
  response_data_path?: string;   // default 'data'
  response_total_path?: string;  // default 'total'
  page_param?: string;           // default 'page'
  page_size_param?: string;      // default 'limit'
  sort_param?: string;           // default 'sort'
  sort_dir_param?: string;       // default 'order'
  search_param?: string;         // default 'search'
  time_range_param?: string;     // default 'time_range'
  date_from_param?: string;      // default 'from'
  date_to_param?: string;        // default 'to'
}

// ---------------------------------------------------------------------------
// Full Config
// ---------------------------------------------------------------------------

export type ViewMode = 'list' | 'grid';
export type ExportFormat = 'csv' | 'excel';
export type SortDirection = 'asc' | 'desc';

export interface DataTableConfig {
  columns: ColumnDef[];
  filters?: FilterDef[];
  time_range_presets?: TimeRangePreset[];
  summary_stats?: SummaryStat[];
  view_modes?: ViewMode[];
  export_formats?: ExportFormat[];
  sortable?: boolean;
  searchable?: boolean;
  page_sizes?: number[];
  default_page_size?: number;
  default_sort_column?: string;
  default_sort_direction?: SortDirection;
  row_click_action?: string;
  empty_state_message?: string;
  data_source: DataSource;
  time_filter_column?: string; // column used for time range filtering
}

// ---------------------------------------------------------------------------
// Action Buttons
// ---------------------------------------------------------------------------

export interface ActionButton {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (row: Record<string, unknown>) => void;
  visible?: (row: Record<string, unknown>) => boolean;
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

export interface ZorbitDataTableProps {
  config: DataTableConfig;
  dataEndpoint?: string;         // override data_source.endpoint_template
  orgId?: string;
  userId?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: ActionButton[];
  title?: string;
  createButton?: {
    label: string;
    onClick: () => void;
  };
  lockedFilters?: Record<string, unknown>; // pre-applied, non-removable filters
  className?: string;
}

// ---------------------------------------------------------------------------
// API Response
// ---------------------------------------------------------------------------

export interface DataTableApiResponse {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Internal State
// ---------------------------------------------------------------------------

export interface ActiveFilter {
  column: string;
  label: string;
  type: FilterType;
  value: unknown;
  displayValue: string;
}

export interface SortState {
  column: string;
  direction: SortDirection;
}

// ---------------------------------------------------------------------------
// Workflow Queue
// ---------------------------------------------------------------------------

export interface WorkflowQueueDef {
  name: string;
  label: string;
  lockedFilters: Record<string, unknown>;
  icon?: string;
  count?: number;
}

export interface WorkflowQueueConfig {
  queues: WorkflowQueueDef[];
  tableConfig: DataTableConfig;
  dataEndpoint: string;
}

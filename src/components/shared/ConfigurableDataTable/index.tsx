/* Configurable DataTable — `zorbit-pfs-datatable:DataTable`.
 *
 * Driven entirely by `feProps` declared in a manifest nav item (SPEC-
 * datatable-parameters.md v1.0). The consuming module ships ZERO React.
 *
 * Central fixes (2026-04-21, Soldier I):
 *   - Global search has a client-side fallback so small pages are searchable
 *     even when the BE ignores `?q=`.
 *   - Headers are click-to-sort (asc → desc → reset) and rows sort client-side
 *     as a fallback on top of any BE sort support.
 *   - Smart filter panel: auto-inferred from column.type + observed values.
 *     Manifest `feProps.filters.extra` toggles still honored.
 *   - Row-action kebab menu is now rendered in a fixed-position layer so the
 *     table's `overflow-x-auto` can't clip it.
 *   - Row actions wired:
 *       * `view` / (no explicit action) → detail drawer
 *       * `edit` with formId → FormRenderer modal (pre-filled with row)
 *       * `beRoute` present → POST/PUT/PATCH/DELETE that URL
 *       * confirmMessage → confirm first; toast on success/failure
 *   - Table actions: `action: "openForm"` with `formId` → FormRenderer modal
 *     (cross-module render of `zorbit-pfs-form_builder:FormRenderer`).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw,
  Search as SearchIcon,
  Download,
  FileText,
  Users as UsersIcon,
  Eye,
  Check,
  X as XIcon,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Filter as FilterIcon,
  Pause,
  UserPlus,
  Edit2,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useModuleContext } from '../../../contexts/ModuleContext';
import { useToast } from '../Toast';
import { componentByName } from '../componentRegistry';
import {
  ActionSpec,
  Column,
  DataTableFeProps,
  DetailView,
  Row,
  RoleVariant,
  SrcRef,
} from './types';
import {
  applyFEMask,
  extractUserRoles,
  ensureArray,
  getByPath,
  pickRoleVariant,
} from './utils';
import { useResolvedRecord, useResolvedSrc } from './useSrc';
import Cell from './Cell';
import DetailDrawer from './DetailDrawer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICONS: Record<string, any> = {
  RefreshCw,
  Download,
  FileText,
  Users: UsersIcon,
  Eye,
  Check,
  X: XIcon,
  Search: SearchIcon,
  Pause,
  UserPlus,
  Edit2,
};

function actionIcon(name: string | undefined): React.ReactNode {
  if (!name) return null;
  const Ico = ICONS[name];
  return Ico ? <Ico size={14} className="shrink-0" /> : null;
}

interface DataTableProps {
  feProps?: DataTableFeProps;
  pageId?: string;
  dataSource?: DataTableFeProps['dataSource'];
  columns?: DataTableFeProps['columns'];
  defaultSort?: DataTableFeProps['defaultSort'];
  detailView?: DataTableFeProps['detailView'];
  filters?: DataTableFeProps['filters'];
  lookups?: DataTableFeProps['lookups'];
  feMasking?: DataTableFeProps['feMasking'];
  tableActions?: DataTableFeProps['tableActions'];
  rowActions?: DataTableFeProps['rowActions'];
  roleVariants?: DataTableFeProps['roleVariants'];
}

/* -------------------------------------------------------------------------- */
/* Helpers — client-side search + sort + filter fallbacks                     */
/* -------------------------------------------------------------------------- */

/** Does `row` contain the search term anywhere in a visible column? */
function rowMatchesSearch(row: Row, columns: Column[], term: string): boolean {
  if (!term) return true;
  const needle = term.toLowerCase();
  for (const col of columns) {
    const v = getByPath(row, col.key);
    if (v == null) continue;
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.toLowerCase().includes(needle)) return true;
  }
  return false;
}

function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  // date strings — try parsing
  const da = Date.parse(String(a));
  const db = Date.parse(String(b));
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

type FilterValue = {
  // Chip: selected distinct values (multi-select).
  selected?: Set<string>;
  // Date range: iso strings (yyyy-MM-dd).
  from?: string;
  to?: string;
  // Text / id substring.
  text?: string;
};

/* -------------------------------------------------------------------------- */

const ConfigurableDataTable: React.FC<DataTableProps> = (props) => {
  const fp: DataTableFeProps = useMemo(() => {
    if (props.feProps) return props.feProps;
    return {
      pageId: props.pageId,
      dataSource: props.dataSource as any,
      columns: props.columns as any,
      defaultSort: props.defaultSort,
      detailView: props.detailView,
      filters: props.filters,
      lookups: props.lookups,
      feMasking: props.feMasking,
      tableActions: props.tableActions,
      rowActions: props.rowActions,
      roleVariants: props.roleVariants,
    };
  }, [props]);

  const { user, orgId } = useAuth();
  const moduleContext = useModuleContext();
  const cacheKey = moduleContext.manifest?.version || 'v0';
  const { toast } = useToast();

  // ──────────────────────────────────────────────────────────────────────
  // Role variant resolution
  // ──────────────────────────────────────────────────────────────────────
  const userRoles = useMemo(
    () => extractUserRoles((user as any) || null),
    [user],
  );
  const resolvedVariants = useResolvedRecord<RoleVariant>(
    fp.roleVariants as Record<string, RoleVariant | SrcRef> | undefined,
    cacheKey,
  );
  const activeVariant = useMemo(() => {
    if (!resolvedVariants.data) return null;
    return pickRoleVariant(resolvedVariants.data, userRoles);
  }, [resolvedVariants.data, userRoles]);

  const effective: DataTableFeProps = useMemo(() => {
    if (!activeVariant) return fp;
    const v = activeVariant.variant;
    const out: DataTableFeProps = { ...fp };
    if (v.columns) out.columns = v.columns;
    if (v.filters) {
      out.filters = { ...(fp.filters || {}), ...v.filters };
      if (v.filters.extra) out.filters.extra = v.filters.extra;
    }
    if (v.lookups) out.lookups = { ...(fp.lookups || {}), ...v.lookups };
    if (v.tableActions) out.tableActions = v.tableActions;
    if (v.rowActions) out.rowActions = v.rowActions;
    if (v.detailView) out.detailView = { ...(fp.detailView || {}), ...v.detailView };
    return out;
  }, [fp, activeVariant]);

  // ──────────────────────────────────────────────────────────────────────
  // Resolve columns
  // ──────────────────────────────────────────────────────────────────────
  const columnsRes = useResolvedSrc<Column[]>(effective.columns, cacheKey);
  const configuredColumns: Column[] = useMemo(() => {
    if (Array.isArray(columnsRes.data)) return columnsRes.data;
    if (columnsRes.data && Array.isArray((columnsRes.data as any).columns)) {
      return (columnsRes.data as any).columns as Column[];
    }
    return ensureArray(effective.columns as any);
  }, [columnsRes.data, effective.columns]);

  // ──────────────────────────────────────────────────────────────────────
  // Lookups
  // ──────────────────────────────────────────────────────────────────────
  const [lookups, setLookups] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!effective.lookups) {
      setLookups({});
      return;
    }
    let cancelled = false;
    const entries = Object.entries(effective.lookups);
    Promise.all(
      entries.map(async ([name, spec]) => {
        try {
          const url = spec.beRoute.replace(/\{\{org_id\}\}/g, orgId);
          const res = await api.get(url);
          const items: any[] = res.data?.items || res.data?.users || res.data?.data || res.data || [];
          return [
            name,
            items.map((it: any) => ({
              value: it[spec.valueField],
              label: it[spec.labelField],
              avatar: spec.avatarField ? it[spec.avatarField] : undefined,
            })),
          ] as const;
        } catch {
          return [name, []] as const;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const out: Record<string, any> = {};
      for (const [k, v] of pairs) out[k] = v;
      setLookups(out);
    });
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(effective.lookups || {}), orgId]);

  // ──────────────────────────────────────────────────────────────────────
  // Data fetch
  // ──────────────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = effective.dataSource?.pageSize || 25;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' } | null>(
    () => (effective.defaultSort?.[0] ? { ...effective.defaultSort[0] } : null),
  );

  const beRoute = effective.dataSource?.beRoute || '';
  const searchParam = (effective.dataSource as any)?.searchParam || 'q';

  useEffect(() => {
    if (!beRoute) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = beRoute.replace(/\{\{org_id\}\}/g, orgId);
    const params: Record<string, unknown> = {
      page,
      pageSize,
      limit: pageSize,
      sort: sortBy?.field,
      sortBy: sortBy?.field,
      order: sortBy?.order,
    };
    if (search) {
      params[searchParam] = search;
      // Also set the generic aliases — many BEs accept `q` / `search`.
      params.q = search;
      params.search = search;
    }
    api
      .get(url, { params })
      .then((res) => {
        if (cancelled) return;
        const items: any[] = Array.isArray(res.data)
          ? res.data
          : res.data?.items ||
            res.data?.users ||
            res.data?.quotations ||
            res.data?.rows ||
            res.data?.data ||
            [];
        const count: number =
          res.data?.total ?? res.data?.totalCount ?? res.data?.count ?? items.length;
        setRows(items);
        setTotal(count);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load data');
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [beRoute, orgId, page, pageSize, search, searchParam, sortBy?.field, sortBy?.order, refreshTick]);

  // ──────────────────────────────────────────────────────────────────────
  // Columns (configured or auto-derived from first row)
  // ──────────────────────────────────────────────────────────────────────
  const columns: Column[] = useMemo(() => {
    if (configuredColumns && configuredColumns.length > 0) return configuredColumns;
    const sample = rows[0];
    if (!sample || typeof sample !== 'object') return [];
    return Object.keys(sample).map((key) => {
      const v = (sample as any)[key];
      const looksLikeDate =
        typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && !Number.isNaN(Date.parse(v));
      const looksLikeId = /(^|_)(id|hashId)$/i.test(key) || key.toLowerCase().endsWith('id');
      return {
        key,
        label: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]+/g, ' ')
          .replace(/^./, (c) => c.toUpperCase())
          .trim(),
        type: looksLikeDate ? 'date' : looksLikeId ? 'id' : 'text',
      } as Column;
    });
  }, [configuredColumns, rows]);

  // ──────────────────────────────────────────────────────────────────────
  // FE mask
  // ──────────────────────────────────────────────────────────────────────
  const maskedRows: Row[] = useMemo(() => {
    if (!effective.feMasking?.enabled || !effective.feMasking.rules) return rows;
    return rows.map((r) => {
      const next: Row = { ...r };
      for (const rule of effective.feMasking!.rules!) {
        const parts = rule.field.split('.');
        let cursor: any = next;
        for (let i = 0; i < parts.length - 1; i++) {
          if (cursor[parts[i]] == null) cursor[parts[i]] = {};
          cursor = cursor[parts[i]];
        }
        const leaf = parts[parts.length - 1];
        cursor[leaf] = applyFEMask(cursor[leaf], rule.pattern, rule['mask-char'] || '•');
      }
      return next;
    });
  }, [rows, effective.feMasking]);

  // ──────────────────────────────────────────────────────────────────────
  // Client-side filter state (auto-inferred from column type)
  //
  // Inferences:
  //   type=chip        → multi-select over observed values
  //   type=date/datetime → date range (from/to)
  //   type=text/id/(default) → substring match (only exposed if the column
  //       was declared filterable: true, to avoid UI clutter)
  //   type=number      → min/max (basic two-input)
  // ──────────────────────────────────────────────────────────────────────
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
  const [filtersOpen, setFiltersOpen] = useState<boolean>(!effective.filters?.collapsed);

  // Observed distinct values per chip column
  const chipObservedByCol = useMemo<Record<string, string[]>>(() => {
    const out: Record<string, Set<string>> = {};
    for (const c of columns) {
      if (c.type === 'chip') out[c.key] = new Set();
    }
    for (const r of maskedRows) {
      for (const c of columns) {
        if (c.type === 'chip') {
          const v = getByPath(r, c.key);
          if (v != null && v !== '') out[c.key].add(String(v));
        }
      }
    }
    const res: Record<string, string[]> = {};
    for (const [k, s] of Object.entries(out)) res[k] = Array.from(s).sort();
    return res;
  }, [maskedRows, columns]);

  const filterableColumns = useMemo(() => {
    const auto = effective.filters?.auto !== false; // default true
    return columns.filter((c) => {
      if (c.filterable === false) return false;
      if (c.filterable === true) return true;
      if (typeof c.filterable === 'object') return true;
      if (!auto) return false;
      // auto — only chips + datetime columns + columns with an explicit
      // filterable object. `text` columns are reachable via the global
      // search box already, so we don't add a per-column input unless the
      // author asked for it.
      if (c.type === 'chip') return true;
      if (c.type === 'date' || (c.type as string) === 'datetime') return true;
      if (c.type === 'number' || c.type === 'currency') return true;
      return false;
    });
  }, [columns, effective.filters?.auto]);

  const hasAnyFilter = filterableColumns.length > 0 || !!effective.filters?.extra?.length;

  function setChipFilter(colKey: string, value: string, on: boolean) {
    setFilterValues((prev) => {
      const cur: FilterValue = { ...(prev[colKey] || {}) };
      const selected = new Set(cur.selected || []);
      if (on) selected.add(value);
      else selected.delete(value);
      cur.selected = selected;
      return { ...prev, [colKey]: cur };
    });
    setPage(1);
  }
  function setRangeFilter(colKey: string, bound: 'from' | 'to', value: string) {
    setFilterValues((prev) => ({
      ...prev,
      [colKey]: { ...(prev[colKey] || {}), [bound]: value || undefined },
    }));
    setPage(1);
  }
  function setTextFilter(colKey: string, value: string) {
    setFilterValues((prev) => ({
      ...prev,
      [colKey]: { ...(prev[colKey] || {}), text: value || undefined },
    }));
    setPage(1);
  }
  function clearAllFilters() {
    setFilterValues({});
    setPage(1);
  }
  const activeFilterCount = useMemo(() => {
    let n = 0;
    for (const v of Object.values(filterValues)) {
      if (v.selected && v.selected.size > 0) n += v.selected.size;
      if (v.from) n += 1;
      if (v.to) n += 1;
      if (v.text) n += 1;
    }
    return n;
  }, [filterValues]);

  // ──────────────────────────────────────────────────────────────────────
  // Client-side search / filter / sort — FE fallback on top of BE.
  // ──────────────────────────────────────────────────────────────────────
  const filteredRows: Row[] = useMemo(() => {
    let out = maskedRows;

    // search (fallback / extra; BE may already have narrowed)
    if (search) {
      out = out.filter((r) => rowMatchesSearch(r, columns, search));
    }

    // per-column filters
    const entries = Object.entries(filterValues);
    if (entries.length > 0) {
      out = out.filter((r) => {
        for (const [colKey, fv] of entries) {
          const col = columns.find((c) => c.key === colKey);
          if (!col) continue;
          const v = getByPath(r, colKey);
          if (fv.selected && fv.selected.size > 0) {
            if (v == null || !fv.selected.has(String(v))) return false;
          }
          if (fv.text) {
            const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
            if (!s.toLowerCase().includes(fv.text.toLowerCase())) return false;
          }
          if (fv.from || fv.to) {
            const t = v == null ? NaN : Date.parse(String(v));
            if (Number.isNaN(t)) return false;
            if (fv.from) {
              const tf = Date.parse(fv.from);
              if (!Number.isNaN(tf) && t < tf) return false;
            }
            if (fv.to) {
              // Add 1 day so "to" is inclusive when yyyy-MM-dd.
              const tt = Date.parse(fv.to);
              if (!Number.isNaN(tt) && t > tt + 24 * 3600 * 1000 - 1) return false;
            }
          }
        }
        return true;
      });
    }
    return out;
  }, [maskedRows, columns, search, filterValues]);

  const sortedRows: Row[] = useMemo(() => {
    if (!sortBy) return filteredRows;
    const copy = filteredRows.slice();
    copy.sort((a, b) => {
      const av = getByPath(a, sortBy.field);
      const bv = getByPath(b, sortBy.field);
      const cmp = compareValues(av, bv);
      return sortBy.order === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [filteredRows, sortBy]);

  const visibleRows = sortedRows;

  // ──────────────────────────────────────────────────────────────────────
  // Detail drawer
  // ──────────────────────────────────────────────────────────────────────
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback((row: Row) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Form modal (shared by tableActions + rowActions "openForm"/"edit")
  // ──────────────────────────────────────────────────────────────────────
  const [formModal, setFormModal] = useState<
    | null
    | {
        title: string;
        formId?: string;
        formSlug?: string;
        submitRoute?: string;
        initialData?: Record<string, unknown>;
      }
  >(null);

  const FormRendererCmp = useMemo(
    () => componentByName('zorbit-pfs-form_builder:FormRenderer'),
    [],
  );

  // ──────────────────────────────────────────────────────────────────────
  // Row action menu — portaled with fixed coords so overflow can't clip it
  // ──────────────────────────────────────────────────────────────────────
  const [actionMenu, setActionMenu] = useState<
    | null
    | { rowKey: string | number; row: Row; x: number; y: number }
  >(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  useEffect(() => {
    function close(_e: MouseEvent) {
      setActionMenu(null);
    }
    function onScroll() {
      setActionMenu(null);
    }
    if (actionMenu) {
      // Close on any outside click OR scroll.
      document.addEventListener('mousedown', close);
      document.addEventListener('scroll', onScroll, true);
      return () => {
        document.removeEventListener('mousedown', close);
        document.removeEventListener('scroll', onScroll, true);
      };
    }
    return undefined;
  }, [actionMenu]);

  function rowIdOf(row: Row): string | number {
    return (
      (row as any).id ||
      (row as any).hashId ||
      (row as any).quotationId ||
      (row as any)._id ||
      ''
    );
  }

  async function runRowAction(action: ActionSpec & { action?: string; formId?: string; formSlug?: string; confirmMessage?: string }, row: Row): Promise<void> {
    const kind = action.action || action.kind || action.id;
    const rowId = rowIdOf(row);

    // view / open-detail — drawer
    if (kind === 'view' || kind === 'open-detail') {
      openDrawer(row);
      setActionMenu(null);
      return;
    }

    // edit / openForm — modal with FormRenderer
    if (kind === 'edit' || kind === 'openForm' || action.formId || action.formSlug) {
      setFormModal({
        title: action.label || 'Edit',
        formId: action.formId,
        formSlug: action.formSlug,
        submitRoute: action.beRoute,
        initialData: row as any,
      });
      setActionMenu(null);
      return;
    }

    // confirm
    const confirmMsg =
      action.confirmMessage ||
      (typeof action.confirm === 'string' ? action.confirm : action.confirm?.title);
    if (confirmMsg && !window.confirm(confirmMsg)) {
      setActionMenu(null);
      return;
    }

    // beRoute (httpPost / PUT / DELETE / etc.)
    if (action.beRoute) {
      const [method, rawUrl] = action.beRoute.includes(' ')
        ? (action.beRoute.split(' ', 2) as [string, string])
        : ['POST', action.beRoute];
      const url = rawUrl
        .replace(/\{\{org_id\}\}/g, orgId)
        .replace(/\{rowId\}/g, String(rowId))
        .replace(/\{([^}]+)\}/g, (_m, k) => String((row as any)[k] ?? ''));
      setRunningAction(action.id);
      try {
        await api.request({ method: method.toLowerCase() as any, url, data: {} });
        toast(`${action.label} succeeded`, 'success');
        setRefreshTick((t) => t + 1);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[DataTable] row action failed', err);
        toast(
          `${action.label} failed: ${err?.response?.data?.message || err?.message || 'unknown'}`,
          'error',
        );
      } finally {
        setRunningAction(null);
        setActionMenu(null);
      }
      return;
    }

    // Fallback — emit CustomEvent for host page to handle.
    window.dispatchEvent(
      new CustomEvent('zorbit:datatable:rowaction', {
        detail: { action, row, pageId: effective.pageId },
      }),
    );
    setActionMenu(null);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Table actions
  // ──────────────────────────────────────────────────────────────────────
  async function runTableAction(action: ActionSpec & { action?: string; formId?: string; formSlug?: string }): Promise<void> {
    const kind = action.action || action.kind || action.id;

    if (kind === 'refresh' || action.id === 'refresh') {
      setRefreshTick((t) => t + 1);
      return;
    }

    if (kind === 'openForm' || action.formId || action.formSlug) {
      setFormModal({
        title: action.label || 'Form',
        formId: action.formId,
        formSlug: action.formSlug,
        submitRoute: action.beRoute,
      });
      return;
    }

    if (action.kind === 'export') {
      toast(`Export as ${action.format?.toUpperCase() || 'file'} queued (stub).`, 'info');
      return;
    }
    if (action.kind === 'bulk-action') {
      toast('Bulk actions not yet wired.', 'info');
      return;
    }
    if (action.beRoute) {
      const [method, rawUrl] = action.beRoute.includes(' ')
        ? (action.beRoute.split(' ', 2) as [string, string])
        : ['POST', action.beRoute];
      const url = rawUrl.replace(/\{\{org_id\}\}/g, orgId);
      try {
        await api.request({ method: method.toLowerCase() as any, url, data: {} });
        toast(`${action.label} succeeded`, 'success');
        setRefreshTick((t) => t + 1);
      } catch (err: any) {
        toast(
          `${action.label} failed: ${err?.response?.data?.message || err?.message || 'unknown'}`,
          'error',
        );
      }
      return;
    }

    // Emit CustomEvent as a final fallback.
    window.dispatchEvent(
      new CustomEvent('zorbit:datatable:tableaction', {
        detail: { action, pageId: effective.pageId },
      }),
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────
  const rowActions: ActionSpec[] = effective.rowActions || [];
  const tableActions: ActionSpec[] = effective.tableActions || [];
  const totalPages = Math.max(1, Math.ceil(Math.max(total, visibleRows.length) / pageSize));
  const headerLoading = loading || columnsRes.loading || resolvedVariants.loading;

  const onHeaderClickSort = (col: Column) => {
    // Default to sortable=true unless explicitly false.
    if (col.sortable === false) return;
    setSortBy((s) => {
      if (!s || s.field !== col.key) return { field: col.key, order: 'asc' };
      if (s.order === 'asc') return { field: col.key, order: 'desc' };
      return null;
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-3">
      {fp.pageId && (
        <div className="text-[10px] text-gray-400 font-mono">pageId: {fp.pageId}</div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border ${
                filtersOpen
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <FilterIcon size={13} />
              <span>Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</span>
            </button>
          )}
          {activeVariant && (
            <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
              variant: {activeVariant.key}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {tableActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                void runTableAction(action as any);
              }}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              {actionIcon(action.icon)}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {hasAnyFilter && filtersOpen && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Filters
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {filterableColumns.map((col) => {
              const fv = filterValues[col.key] || {};
              if (col.type === 'chip') {
                const vals = chipObservedByCol[col.key] || [];
                if (vals.length === 0) {
                  return (
                    <div key={col.key} className="text-xs text-gray-400">
                      {col.label}: (no values)
                    </div>
                  );
                }
                return (
                  <div key={col.key} className="min-w-[160px]">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      {col.label}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vals.map((v) => {
                        const on = fv.selected?.has(v) || false;
                        const palette = (col.chipColors as any)?.[v];
                        const bg =
                          on
                            ? typeof palette === 'object' && palette?.bg
                              ? palette.bg
                              : '#4f46e5'
                            : '#f3f4f6';
                        const text =
                          on
                            ? typeof palette === 'object' && palette?.text
                              ? palette.text
                              : '#ffffff'
                            : '#374151';
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setChipFilter(col.key, v, !on)}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-transparent"
                            style={{ background: bg, color: text }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (col.type === 'date' || (col.type as string) === 'datetime') {
                return (
                  <div key={col.key} className="min-w-[200px]">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      {col.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={fv.from || ''}
                        onChange={(e) => setRangeFilter(col.key, 'from', e.target.value)}
                        className="px-1.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                      <span className="text-[10px] text-gray-400">to</span>
                      <input
                        type="date"
                        value={fv.to || ''}
                        onChange={(e) => setRangeFilter(col.key, 'to', e.target.value)}
                        className="px-1.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                );
              }
              if (col.type === 'number' || col.type === 'currency') {
                return (
                  <div key={col.key} className="min-w-[160px]">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      {col.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="min"
                        value={fv.from || ''}
                        onChange={(e) => setRangeFilter(col.key, 'from', e.target.value)}
                        className="w-20 px-1.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                      <span className="text-[10px] text-gray-400">–</span>
                      <input
                        type="number"
                        placeholder="max"
                        value={fv.to || ''}
                        onChange={(e) => setRangeFilter(col.key, 'to', e.target.value)}
                        className="w-20 px-1.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                );
              }
              // text / id / default
              return (
                <div key={col.key} className="min-w-[160px]">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                    {col.label}
                  </div>
                  <input
                    type="text"
                    value={fv.text || ''}
                    onChange={(e) => setTextFilter(col.key, e.target.value)}
                    placeholder={`Filter ${col.label.toLowerCase()}…`}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 w-48"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60">
                {columns.map((col) => {
                  const sortable = col.sortable !== false;
                  const active = sortBy?.field === col.key;
                  return (
                    <th
                      key={col.key}
                      style={col.width ? { width: col.width } : undefined}
                      className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!sortable}
                        onClick={() => onHeaderClickSort(col)}
                        className={`inline-flex items-center gap-1 select-none ${
                          sortable ? 'cursor-pointer hover:text-gray-900 dark:hover:text-white' : 'cursor-default'
                        }`}
                        title={sortable ? 'Click to sort' : undefined}
                      >
                        <span>{col.label}</span>
                        {sortable && (
                          active ? (
                            sortBy!.order === 'asc' ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30" />
                          )
                        )}
                      </button>
                    </th>
                  );
                })}
                {rowActions.length > 0 && (
                  <th className="px-3 py-2 text-right w-[40px]"> </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {headerLoading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (rowActions.length ? 1 : 0)} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!headerLoading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (rowActions.length ? 1 : 0)} className="px-4 py-6 text-center text-sm text-gray-500">
                    No data
                  </td>
                </tr>
              )}
              {visibleRows.map((row, idx) => {
                const rowKey =
                  (row as any).id ||
                  (row as any).quotationId ||
                  (row as any).hashId ||
                  (row as any)._id ||
                  (row as any).quotation_number ||
                  idx;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => openDrawer(row)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer"
                  >
                    {columns.map((col) => (
                      <Cell key={col.key} column={col} row={row} lookups={lookups} />
                    ))}
                    {rowActions.length > 0 && (
                      <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setActionMenu({
                              rowKey,
                              row,
                              x: rect.right,
                              y: rect.bottom + 4,
                            });
                          }}
                          aria-label="Row actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
          <span>
            {total === 0 && visibleRows.length === 0 ? '0 items' : (
              <>Showing <b>{(page - 1) * pageSize + 1}</b>–<b>{Math.min(page * pageSize, Math.max(total, visibleRows.length))}</b> of <b>{Math.max(total, visibleRows.length)}</b></>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Portaled row action menu — fixed coords so overflow can't clip */}
      {actionMenu &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: actionMenu.y,
              left: Math.max(8, actionMenu.x - 160),
              zIndex: 60,
            }}
            className="w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {rowActions.map((action) => (
              <button
                key={action.id}
                disabled={runningAction === action.id}
                onClick={() => {
                  void runRowAction(action as any, actionMenu.row);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-50"
              >
                {actionIcon(action.icon)}
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Form modal (tableAction openForm OR rowAction edit/formId) */}
      {formModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setFormModal(null)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {formModal.title}
                </h3>
                <button
                  onClick={() => setFormModal(null)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close"
                >
                  <XIcon size={18} />
                </button>
              </div>
              <div className="p-5">
                {FormRendererCmp ? (
                  <React.Suspense
                    fallback={<div className="text-sm text-gray-500">Loading form…</div>}
                  >
                    <FormRendererCmp
                      formId={formModal.formId}
                      formSlug={formModal.formSlug}
                      submitRoute={formModal.submitRoute}
                      initialData={formModal.initialData}
                      hideHeader={false}
                      onSubmitted={() => {
                        toast('Saved', 'success');
                        setFormModal(null);
                        setRefreshTick((t) => t + 1);
                      }}
                      onCancel={() => setFormModal(null)}
                    />
                  </React.Suspense>
                ) : (
                  <div className="text-sm text-red-600">
                    FormRenderer is not registered. Check componentRegistry.ts.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        row={selectedRow}
        detailView={effective.detailView as DetailView | null}
        orgId={orgId}
        cacheKey={cacheKey}
        lookups={lookups}
        columns={columns}
      />
    </div>
  );
};

export default ConfigurableDataTable;

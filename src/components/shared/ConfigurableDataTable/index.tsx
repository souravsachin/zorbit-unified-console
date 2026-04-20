/* Configurable DataTable — `zorbit-pfs-datatable:DataTable`.
 *
 * Driven entirely by `feProps` declared in a manifest nav item (SPEC-
 * datatable-parameters.md v1.0). The consuming module ships ZERO React.
 *
 * MVP scope (Phase E1/E2/E3 — enough for the UW Quotations pilot):
 *   - fetches GET <dataSource.beRoute> with ?page, ?pageSize, ?q
 *   - columns + defaultSort applied client-side; BE may respect server-side
 *   - roleVariants deep-merge onto base feProps, picked by user.role
 *   - `$src` sub-configs resolved lazily and cached by module version
 *   - header toolbar with search + tableActions (role-filtered)
 *   - row click → DetailDrawer with detailView.layout
 *   - rowActions available through a kebab menu per row
 *   - pagination (offset)
 *   - BE-first masking: leaves cells rendering as-is when already masked;
 *     applies FE mask as defence-in-depth if enabled.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useModuleContext } from '../../../contexts/ModuleContext';
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
  isSrcRef,
  pickRoleVariant,
  unwrapColumnsPayload,
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
};

function actionIcon(name: string | undefined): React.ReactNode {
  if (!name) return null;
  const Ico = ICONS[name];
  return Ico ? <Ico size={14} className="shrink-0" /> : null;
}

interface DataTableProps {
  // Passed in from ManifestRouter via `{...feProps, moduleContext}`.
  // We accept BOTH `feProps`-flat and a nested `feProps` object for
  // compatibility with manifest renderers that may spread differently.
  feProps?: DataTableFeProps;
  // Flat fallback — accept props directly when not nested.
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

const ConfigurableDataTable: React.FC<DataTableProps> = (props) => {
  // Normalise `feProps` — tolerate both flat + nested.
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

  // ──────────────────────────────────────────────────────────────────────
  // Role variant resolution
  // ──────────────────────────────────────────────────────────────────────
  const userRoles = useMemo(
    () => extractUserRoles((user as any) || null),
    [user],
  );

  // Resolve each role-variant $src first (parallel), then pick one.
  const resolvedVariants = useResolvedRecord<RoleVariant>(
    fp.roleVariants as Record<string, RoleVariant | SrcRef> | undefined,
    cacheKey,
  );

  const activeVariant = useMemo(() => {
    if (!resolvedVariants.data) return null;
    return pickRoleVariant(resolvedVariants.data, userRoles);
  }, [resolvedVariants.data, userRoles]);

  // Apply variant by merging columns/actions if present.
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
  // Resolve columns (inline or $src)
  // When no columns are configured AND data is loaded, auto-derive from the
  // first row's top-level keys. Acts as "SELECT *" for debugging and for
  // seeing what the BE actually serves before authoring a column config.
  // ──────────────────────────────────────────────────────────────────────
  const columnsRes = useResolvedSrc<Column[]>(effective.columns, cacheKey);
  const configuredColumns: Column[] = useMemo(() => {
    if (Array.isArray(columnsRes.data)) return columnsRes.data;
    if (columnsRes.data && Array.isArray((columnsRes.data as any).columns)) {
      return (columnsRes.data as any).columns as Column[];
    }
    return ensureArray(effective.columns as any);
  }, [columnsRes.data, effective.columns]);

  // `columns` is resolved below, after `rows` state is declared, because
  // the auto-derive path inspects rows[0] when configuredColumns is empty.

  // ──────────────────────────────────────────────────────────────────────
  // Lookups — fetch + shape into {value,label,avatar} triples
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

  useEffect(() => {
    if (!beRoute) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = beRoute.replace(/\{\{org_id\}\}/g, orgId);
    api
      .get(url, {
        params: {
          page,
          pageSize,
          limit: pageSize, // some BEs accept 'limit' instead
          q: search || undefined,
          search: search || undefined,
          sort: sortBy?.field,
          order: sortBy?.order,
        },
      })
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
  }, [beRoute, orgId, page, pageSize, search, sortBy?.field, sortBy?.order, refreshTick]);

  // ──────────────────────────────────────────────────────────────────────
  // Column resolution — use configured columns, or auto-derive from first
  // row when none are given. Auto-derive acts like SELECT * for debug.
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
        type: looksLikeDate ? 'datetime' : looksLikeId ? 'id' : 'text',
      } as Column;
    });
  }, [configuredColumns, rows]);

  // ──────────────────────────────────────────────────────────────────────
  // FE-side masking (defence-in-depth)
  // ──────────────────────────────────────────────────────────────────────
  const visibleRows: Row[] = useMemo(() => {
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
  // Detail drawer state
  // ──────────────────────────────────────────────────────────────────────
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback((row: Row) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Row actions
  // ──────────────────────────────────────────────────────────────────────
  const [actionMenuFor, setActionMenuFor] = useState<string | number | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const runRowAction = async (action: ActionSpec, row: Row): Promise<void> => {
    if (action.kind === 'open-detail') {
      openDrawer(row);
      setActionMenuFor(null);
      return;
    }
    if (!action.beRoute) {
      setActionMenuFor(null);
      return;
    }
    const confirmMsg =
      typeof action.confirm === 'string'
        ? action.confirm
        : action.confirm?.title;
    if (confirmMsg && !window.confirm(confirmMsg)) {
      setActionMenuFor(null);
      return;
    }
    const [method, rawUrl] = action.beRoute.includes(' ')
      ? (action.beRoute.split(' ', 2) as [string, string])
      : ['POST', action.beRoute];
    const url = rawUrl
      .replace(/\{\{org_id\}\}/g, orgId)
      .replace(/\{([^}]+)\}/g, (_m, k) => String(row[k] ?? ''));
    setRunningAction(action.id);
    try {
      await api.request({ method: method.toLowerCase() as any, url, data: {} });
      setRefreshTick((t) => t + 1);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[DataTable] row action failed', err);
      window.alert(`Action "${action.label}" failed: ${err?.response?.data?.message || err?.message || 'unknown'}`);
    } finally {
      setRunningAction(null);
      setActionMenuFor(null);
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // Table actions
  // ──────────────────────────────────────────────────────────────────────
  const runTableAction = async (action: ActionSpec): Promise<void> => {
    if (action.id === 'refresh') {
      setRefreshTick((t) => t + 1);
      return;
    }
    if (action.kind === 'export') {
      window.alert(`Export as ${action.format?.toUpperCase()} queued (stub). Downloads will be wired up in a later phase.`);
      return;
    }
    if (action.kind === 'bulk-action') {
      window.alert('Bulk actions not yet wired in Phase E — coming soon.');
      return;
    }
    if (action.beRoute) {
      const [method, rawUrl] = action.beRoute.includes(' ')
        ? (action.beRoute.split(' ', 2) as [string, string])
        : ['POST', action.beRoute];
      const url = rawUrl.replace(/\{\{org_id\}\}/g, orgId);
      try {
        await api.request({ method: method.toLowerCase() as any, url, data: {} });
        setRefreshTick((t) => t + 1);
      } catch (err: any) {
        window.alert(`Action "${action.label}" failed: ${err?.response?.data?.message || err?.message || 'unknown'}`);
      }
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────
  const rowActions: ActionSpec[] = effective.rowActions || [];
  const tableActions: ActionSpec[] = effective.tableActions || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const headerLoading = loading || columnsRes.loading || resolvedVariants.loading;

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
                void runTableAction(action);
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

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!col.sortable}
                      onClick={() => {
                        if (!col.sortable) return;
                        setSortBy((s) => {
                          if (!s || s.field !== col.key) return { field: col.key, order: 'asc' };
                          if (s.order === 'asc') return { field: col.key, order: 'desc' };
                          return null;
                        });
                      }}
                      className={`inline-flex items-center gap-1 ${
                        col.sortable ? 'cursor-pointer hover:text-gray-900 dark:hover:text-white' : 'cursor-default'
                      }`}
                    >
                      <span>{col.label}</span>
                      {sortBy?.field === col.key && (
                        <span className="text-[10px]">{sortBy.order === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                ))}
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
                  row.id || row.quotationId || row.hashId || row._id || row.quotation_number || idx;
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
                      <td className="px-2 py-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setActionMenuFor((k) => (k === rowKey ? null : rowKey))}
                          aria-label="Row actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {actionMenuFor === rowKey && (
                          <div className="absolute right-2 top-8 z-40 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1">
                            {rowActions.map((action) => (
                              <button
                                key={action.id}
                                disabled={runningAction === action.id}
                                onClick={() => {
                                  void runRowAction(action, row);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                              >
                                {actionIcon(action.icon)}
                                <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
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
            {total === 0 ? '0 items' : (
              <>Showing <b>{(page - 1) * pageSize + 1}</b>–<b>{Math.min(page * pageSize, total)}</b> of <b>{total}</b></>
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

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        row={selectedRow}
        detailView={effective.detailView as DetailView | null}
        orgId={orgId}
        cacheKey={cacheKey}
        lookups={lookups}
      />
    </div>
  );
};

export default ConfigurableDataTable;

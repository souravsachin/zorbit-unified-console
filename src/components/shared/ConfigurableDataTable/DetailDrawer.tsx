/* Detail drawer — slides in from the right when a row is clicked or the
 * `view` row-action is invoked.
 *
 * Accepts layout in two shapes, in order of preference:
 *   1. SPEC format (SPEC-datatable-parameters.md v1.0):
 *        detailView.layout = [ { title, collapsed?, fields: [{key,label,type?,...}] } ]
 *   2. Manifest shorthand (identity service uses this today):
 *        detailView.sections = [ { label, fields: ["hashId","displayName",...] } ]
 *
 * When shorthand is provided, the drawer enriches each field by looking up
 * the matching `columns[].type` so formatting (chip, datetime, id, etc.)
 * stays consistent with the table cell.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import {
  ActionSpec,
  Column,
  DetailLayoutField,
  DetailLayoutSection,
  DetailView,
  Row,
} from './types';
import {
  fillTemplate,
  formatCurrency,
  formatDate,
  formatNumber,
  getByPath,
  isSrcRef,
} from './utils';
import { fetchSrc } from './useSrc';

interface Props {
  open: boolean;
  onClose: () => void;
  row: Row | null;
  detailView: DetailView | null | undefined;
  orgId: string;
  cacheKey: string;
  lookups?: Record<string, any>;
  /** Column definitions from the parent table — used to infer type + label
   *  when `detailView.sections[].fields` is shorthand (array of strings). */
  columns?: Column[];
}

function renderFieldValue(field: DetailLayoutField, row: Row, lookups?: Record<string, any>): React.ReactNode {
  const v = getByPath(row, field.key);
  const type = field.type || 'text';
  if (v == null || v === '') return <span className="text-gray-400">—</span>;
  if (type === 'currency') return formatCurrency(v);
  if (type === 'number') return formatNumber(v);
  if (type === 'date' || (type as string) === 'datetime') return formatDate(v, field.format);
  if (type === 'chip') {
    const key = String(v);
    const palette = field.chipColors?.[key];
    const bg = typeof palette === 'string' ? undefined : palette?.bg;
    const text = typeof palette === 'string' ? undefined : palette?.text;
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: bg || '#f3f4f6', color: text || '#374151' }}
      >
        {key}
      </span>
    );
  }
  if (type === 'avatar-with-name') {
    const lookup = field.lookup ? lookups?.[field.lookup] : null;
    const entry = lookup && Array.isArray(lookup) ? lookup.find((l: any) => l.value === v) : null;
    return <span>{entry?.label || String(v)}</span>;
  }
  if (type === 'id') return <span className="font-mono text-xs">{String(v)}</span>;
  if (type === 'boolean') return <span>{v ? '✓' : '✗'}</span>;
  return <span>{String(v)}</span>;
}

/** Convert the configured detailView into a normalized SPEC-shaped
 *  DetailLayoutSection[], filling type/label from columns when the caller
 *  passed the manifest-shorthand `sections` form. */
function normalizeLayout(
  detailView: DetailView | null | undefined,
  columns: Column[],
): DetailLayoutSection[] | null {
  if (!detailView) return null;
  // SPEC layout wins
  if (detailView.layout && !isSrcRef(detailView.layout)) {
    return detailView.layout as DetailLayoutSection[];
  }

  // Manifest-shorthand: detailView.sections[].fields is string[]
  const anyDv = detailView as any;
  const sections: any[] | undefined = anyDv.sections;
  if (Array.isArray(sections)) {
    const colByKey: Record<string, Column> = {};
    for (const c of columns || []) colByKey[c.key] = c;
    const niceLabel = (k: string) =>
      k
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .replace(/^./, (c: string) => c.toUpperCase())
        .trim();

    return sections.map((s) => {
      const fields: DetailLayoutField[] = Array.isArray(s.fields)
        ? s.fields.map((f: any) => {
            if (typeof f === 'string') {
              const col = colByKey[f];
              return {
                key: f,
                label: col?.label || niceLabel(f),
                type: col?.type as any,
                format: col?.format,
                chipColors: col?.chipColors as any,
                lookup: col?.lookup,
              };
            }
            // Object form — augment from columns if type absent.
            if (!f.type && colByKey[f.key]) {
              const col = colByKey[f.key];
              return {
                ...f,
                label: f.label || col.label,
                type: col.type as any,
                format: f.format || col.format,
                chipColors: f.chipColors || col.chipColors,
                lookup: f.lookup || col.lookup,
              };
            }
            return f;
          })
        : [];
      return {
        title: s.title || s.label || 'Section',
        collapsed: !!s.collapsed,
        fields,
      } as DetailLayoutSection;
    });
  }
  return null;
}

export const DetailDrawer: React.FC<Props> = ({
  open,
  onClose,
  row,
  detailView,
  orgId,
  cacheKey,
  lookups,
  columns = [],
}) => {
  const [layout, setLayout] = useState<DetailLayoutSection[] | null>(null);
  const [enrichedRow, setEnrichedRow] = useState<Row | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [actionRunning, setActionRunning] = useState<string | null>(null);

  // Resolve $src layout OR normalize from manifest shorthand.
  useEffect(() => {
    let cancelled = false;
    if (!detailView) {
      setLayout(null);
      return;
    }
    if (detailView.layout && isSrcRef(detailView.layout)) {
      const url = (detailView.layout as { $src: string }).$src;
      fetchSrc(url, cacheKey)
        .then((data) => {
          if (cancelled) return;
          const arr = Array.isArray(data) ? data : data?.layout;
          if (Array.isArray(arr)) {
            setLayout(arr as DetailLayoutSection[]);
          } else {
            setLayout(normalizeLayout(detailView, columns));
          }
        })
        .catch(() => {
          if (!cancelled) setLayout(normalizeLayout(detailView, columns));
        });
    } else {
      setLayout(normalizeLayout(detailView, columns));
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    detailView && detailView.layout && isSrcRef(detailView.layout) ? (detailView.layout as any).$src : null,
    cacheKey,
    // Re-normalize when columns or the inline detailView change.
    JSON.stringify((detailView as any)?.sections || detailView?.layout || null),
    columns.length,
  ]);

  // Optional detail fetch for richer row data
  useEffect(() => {
    let cancelled = false;
    if (!open || !row) {
      setEnrichedRow(null);
      return;
    }
    if (detailView?.beRoute) {
      const url = detailView.beRoute
        .replace(/\{\{org_id\}\}/g, orgId)
        .replace(/\{([^}]+)\}/g, (_m, k) => String((row as any)[k] ?? ''));
      api
        .get(url)
        .then((res) => {
          if (!cancelled) setEnrichedRow({ ...row, ...(res.data?.item || res.data?.data || res.data) });
        })
        .catch(() => {
          if (!cancelled) setEnrichedRow(row);
        });
    } else {
      setEnrichedRow(row);
    }
    return () => {
      cancelled = true;
    };
  }, [open, row, detailView?.beRoute, orgId]);

  useEffect(() => {
    if (!layout) return;
    // Initialize collapsed-state from layout defaults.
    const init: Record<string, boolean> = {};
    layout.forEach((s, i) => {
      init[`${i}:${s.title}`] = !!s.collapsed;
    });
    setCollapsed(init);
  }, [layout]);

  // When no layout is configured, render every field on the row as a default
  // two-column list, so the drawer always shows SOMETHING sensible.
  const fallbackFields = useMemo<DetailLayoutField[] | null>(() => {
    if (layout && layout.length > 0) return null;
    const data = enrichedRow || row;
    if (!data) return null;
    const colByKey: Record<string, Column> = {};
    for (const c of columns || []) colByKey[c.key] = c;
    const niceLabel = (k: string) =>
      k
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .replace(/^./, (c: string) => c.toUpperCase())
        .trim();
    return Object.keys(data)
      .filter((k) => typeof (data as any)[k] !== 'object' || (data as any)[k] === null)
      .map((k) => {
        const col = colByKey[k];
        return {
          key: k,
          label: col?.label || niceLabel(k),
          type: col?.type as any,
          format: col?.format,
          chipColors: col?.chipColors as any,
        };
      });
  }, [layout, enrichedRow, row, columns]);

  if (!open) return null;

  const data = enrichedRow || row || {};
  const actions: ActionSpec[] = detailView?.actions || [];

  const handleAction = async (action: ActionSpec): Promise<void> => {
    if (!action.beRoute) {
      onClose();
      return;
    }
    const confirmMsg =
      typeof action.confirm === 'string'
        ? action.confirm
        : action.confirm?.title || null;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionRunning(action.id);
    try {
      const [method, rawUrl] = action.beRoute.includes(' ')
        ? action.beRoute.split(' ', 2) as [string, string]
        : ['POST', action.beRoute];
      const url = rawUrl.replace(/\{\{org_id\}\}/g, orgId).replace(/\{([^}]+)\}/g, (_m, k) => String((data as any)[k] ?? ''));
      await api.request({ method: method.toLowerCase(), url, data: {} });
      onClose();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[DetailDrawer] action failed', err);
      window.alert(`Action "${action.label}" failed: ${err?.response?.data?.message || err?.message || 'unknown'}`);
    } finally {
      setActionRunning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="ml-auto relative bg-white dark:bg-gray-900 w-full max-w-xl h-full shadow-xl overflow-y-auto border-l border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
          <div className="font-semibold text-gray-900 dark:text-gray-100">Details</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {layout && layout.length > 0 ? (
            layout.map((section, i) => {
              const key = `${i}:${section.title}`;
              const isCollapsed = collapsed[key];
              return (
                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCollapsed((s) => ({ ...s, [key]: !s[key] }))}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{section.title}</span>
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {!isCollapsed && (
                    <div className="p-4 space-y-2">
                      {section.fields.map((f) => (
                        <div key={f.key} className="grid grid-cols-3 gap-4 text-sm">
                          <div className="col-span-1 text-gray-500 dark:text-gray-400">{f.label}</div>
                          <div className="col-span-2 text-gray-900 dark:text-gray-100 break-all">
                            {renderFieldValue(f, data, lookups)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : fallbackFields && fallbackFields.length > 0 ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100">
                Row details
              </div>
              <div className="p-4 space-y-2">
                {fallbackFields.map((f) => (
                  <div key={f.key} className="grid grid-cols-3 gap-4 text-sm">
                    <div className="col-span-1 text-gray-500 dark:text-gray-400">{f.label}</div>
                    <div className="col-span-2 text-gray-900 dark:text-gray-100 break-all">
                      {renderFieldValue(f, data, lookups)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No row selected.</div>
          )}
        </div>

        {actions.length > 0 && (
          <div className="sticky bottom-0 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-2 justify-end">
            {actions.map((action) => {
              const variant = action.variant || 'secondary';
              const cls =
                variant === 'primary'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600';
              return (
                <button
                  key={action.id}
                  disabled={actionRunning === action.id}
                  onClick={() => {
                    void handleAction(action);
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm ${cls} disabled:opacity-50`}
                >
                  {actionRunning === action.id ? '…' : action.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Internal sanity: filled-in URL preview in dev */}
        {detailView?.beRoute && (
          <div className="px-5 py-2 text-[10px] text-gray-400 break-all">
            detail route: {fillTemplate(detailView.beRoute.replace(/\{\{org_id\}\}/g, orgId), data)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailDrawer;

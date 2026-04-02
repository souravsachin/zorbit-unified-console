import React, { useState, useCallback, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Minus,
  Plus,
  Edit3,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../Toast';
import api from '../../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  options?: string[];        // for 'select' type
  width?: string;            // tailwind width class
  editable?: boolean;        // default true
}

export interface CohortOption {
  key: string;
  label: string;
  description: string;
  defaultPct: number;
}

export interface DemoDataGeneratorProps {
  moduleId: string;
  moduleName: string;
  seedEndpoint: string;
  flushEndpoint: string;
  columns: DemoColumnDef[];
  cohortOptions?: CohortOption[];
  generatePreview: (count: number, cohort: Record<string, number>) => Array<Record<string, any>>;
}

type IngestState = 'idle' | 'running' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DemoDataGenerator: React.FC<DemoDataGeneratorProps> = ({
  moduleId,
  moduleName,
  seedEndpoint,
  flushEndpoint,
  columns,
  cohortOptions,
  generatePreview,
}) => {
  const { orgId } = useAuth();
  const { toast } = useToast();

  // Panel state
  const [expanded, setExpanded] = useState(false);

  // Config
  const [count, setCount] = useState(20);
  const countOptions = [10, 20, 50, 100];

  // Cohort distribution
  const defaultCohort = useMemo(() => {
    const c: Record<string, number> = {};
    if (cohortOptions) {
      cohortOptions.forEach((o) => { c[o.key] = o.defaultPct; });
    }
    return c;
  }, [cohortOptions]);

  const [cohort, setCohort] = useState<Record<string, number>>(defaultCohort);

  // Preview data
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Operation states
  const [ingestState, setIngestState] = useState<IngestState>('idle');
  const [flushState, setFlushState] = useState<IngestState>('idle');
  const [ingestResult, setIngestResult] = useState('');

  // ---- Cohort slider logic ----

  const adjustCohort = useCallback((key: string, newVal: number) => {
    setCohort((prev) => {
      const clamped = Math.max(0, Math.min(100, newVal));
      const others = Object.keys(prev).filter((k) => k !== key);
      const otherSum = others.reduce((s, k) => s + prev[k], 0);
      const diff = clamped - prev[key];

      if (otherSum === 0 && diff > 0) return prev; // can't take from zero

      const next: Record<string, number> = { ...prev, [key]: clamped };

      // Redistribute the difference proportionally among others
      if (diff !== 0 && otherSum > 0) {
        let remaining = -diff;
        others.forEach((k, i) => {
          if (i === others.length - 1) {
            // last one gets the remainder to ensure sum = 100
            next[k] = Math.max(0, prev[k] + remaining);
          } else {
            const share = Math.round((prev[k] / otherSum) * (-diff));
            const adjusted = Math.max(0, prev[k] + share);
            next[k] = adjusted;
            remaining -= (adjusted - prev[k]);
          }
        });
      }

      // Final normalization to ensure sum = 100
      const total = Object.values(next).reduce((s, v) => s + v, 0);
      if (total !== 100 && others.length > 0) {
        const lastKey = others[others.length - 1];
        next[lastKey] = Math.max(0, next[lastKey] + (100 - total));
      }

      return next;
    });
  }, []);

  // ---- Generate preview ----

  const handleGenerate = useCallback(() => {
    const data = generatePreview(count, cohort);
    setRows(data);
    setSelected(new Set(data.map((_, i) => i)));
    setEditingCell(null);
  }, [count, cohort, generatePreview]);

  // ---- Select / deselect ----

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((_, i) => i)));
    }
  };

  // ---- Inline editing ----

  const startEdit = (rowIdx: number, colKey: string) => {
    const col = columns.find((c) => c.key === colKey);
    if (col?.editable === false) return;
    setEditingCell({ row: rowIdx, col: colKey });
    setEditValue(String(rows[rowIdx][colKey] ?? ''));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    setRows((prev) => {
      const next = [...prev];
      const col = columns.find((c) => c.key === editingCell.col);
      next[editingCell.row] = {
        ...next[editingCell.row],
        [editingCell.col]: col?.type === 'number' ? Number(editValue) : editValue,
      };
      return next;
    });
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  // ---- Ingest ----

  const handleIngestAll = async () => {
    setIngestState('running');
    setIngestResult('');
    try {
      const res = await api.post(seedEndpoint, {
        organizationHashId: orgId,
        rows: rows,
        count: rows.length,
      });
      setIngestState('success');
      const msg = res.data?.message || `Successfully ingested ${rows.length} records`;
      setIngestResult(msg);
      toast(`Ingested ${rows.length} demo records`, 'success');
    } catch (err: any) {
      setIngestState('error');
      const msg = err?.response?.data?.message || err?.message || 'Ingest failed';
      setIngestResult(msg);
      toast(`Ingest failed: ${msg}`, 'error');
    }
  };

  const handleIngestSelected = async () => {
    const selectedRows = rows.filter((_, i) => selected.has(i));
    if (selectedRows.length === 0) {
      toast('No rows selected', 'error');
      return;
    }
    setIngestState('running');
    setIngestResult('');
    try {
      const res = await api.post(seedEndpoint, {
        organizationHashId: orgId,
        rows: selectedRows,
        count: selectedRows.length,
      });
      setIngestState('success');
      const msg = res.data?.message || `Successfully ingested ${selectedRows.length} records`;
      setIngestResult(msg);
      toast(`Ingested ${selectedRows.length} demo records`, 'success');
    } catch (err: any) {
      setIngestState('error');
      const msg = err?.response?.data?.message || err?.message || 'Ingest failed';
      setIngestResult(msg);
      toast(`Ingest failed: ${msg}`, 'error');
    }
  };

  const handleFlush = async () => {
    setFlushState('running');
    try {
      await api.delete(flushEndpoint, { data: { organizationHashId: orgId } });
      setFlushState('success');
      toast('Demo data cleared', 'success');
    } catch (err: any) {
      setFlushState('error');
      toast(`Clear failed: ${err?.response?.data?.message || err?.message}`, 'error');
    }
  };

  // ---- Render ----

  const cohortTotal = Object.values(cohort).reduce((s, v) => s + v, 0);

  return (
    <div className="card overflow-hidden border-indigo-200 dark:border-indigo-800/50 mt-6">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              AI Demo Data Generator
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generate, preview, and ingest synthetic demo data
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* ============================================================ */}
          {/* Section 1: Configuration                                      */}
          {/* ============================================================ */}
          <div className="p-5 space-y-5 border-b border-gray-200 dark:border-gray-700">
            {/* Count selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Records
              </label>
              <div className="flex gap-2">
                {countOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      count === n
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Cohort distribution sliders */}
            {cohortOptions && cohortOptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cohort Distribution
                  </label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    cohortTotal === 100
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {cohortTotal}%
                  </span>
                </div>
                <div className="space-y-3">
                  {cohortOptions.map((opt) => (
                    <div key={opt.key} className="flex items-center gap-3">
                      <div className="w-36 shrink-0">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        {opt.description && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{opt.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => adjustCohort(opt.key, (cohort[opt.key] || 0) - 5)}
                          className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
                        >
                          <Minus size={12} />
                        </button>
                        <div className="flex-1 relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all"
                            style={{ width: `${cohort[opt.key] || 0}%` }}
                          />
                        </div>
                        <button
                          onClick={() => adjustCohort(opt.key, (cohort[opt.key] || 0) + 5)}
                          className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
                        >
                          <Plus size={12} />
                        </button>
                        <span className="w-10 text-right text-sm font-mono text-gray-600 dark:text-gray-300">
                          {cohort[opt.key] || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Generate Preview
            </button>
          </div>

          {/* ============================================================ */}
          {/* Section 2: Preview Table                                      */}
          {/* ============================================================ */}
          {rows.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="px-5 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview: {rows.length} records ({selected.size} selected)
                </span>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                >
                  <RefreshCw size={13} />
                  Regenerate
                </button>
              </div>
              <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-3 py-2.5 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selected.size === rows.length}
                          onChange={toggleAll}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.width || ''}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          selected.has(idx)
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/10'
                            : idx % 2 === 0
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-gray-50/50 dark:bg-gray-800/30'
                        } hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(idx)}
                            onChange={() => toggleSelect(idx)}
                            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 font-mono">
                          {idx + 1}
                        </td>
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                            onDoubleClick={() => startEdit(idx, col.key)}
                          >
                            {editingCell?.row === idx && editingCell?.col === col.key ? (
                              <div className="flex items-center gap-1">
                                {col.type === 'select' && col.options ? (
                                  <select
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                    autoFocus
                                    className="w-full px-1.5 py-0.5 text-sm rounded border border-indigo-400 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {col.options.map((o) => (
                                      <option key={o} value={o}>{o}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={col.type === 'number' ? 'number' : 'text'}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                    autoFocus
                                    className="w-full px-1.5 py-0.5 text-sm rounded border border-indigo-400 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500"
                                  />
                                )}
                                <button onClick={commitEdit} className="text-green-500 hover:text-green-600"><Check size={14} /></button>
                                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-500"><X size={14} /></button>
                              </div>
                            ) : (
                              <span className="cursor-text group inline-flex items-center gap-1">
                                {col.type === 'number'
                                  ? Number(row[col.key]).toLocaleString()
                                  : String(row[col.key] ?? '')}
                                <Edit3 size={11} className="opacity-0 group-hover:opacity-40 text-gray-400 transition-opacity" />
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Section 3: Actions                                            */}
          {/* ============================================================ */}
          {rows.length > 0 && (
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleIngestAll}
                  disabled={ingestState === 'running'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {ingestState === 'running' ? (
                    <><Loader2 size={16} className="animate-spin" /> Ingesting...</>
                  ) : (
                    <><Upload size={16} /> Ingest All ({rows.length})</>
                  )}
                </button>

                <button
                  onClick={handleIngestSelected}
                  disabled={ingestState === 'running' || selected.size === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={16} /> Ingest Selected ({selected.size})
                </button>

                <button
                  onClick={handleFlush}
                  disabled={flushState === 'running'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {flushState === 'running' ? (
                    <><Loader2 size={16} className="animate-spin" /> Clearing...</>
                  ) : (
                    <><Trash2 size={16} /> Clear Demo Data</>
                  )}
                </button>
              </div>

              {/* Result feedback */}
              {ingestResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  ingestState === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {ingestState === 'success' ? <Check size={16} className="shrink-0 mt-0.5" /> : <X size={16} className="shrink-0 mt-0.5" />}
                  <span>{ingestResult}</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {rows.length === 0 && (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
              <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Configure options above and click <strong>Generate Preview</strong> to see synthetic data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DemoDataGenerator;

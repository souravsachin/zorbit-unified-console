import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Zap,
  Trash2,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Band {
  min: number;
  max: number;
  label: string;
  loadingPercentage: number;
  loadingFixed?: number;
  exclusionTags?: string[];
  waitPeriodMonths?: number;
}

interface LoadingTable {
  hashId: string;
  tableName: string;
  tableType: string;
  fieldPath: string;
  bands: Band[];
  scope: { productHashIds: string[]; variantHashIds: string[] };
  isActive: boolean;
  description: string;
  createdBy: string;
  createdAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<string, { text: string; bg: string; icon: string }> = {
  bmi:                { text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'bg-amber-500' },
  age:                { text: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'bg-blue-500' },
  occupation:         { text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: 'bg-orange-500' },
  geographic:         { text: 'text-cyan-700 dark:text-cyan-400',     bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: 'bg-cyan-500' },
  medical_condition:  { text: 'text-red-700 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-900/30', icon: 'bg-red-500' },
};

function getTypeStyle(t: string) {
  return TYPE_COLORS[t] || { text: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', icon: 'bg-gray-500' };
}

function loadingBar(pct: number) {
  const clamped = Math.min(pct, 100);
  let color = 'bg-green-500';
  if (clamped >= 25) color = 'bg-amber-500';
  if (clamped >= 50) color = 'bg-red-500';
  return { width: `${Math.max(clamped, 2)}%`, color };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const HIDecisioningLoadingTablesPage: React.FC = () => {
  const { orgId } = useAuth();
  const [tables, setTables] = useState<LoadingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [seeding, setSeeding] = useState(false);

  const base = API_CONFIG.HI_DECISIONING_URL;

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/loading-tables`);
      const d = res.data;
      setTables(d?.tables || (Array.isArray(d) ? d : d?.data || []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, [orgId]);

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      await api.post(`${base}/api/v1/O/${orgId}/hi-decisioning/loading-tables/seed-defaults`, {});
      await fetchTables();
    } catch {
      // ignore
    } finally {
      setSeeding(false);
    }
  };

  const deleteTable = async (hashId: string) => {
    if (!confirm('Delete this loading table?')) return;
    try {
      await api.delete(`${base}/api/v1/O/${orgId}/hi-decisioning/loading-tables/${hashId}`);
      setTables((prev) => prev.filter((t) => t.hashId !== hashId));
    } catch {
      // ignore
    }
  };

  const types = Array.from(new Set(tables.map((t) => t.tableType)));
  const filtered = filterType === 'all' ? tables : tables.filter((t) => t.tableType === filterType);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loading Tables</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tables.length} tables &middot; BMI, age, occupation, and geographic risk factor loading bands
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTables}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Seed Default Tables
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">Showing {filtered.length} of {tables.length}</span>
      </div>

      {/* Tables */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No loading tables found.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Seed Default Tables" to create BMI and age loading tables.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((table) => {
            const isExpanded = expandedTable === table.hashId;
            const typeStyle = getTypeStyle(table.tableType);

            return (
              <div
                key={table.hashId}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Table Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  onClick={() => setExpandedTable(isExpanded ? null : table.hashId)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                  <div className={`w-2 h-2 rounded-full ${typeStyle.icon} shrink-0`} />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text} w-28 text-center uppercase`}>
                    {table.tableType}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{table.tableName}</span>
                  <span className="text-xs text-gray-400">{table.bands.length} bands</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${table.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400'}`}>
                    {table.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Expanded: Band Table */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 space-y-4">
                    {table.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{table.description}</p>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Field Path:</span>{' '}
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{table.fieldPath}</span>
                    </div>

                    {/* Bands Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-2 font-medium">Band</th>
                            <th className="text-left py-2 px-2 font-medium">Range</th>
                            <th className="text-left py-2 px-2 font-medium">Loading %</th>
                            <th className="text-left py-2 px-2 font-medium w-48">Visual</th>
                            {table.bands.some((b) => b.loadingFixed != null) && (
                              <th className="text-left py-2 px-2 font-medium">Fixed</th>
                            )}
                            {table.bands.some((b) => b.exclusionTags?.length) && (
                              <th className="text-left py-2 px-2 font-medium">Exclusions</th>
                            )}
                            {table.bands.some((b) => b.waitPeriodMonths != null && b.waitPeriodMonths > 0) && (
                              <th className="text-left py-2 px-2 font-medium">Wait</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {table.bands.map((band, i) => {
                            const bar = loadingBar(band.loadingPercentage);
                            return (
                              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-200">{band.label}</td>
                                <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-400">{band.min} - {band.max}</td>
                                <td className="py-2 px-2">
                                  <span className={`font-semibold ${band.loadingPercentage === 0 ? 'text-green-600' : band.loadingPercentage >= 25 ? 'text-red-600' : 'text-amber-600'}`}>
                                    {band.loadingPercentage}%
                                  </span>
                                </td>
                                <td className="py-2 px-2">
                                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${bar.color}`} style={{ width: bar.width }} />
                                  </div>
                                </td>
                                {table.bands.some((b) => b.loadingFixed != null) && (
                                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                    {band.loadingFixed != null ? `${band.loadingFixed} AED` : '-'}
                                  </td>
                                )}
                                {table.bands.some((b) => b.exclusionTags?.length) && (
                                  <td className="py-2 px-2">
                                    {band.exclusionTags?.map((t) => (
                                      <span key={t} className="text-[10px] px-1 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 mr-1">{t}</span>
                                    ))}
                                  </td>
                                )}
                                {table.bands.some((b) => b.waitPeriodMonths != null && b.waitPeriodMonths > 0) && (
                                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                    {band.waitPeriodMonths ? `${band.waitPeriodMonths}m` : '-'}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-[10px] text-gray-400 space-x-4">
                        <span>ID: {table.hashId}</span>
                        {table.createdAt && <span>Created: {new Date(table.createdAt).toLocaleDateString()}</span>}
                        {table.createdBy && <span>By: {table.createdBy}</span>}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTable(table.hashId); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HIDecisioningLoadingTablesPage;

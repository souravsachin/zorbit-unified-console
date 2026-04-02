import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Download,
  Upload,
  Loader2,
  Zap,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RuleCondition {
  fieldPath: string;
  operator: string;
  value: unknown;
  valueType: string;
}

interface Rule {
  hashId: string;
  ruleName: string;
  ruleCode: string;
  category: string;
  priority: number;
  isActive: boolean;
  canAutomate: boolean;
  action: string;
  loadingType: string | null;
  loadingValue: number | null;
  loadingMin: number | null;
  loadingMax: number | null;
  exclusionTags: string[];
  waitPeriodMonths: number | null;
  processingBehavior: string;
  conditions: RuleCondition[];
  description: string;
  notes: string;
  scope: { productHashIds: string[]; variantHashIds: string[] };
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  General:              { text: 'text-gray-700 dark:text-gray-300',   bg: 'bg-gray-100 dark:bg-gray-700' },
  Age:                  { text: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
  BMI:                  { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'Medical Condition':  { text: 'text-red-700 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30' },
  Lifestyle:            { text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  Financial:            { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  Geographic:           { text: 'text-cyan-700 dark:text-cyan-400',   bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  Occupation:           { text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  accept_as_is:          { label: 'Accept As-Is',         color: 'text-green-600 dark:text-green-400' },
  accept_with_loading:   { label: 'Accept + Loading',     color: 'text-green-600 dark:text-green-400' },
  accept_with_wait_period: { label: 'Accept + Wait',      color: 'text-green-600 dark:text-green-400' },
  accept_with_exclusion: { label: 'Accept + Exclusion',   color: 'text-green-600 dark:text-green-400' },
  accept_with_combination: { label: 'Accept + Combo',     color: 'text-green-600 dark:text-green-400' },
  deny:                  { label: 'Deny',                 color: 'text-red-600 dark:text-red-400' },
  cancelled_reapply:     { label: 'Cancel & Reapply',     color: 'text-red-600 dark:text-red-400' },
  manual_review:         { label: 'Manual Review',        color: 'text-amber-600 dark:text-amber-400' },
  incomplete_application: { label: 'Incomplete',          color: 'text-amber-600 dark:text-amber-400' },
  request_more_data:     { label: 'Request Data',         color: 'text-amber-600 dark:text-amber-400' },
  request_documents:     { label: 'Request Docs',         color: 'text-amber-600 dark:text-amber-400' },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] || { label: action, color: 'text-gray-600' };
}

function getCatStyle(cat: string) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;
}

function shortFieldPath(fp: string) {
  // Show only the last meaningful segment for display
  const parts = fp.replace(/\[\]/g, '').split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : fp;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const HIDecisioningRulesPage: React.FC = () => {
  const { orgId } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const base = API_CONFIG.HI_DECISIONING_URL;

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/rules`);
      const d = res.data;
      setRules(d?.rules || (Array.isArray(d) ? d : d?.data || []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, [orgId]);

  const toggleRule = async (hashId: string, currentActive: boolean) => {
    setToggling(hashId);
    try {
      await api.patch(`${base}/api/v1/O/${orgId}/hi-decisioning/rules/${hashId}/toggle`, {
        isActive: !currentActive,
      });
      setRules((prev) => prev.map((r) => r.hashId === hashId ? { ...r, isActive: !currentActive } : r));
    } catch {
      // silently fail, refresh will fix
    } finally {
      setToggling(null);
    }
  };

  const deleteRule = async (hashId: string) => {
    if (!confirm('Delete this rule? This cannot be undone.')) return;
    try {
      await api.delete(`${base}/api/v1/O/${orgId}/hi-decisioning/rules/${hashId}`);
      setRules((prev) => prev.filter((r) => r.hashId !== hashId));
    } catch {
      // ignore
    }
  };

  const loadPreset = async () => {
    setLoadingPreset(true);
    try {
      await api.post(`${base}/api/v1/O/${orgId}/hi-decisioning/rules/load-preset`, {});
      await fetchRules();
    } catch {
      // ignore
    } finally {
      setLoadingPreset(false);
    }
  };

  const exportRules = async () => {
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/rules/export`);
      const blob = new Blob([JSON.stringify(res.data.rules, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hi-decisioning-rules.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  // Filter logic
  const categories = Array.from(new Set(rules.map((r) => r.category)));
  const filtered = rules.filter((r) => {
    if (filterCat !== 'all' && r.category !== filterCat) return false;
    if (filterActive === 'active' && !r.isActive) return false;
    if (filterActive === 'inactive' && r.isActive) return false;
    return true;
  });

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40">
            <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Underwriting Rules</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rules.length} rules ({activeCount} active) &middot; Condition-action rule engine with priority execution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRules}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportRules}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            onClick={loadPreset}
            disabled={loadingPreset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loadingPreset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Load Preset Rules
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
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <span className="text-xs text-gray-400">
          Showing {filtered.length} of {rules.length}
        </span>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No rules found.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Load Preset Rules" to seed the default 15 STP/NSTP rules.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rule) => {
            const isExpanded = expandedRule === rule.hashId;
            const catStyle = getCatStyle(rule.category);
            const actionInfo = getActionInfo(rule.action);

            return (
              <div
                key={rule.hashId}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Rule Header Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  onClick={() => setExpandedRule(isExpanded ? null : rule.hashId)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                  <span className="text-xs font-bold text-gray-400 w-8 text-center">P{rule.priority}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${catStyle.bg} ${catStyle.text} w-28 text-center truncate`}>
                    {rule.category}
                  </span>
                  <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400 w-28 truncate">{rule.ruleCode}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{rule.ruleName}</span>
                  <span className={`text-xs font-semibold ${actionInfo.color}`}>{actionInfo.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${rule.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                    {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  {rule.processingBehavior === 'stop' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 font-mono">STOP</span>
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 space-y-4">
                    {/* Description */}
                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                    )}

                    {/* Conditions */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Conditions ({rule.conditions.length})
                      </h4>
                      {rule.conditions.length > 0 ? (
                        <div className="space-y-1">
                          {rule.conditions.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                              <span className="font-mono text-indigo-600 dark:text-indigo-400">{shortFieldPath(c.fieldPath)}</span>
                              <span className="font-semibold text-gray-500">{c.operator.replace(/_/g, ' ')}</span>
                              <span className="text-gray-800 dark:text-gray-200 font-mono">
                                {Array.isArray(c.value) ? c.value.join(', ') : String(c.value)}
                              </span>
                              <span className="text-gray-400 ml-auto">({c.valueType})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No conditions defined (always matches)</p>
                      )}
                    </div>

                    {/* Action Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 uppercase">Action</p>
                        <p className={`text-sm font-semibold ${actionInfo.color}`}>{actionInfo.label}</p>
                      </div>
                      {rule.loadingType && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 uppercase">Loading</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {rule.loadingValue}{rule.loadingType === 'percentage' ? '%' : ' AED'}
                            {rule.loadingMin != null && ` (${rule.loadingMin}-${rule.loadingMax})`}
                          </p>
                        </div>
                      )}
                      {rule.waitPeriodMonths != null && rule.waitPeriodMonths > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 uppercase">Wait Period</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{rule.waitPeriodMonths} months</p>
                        </div>
                      )}
                      {rule.exclusionTags.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 uppercase">Exclusions</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {rule.exclusionTags.map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 uppercase">Processing</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{rule.processingBehavior}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 uppercase">Automate</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{rule.canAutomate ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {rule.notes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                        <span className="font-semibold">Notes:</span> {rule.notes}
                      </div>
                    )}

                    {/* Meta + Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-[10px] text-gray-400 space-x-4">
                        <span>ID: {rule.hashId}</span>
                        {rule.createdAt && <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>}
                        {rule.createdBy && <span>By: {rule.createdBy}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleRule(rule.hashId, rule.isActive); }}
                          disabled={toggling === rule.hashId}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {rule.isActive
                            ? <><ToggleRight className="h-3 w-3 text-green-500" /> Deactivate</>
                            : <><ToggleLeft className="h-3 w-3 text-gray-400" /> Activate</>
                          }
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRule(rule.hashId); }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
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

export default HIDecisioningRulesPage;

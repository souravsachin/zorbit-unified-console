import React, { useEffect, useState } from 'react';
import {
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MatchedRule {
  ruleHashId: string | null;
  ruleName: string | null;
  action: string | null;
  loadingApplied: Record<string, unknown> | null;
}

interface EvaluationDetail {
  ruleHashId?: string;
  ruleName?: string;
  ruleCode?: string;
  matched?: boolean;
  action?: string;
  conditionsChecked?: number;
  conditionsPassed?: number;
  [key: string]: unknown;
}

interface Evaluation {
  hashId: string;
  quotationHashId: string;
  memberIndex: number;
  rulesEvaluated: number;
  rulesMatched: number;
  matchedRule: MatchedRule;
  decision: string;
  evaluatedBy: string;
  evaluatedAt: string;
  durationMs: number;
  details: EvaluationDetail[];
  createdAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Decision Badge                                                     */
/* ------------------------------------------------------------------ */

function DecisionBadge({ decision }: { decision: string }) {
  let icon = <AlertTriangle className="h-3 w-3" />;
  let cls = 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';

  if (decision === 'STP') {
    icon = <CheckCircle2 className="h-3 w-3" />;
    cls = 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
  } else if (decision === 'NSTP' || decision === 'MANUAL') {
    icon = <XCircle className="h-3 w-3" />;
    cls = 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${cls}`}>
      {icon} {decision}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const HIDecisioningEvaluationsPage: React.FC = () => {
  const { orgId } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, Evaluation>>({});
  const limit = 25;

  const base = API_CONFIG.HI_DECISIONING_URL;

  const fetchEvaluations = async (p: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/evaluations?page=${p}&limit=${limit}`);
      const d = res.data;
      const list = d?.evaluations || (Array.isArray(d) ? d : d?.data || []);
      setEvaluations(list);
      setTotal(d?.total ?? list.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvaluations(); }, [orgId, page]);

  const fetchDetail = async (hashId: string) => {
    if (detailCache[hashId]) return;
    setLoadingDetail(hashId);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/evaluations/${hashId}`);
      const ev = res.data?.evaluation || res.data;
      setDetailCache((prev) => ({ ...prev, [hashId]: ev }));
    } catch {
      // ignore
    } finally {
      setLoadingDetail(null);
    }
  };

  const toggleExpand = (hashId: string) => {
    if (expandedId === hashId) {
      setExpandedId(null);
    } else {
      setExpandedId(hashId);
      fetchDetail(hashId);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Stats
  const stpCount = evaluations.filter((e) => e.decision === 'STP').length;
  const nstpCount = evaluations.filter((e) => e.decision !== 'STP').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} evaluations &middot; Full audit trail of underwriting rule evaluations
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchEvaluations()}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Page Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{evaluations.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">STP (Auto-Approved)</p>
          <p className="text-xl font-bold text-green-600">{stpCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">NSTP / Manual</p>
          <p className="text-xl font-bold text-red-600">{nstpCount}</p>
        </div>
      </div>

      {/* Evaluations List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No evaluations found.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Submit a quotation for evaluation to generate history records.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evaluations.map((ev) => {
            const isExpanded = expandedId === ev.hashId;
            const detail = detailCache[ev.hashId];

            return (
              <div
                key={ev.hashId}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Row Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  onClick={() => toggleExpand(ev.hashId)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 w-28 truncate">{ev.quotationHashId}</span>
                  {ev.memberIndex > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                      Member {ev.memberIndex}
                    </span>
                  )}
                  <DecisionBadge decision={ev.decision} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                    {ev.rulesEvaluated} rules evaluated, {ev.rulesMatched} matched
                  </span>
                  {ev.matchedRule?.action && (
                    <span className="text-[10px] font-mono text-gray-500">{ev.matchedRule.action}</span>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ev.durationMs}ms
                  </span>
                  <span className="text-[10px] text-gray-400 w-32 text-right">
                    {new Date(ev.evaluatedAt || ev.createdAt || '').toLocaleString()}
                  </span>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 space-y-4">
                    {loadingDetail === ev.hashId ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        {/* Matched Rule Summary */}
                        {ev.matchedRule?.ruleName && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Primary Matched Rule</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ev.matchedRule.ruleName}</span>
                              <span className="text-xs font-mono text-gray-400">{ev.matchedRule.ruleHashId}</span>
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{ev.matchedRule.action}</span>
                            </div>
                            {ev.matchedRule.loadingApplied && (
                              <div className="mt-1 text-xs text-gray-500">
                                Loading: {JSON.stringify(ev.matchedRule.loadingApplied)}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Per-Rule Detail Trace */}
                        {(detail?.details || ev.details || []).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Rule Execution Trace
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-2 px-2 font-medium">Rule</th>
                                    <th className="text-left py-2 px-2 font-medium">Code</th>
                                    <th className="text-center py-2 px-2 font-medium">Match</th>
                                    <th className="text-left py-2 px-2 font-medium">Action</th>
                                    <th className="text-left py-2 px-2 font-medium">Conditions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                  {(detail?.details || ev.details || []).map((d, i) => (
                                    <tr key={i} className={d.matched ? 'bg-green-50/50 dark:bg-green-900/10' : ''}>
                                      <td className="py-2 px-2 text-gray-800 dark:text-gray-200">{d.ruleName || '-'}</td>
                                      <td className="py-2 px-2 font-mono text-gray-400">{d.ruleCode || d.ruleHashId || '-'}</td>
                                      <td className="py-2 px-2 text-center">
                                        {d.matched
                                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                                          : <XCircle className="h-3.5 w-3.5 text-gray-300 mx-auto" />
                                        }
                                      </td>
                                      <td className="py-2 px-2 font-semibold">
                                        {d.matched ? (
                                          <span className="text-indigo-600 dark:text-indigo-400">{d.action || '-'}</span>
                                        ) : (
                                          <span className="text-gray-300">-</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-gray-400">
                                        {d.conditionsChecked != null ? `${d.conditionsPassed}/${d.conditionsChecked} passed` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Meta */}
                        <div className="text-[10px] text-gray-400 space-x-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <span>ID: {ev.hashId}</span>
                          <span>Evaluated by: {ev.evaluatedBy}</span>
                          <span>Duration: {ev.durationMs}ms</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HIDecisioningEvaluationsPage;

import React, { useEffect, useState } from 'react';
import {
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Zap,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StpCriteria {
  hashId: string;
  criteriaName: string;
  description: string;
  minAge: number;
  maxAge: number;
  minBmi: number;
  maxBmi: number;
  maxSumInsured: number | null;
  maxPremium: number | null;
  maxMembers: number;
  disqualifyingConditions: string[];
  disqualifyingMafQuestionKeys: string[];
  maxTotalLoadingPercentage: number;
  scope: { productHashIds: string[]; variantHashIds: string[] };
  isActive: boolean;
  createdBy: string;
  createdAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const HIDecisioningStpCriteriaPage: React.FC = () => {
  const { orgId } = useAuth();
  const [criteria, setCriteria] = useState<StpCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const base = API_CONFIG.HI_DECISIONING_URL;

  const fetchCriteria = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/stp-criteria`);
      const d = res.data;
      setCriteria(d?.criteria || (Array.isArray(d) ? d : d?.data || []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load STP criteria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCriteria(); }, [orgId]);

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      await api.post(`${base}/api/v1/O/${orgId}/hi-decisioning/stp-criteria/seed-defaults`, {});
      await fetchCriteria();
    } catch {
      // ignore
    } finally {
      setSeeding(false);
    }
  };

  const deleteCriteria = async (hashId: string) => {
    if (!confirm('Delete this STP criteria set?')) return;
    try {
      await api.delete(`${base}/api/v1/O/${orgId}/hi-decisioning/stp-criteria/${hashId}`);
      setCriteria((prev) => prev.filter((c) => c.hashId !== hashId));
    } catch {
      // ignore
    }
  };

  const formatCurrency = (v: number | null) => {
    if (v == null) return 'No limit';
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(v);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">STP Criteria</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {criteria.length} criteria sets &middot; Define thresholds for automatic straight-through processing approval
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCriteria}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Seed Default Criteria
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800/30 px-4 py-3">
        <p className="text-xs text-green-700 dark:text-green-400">
          <strong>How STP works:</strong> When a quotation is evaluated, it is checked against all active STP criteria.
          If ALL criteria pass (age, BMI, sum insured, medical conditions, etc.), the quotation is auto-approved.
          If any criterion fails, it routes to NSTP for manual underwriter review.
        </p>
      </div>

      {/* Criteria List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : criteria.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No STP criteria defined.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Seed Default Criteria" to create standard STP thresholds.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((c) => {
            const isExpanded = expandedId === c.hashId;

            return (
              <div
                key={c.hashId}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : c.hashId)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{c.criteriaName}</span>
                  <span className="text-xs text-gray-400">{c.disqualifyingConditions.length} disqualifiers</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${c.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400'}`}>
                    {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 space-y-4">
                    {c.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
                    )}

                    {/* Threshold Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <ThresholdCard label="Age Range" value={`${c.minAge} - ${c.maxAge} years`} pass />
                      <ThresholdCard label="BMI Range" value={`${c.minBmi} - ${c.maxBmi}`} pass />
                      <ThresholdCard label="Max Sum Insured" value={formatCurrency(c.maxSumInsured)} pass={c.maxSumInsured != null} />
                      <ThresholdCard label="Max Premium" value={formatCurrency(c.maxPremium)} pass={c.maxPremium != null} />
                      <ThresholdCard label="Max Members" value={String(c.maxMembers)} pass />
                      <ThresholdCard label="Max Loading %" value={`${c.maxTotalLoadingPercentage}%`} pass />
                    </div>

                    {/* Disqualifying Conditions */}
                    {c.disqualifyingConditions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Disqualifying Medical Conditions ({c.disqualifyingConditions.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {c.disqualifyingConditions.map((cond) => (
                            <span
                              key={cond}
                              className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30"
                            >
                              {cond}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disqualifying MAF Questions */}
                    {c.disqualifyingMafQuestionKeys.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Disqualifying MAF Questions ({c.disqualifyingMafQuestionKeys.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {c.disqualifyingMafQuestionKeys.map((q) => (
                            <span
                              key={q}
                              className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 font-mono"
                            >
                              {q}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-[10px] text-gray-400 space-x-4">
                        <span>ID: {c.hashId}</span>
                        {c.createdAt && <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>}
                        {c.createdBy && <span>By: {c.createdBy}</span>}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCriteria(c.hashId); }}
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

/* ------------------------------------------------------------------ */
/*  Sub-component: Threshold Card                                      */
/* ------------------------------------------------------------------ */

const ThresholdCard: React.FC<{ label: string; value: string; pass?: boolean }> = ({ label, value, pass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
    <div className="flex items-center gap-1.5 mb-0.5">
      {pass ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-gray-300" />
      )}
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
    </div>
    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
  </div>
);

export default HIDecisioningStpCriteriaPage;

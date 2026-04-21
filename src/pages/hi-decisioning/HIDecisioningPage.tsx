import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Scale,
  BookOpen,
  Activity,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  BarChart3,
  Shield,
  Code,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Lazy Sub-Pages                                                     */
/* ------------------------------------------------------------------ */

const HIDecisioningRulesPage = React.lazy(() => import('./HIDecisioningRulesPage'));
const HIDecisioningLoadingTablesPage = React.lazy(() => import('./HIDecisioningLoadingTablesPage'));
const HIDecisioningStpCriteriaPage = React.lazy(() => import('./HIDecisioningStpCriteriaPage'));
const HIDecisioningEvaluationsPage = React.lazy(() => import('./HIDecisioningEvaluationsPage'));
const HIDecisioningFieldsPage = React.lazy(() => import('./HIDecisioningFieldsPage'));

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Rule {
  hashId: string;
  name: string;
  code: string;
  category?: string;
  ruleType?: string;
  priority?: number;
  isActive?: boolean;
  conditions?: unknown[];
  actions?: unknown[];
  description?: string;
}

interface Evaluation {
  hashId: string;
  quotationHashId: string;
  decision: string;
  rulesEvaluated: number;
  rulesFired: number;
  createdAt: string;
}

interface HealthStatus {
  status: string;
  service: string;
  mongodb?: { connected: boolean; readyState: number };
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Tab Definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'overview', label: 'Overview', path: '/hi-uw-decisioning', icon: Scale },
  { key: 'rules', label: 'Rules', path: '/hi-uw-decisioning/rules', icon: BookOpen },
  { key: 'loading-tables', label: 'Loading Tables', path: '/hi-uw-decisioning/loading-tables', icon: BarChart3 },
  { key: 'stp-criteria', label: 'STP Criteria', path: '/hi-uw-decisioning/stp-criteria', icon: Shield },
  { key: 'evaluations', label: 'Evaluations', path: '/hi-uw-decisioning/evaluations', icon: Activity },
  { key: 'fields', label: 'Fields', path: '/hi-uw-decisioning/fields', icon: Code },
];

/* ------------------------------------------------------------------ */
/*  API Endpoints Reference                                            */
/* ------------------------------------------------------------------ */

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/G/hi-uw-decisioning/health', description: 'Service health check' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/rules', description: 'List all rules' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/rules', description: 'Create a rule' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/rules/export', description: 'Export rules as JSON' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/rules/:hashId', description: 'Get rule by ID' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/rules/import', description: 'Import rules from JSON' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/rules/load-preset', description: 'Load preset STP/NSTP rules (15 rules)' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/evaluate/:quotationHashId', description: 'Evaluate quotation against rules' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/evaluations', description: 'List evaluation history' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/evaluations/:hashId', description: 'Get evaluation details' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/available-fields', description: 'Available fields for rule conditions' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/loading-tables', description: 'List loading tables' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/loading-tables', description: 'Create loading table' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/loading-tables/seed-defaults', description: 'Seed BMI + age defaults' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-uw-decisioning/stp-criteria', description: 'List STP criteria' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/stp-criteria', description: 'Create STP criteria' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/stp-criteria/seed-defaults', description: 'Seed default STP criteria' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-uw-decisioning/stp-criteria/check', description: 'Check STP eligibility' },
];

/* ------------------------------------------------------------------ */
/*  Rule Category Colors                                               */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  stp: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  nstp: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  medical: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  financial: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  compliance: { color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  default: { color: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
};

function getCategoryStyle(cat: string | undefined) {
  return CATEGORY_COLORS[cat?.toLowerCase() || ''] || CATEGORY_COLORS.default;
}

/* ------------------------------------------------------------------ */
/*  Determine Active Tab from URL                                      */
/* ------------------------------------------------------------------ */

function getActiveTab(pathname: string): string {
  // Strip trailing slash
  const p = pathname.replace(/\/$/, '');
  if (p.endsWith('/rules')) return 'rules';
  if (p.endsWith('/loading-tables')) return 'loading-tables';
  if (p.endsWith('/stp-criteria')) return 'stp-criteria';
  if (p.endsWith('/evaluations')) return 'evaluations';
  if (p.endsWith('/fields')) return 'fields';
  return 'overview';
}

/* ------------------------------------------------------------------ */
/*  Overview Component (original dashboard)                            */
/* ------------------------------------------------------------------ */

const OverviewTab: React.FC = () => {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [rulesTotal, setRulesTotal] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evalTotal, setEvalTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = API_CONFIG.HI_DECISIONING_URL;
      const [healthRes, rulesRes, evalsRes] = await Promise.allSettled([
        api.get(`${base}/api/v1/G/hi-uw-decisioning/health`),
        api.get(`${base}/api/v1/O/${orgId}/hi-uw-decisioning/rules`),
        api.get(`${base}/api/v1/O/${orgId}/hi-uw-decisioning/evaluations`),
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (rulesRes.status === 'fulfilled') {
        const d = rulesRes.value.data;
        const list = d?.rules || (Array.isArray(d) ? d : d?.data || []);
        setRules(list);
        setRulesTotal(d?.total ?? list.length);
      }
      if (evalsRes.status === 'fulfilled') {
        const d = evalsRes.value.data;
        const list = d?.evaluations || (Array.isArray(d) ? d : d?.data || []);
        setEvaluations(list);
        setEvalTotal(d?.total ?? list.length);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';

  // Compute category breakdown
  const categoryCounts = new Map<string, number>();
  rules.forEach((r) => {
    const cat = r.category || r.ruleType || 'uncategorized';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  const activeRules = rules.filter((r) => r.isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : isHealthy ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Service: <span className="font-mono">{health?.service || 'zorbit-app-hi_uw_decisioning'}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isHealthy ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {health?.status || 'checking...'}
          </span>
          {health?.mongodb && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${health.mongodb.connected ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600'}`}>
              MongoDB: {health.mongodb.connected ? 'connected' : 'disconnected'}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto font-mono">Port 3116</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => navigate('/hi-uw-decisioning/rules')}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Rules</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{rulesTotal}</p>
        </div>
        <div
          onClick={() => navigate('/hi-uw-decisioning/rules')}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Rules</p>
          <p className="text-2xl font-bold text-green-600">{activeRules}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Categories</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{categoryCounts.size}</p>
        </div>
        <div
          onClick={() => navigate('/hi-uw-decisioning/evaluations')}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">Evaluations</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{evalTotal}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryCounts.size > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Rule Categories</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(categoryCounts.entries()).map(([cat, count]) => {
              const style = getCategoryStyle(cat);
              return (
                <span key={cat} className={`text-xs font-semibold px-2 py-1 rounded ${style.bg} ${style.color}`}>
                  {cat} ({count})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links to Sub-Pages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Rules Engine', desc: 'Manage condition-action rules', path: '/hi-uw-decisioning/rules', icon: BookOpen, color: 'rose' },
          { label: 'Loading Tables', desc: 'BMI, age, occupation bands', path: '/hi-uw-decisioning/loading-tables', icon: BarChart3, color: 'amber' },
          { label: 'STP Criteria', desc: 'Auto-approval thresholds', path: '/hi-uw-decisioning/stp-criteria', icon: Shield, color: 'green' },
          { label: 'Field Introspection', desc: 'Available fields & operators', path: '/hi-uw-decisioning/fields', icon: Code, color: 'violet' },
        ].map((link) => (
          <div
            key={link.path}
            onClick={() => navigate(link.path)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
          >
            <link.icon className={`h-5 w-5 text-${link.color}-500 mb-2`} />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{link.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{link.desc}</p>
          </div>
        ))}
      </div>

      {/* Rules Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Rules</h2>
            <span className="text-xs text-gray-400">({rulesTotal})</span>
          </div>
          <button
            onClick={() => navigate('/hi-uw-decisioning/rules')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all
          </button>
        </div>
        {rules.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {rules.slice(0, 8).map((rule) => {
              const catStyle = getCategoryStyle(rule.category || rule.ruleType);
              return (
                <div key={rule.hashId || rule.code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catStyle.bg} ${catStyle.color} w-20 text-center truncate`}>
                    {rule.category || rule.ruleType || 'general'}
                  </span>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 w-32 truncate">{rule.code}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{rule.name}</span>
                  {rule.priority !== undefined && (
                    <span className="text-xs text-gray-400">P{rule.priority}</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${rule.isActive !== false ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400'}`}>
                    {rule.isActive !== false ? 'active' : 'inactive'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            No rules found. Use the "Load Preset" endpoint or go to Rules page to seed 15 STP/NSTP rules.
          </div>
        )}
      </div>

      {/* Evaluation History Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Evaluations</h2>
            <span className="text-xs text-gray-400">({evalTotal})</span>
          </div>
          <button
            onClick={() => navigate('/hi-uw-decisioning/evaluations')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all
          </button>
        </div>
        {evaluations.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {evaluations.slice(0, 10).map((ev) => (
              <div key={ev.hashId} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <span className="font-mono text-gray-500 w-24 truncate">{ev.quotationHashId}</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${ev.decision === 'STP' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {ev.decision}
                </span>
                <span className="text-gray-400">{ev.rulesEvaluated} evaluated, {ev.rulesFired} fired</span>
                <span className="text-gray-400 ml-auto">{new Date(ev.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            No evaluations yet. Submit a quotation for evaluation to see results here.
          </div>
        )}
      </div>

      {/* API Endpoints */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">API Endpoints</h2>
          <span className="text-xs text-gray-400">({API_ENDPOINTS.length})</span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {API_ENDPOINTS.map((ep, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-2 text-xs">
              <span className={`font-mono font-bold w-12 ${ep.method === 'GET' ? 'text-green-600' : 'text-blue-600'}`}>
                {ep.method}
              </span>
              <span className="font-mono text-gray-600 dark:text-gray-400 flex-1">{ep.path}</span>
              <span className="text-gray-400">{ep.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Page Component (Router)                                       */
/* ------------------------------------------------------------------ */

const HIDecisioningPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40">
            <Scale className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HI UW Decisioning</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Health insurance underwriting rules engine — STP/NSTP rules, condition builder, evaluation history
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://zorbit.scalatics.com/api/hi-uw-decisioning/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Swagger Docs
          </a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'rules' && <HIDecisioningRulesPage />}
        {activeTab === 'loading-tables' && <HIDecisioningLoadingTablesPage />}
        {activeTab === 'stp-criteria' && <HIDecisioningStpCriteriaPage />}
        {activeTab === 'evaluations' && <HIDecisioningEvaluationsPage />}
        {activeTab === 'fields' && <HIDecisioningFieldsPage />}
      </React.Suspense>
    </div>
  );
};

export default HIDecisioningPage;

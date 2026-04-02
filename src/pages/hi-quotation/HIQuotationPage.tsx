import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, FileText, HelpCircle, Layers, ExternalLink, Loader2, CheckCircle2, XCircle, RefreshCw, Plus, Lock, Shield, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { usePiiVisibility } from '../../hooks/usePiiVisibility';
import { maskPiiValue } from '../../components/ZorbitDataTable/PiiMask';
import { getNickname } from '../../utils/pii-nicknames';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Quotation {
  hashId: string;
  quotationNumber?: string;
  status?: string;
  proposerName?: string;
  productCode?: string;
  sumInsured?: number;
  createdAt: string;
}

interface MAFQuestion {
  hashId: string;
  code: string;
  question: string;
  category?: string;
  questionType?: string;
  isRequired?: boolean;
}

interface MAFQuestionSet {
  hashId: string;
  name: string;
  code: string;
  description?: string;
  questionCount?: number;
}

interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  API Endpoints Reference                                            */
/* ------------------------------------------------------------------ */

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/G/hi-quotation/health', description: 'Service health check' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-quotation/quotations', description: 'Create quotation' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-quotation/quotations', description: 'List quotations' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-quotation/quotations/:hashId', description: 'Get quotation details' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-quotation/quotations/:hashId/members', description: 'Add member to quotation' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-quotation/quotations/:hashId/queries', description: 'Add query to quotation' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-quotation/maf-questions', description: 'Create MAF question' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-quotation/maf-questions', description: 'List MAF questions' },
  { method: 'POST', path: '/api/v1/O/:orgId/hi-quotation/maf-question-sets', description: 'Create MAF question set' },
  { method: 'GET', path: '/api/v1/O/:orgId/hi-quotation/maf-question-sets', description: 'List MAF question sets' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/** Render a proposer name respecting PII visibility level */
function renderPiiName(name: string | undefined, vis: 'full' | 'nickname' | 'masked' | 'hidden'): React.ReactNode {
  if (!name) return 'Quotation';
  if (vis === 'full') return name;
  if (vis === 'hidden') return (
    <span className="inline-flex items-center gap-1">
      <Shield className="h-3 w-3 text-red-400" />
      <span className="text-red-400 text-xs font-semibold uppercase">Restricted</span>
    </span>
  );
  if (vis === 'nickname') {
    const alias = getNickname(name);
    return (
      <span className="inline-flex items-center gap-1">
        <UserIcon className="h-3 w-3 text-blue-400" />
        <span title="PII alias">{alias}</span>
        <span className="text-[9px] font-semibold uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-500 px-1 py-0.5 rounded leading-none">alias</span>
      </span>
    );
  }
  // masked
  const masked = maskPiiValue(name, 'proposerName');
  return (
    <span className="inline-flex items-center gap-1">
      <Lock className="h-3 w-3 text-amber-400" />
      <span className="font-mono text-xs text-gray-500">{masked}</span>
    </span>
  );
}

const HIQuotationPage: React.FC = () => {
  const { orgId, user } = useAuth();
  const { visibility } = usePiiVisibility(user?.email);
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsTotal, setQuotationsTotal] = useState(0);
  const [mafQuestions, setMafQuestions] = useState<MAFQuestion[]>([]);
  const [questionSets, setQuestionSets] = useState<MAFQuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = API_CONFIG.HI_QUOTATION_URL;
      const [healthRes, quotRes, mafRes, setsRes] = await Promise.allSettled([
        api.get(`${base}/api/v1/G/hi-quotation/health`),
        api.get(`${base}/api/v1/O/${orgId}/hi-quotation/quotations`),
        api.get(`${base}/api/v1/O/${orgId}/hi-quotation/maf-questions`),
        api.get(`${base}/api/v1/O/${orgId}/hi-quotation/maf-question-sets`),
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (quotRes.status === 'fulfilled') {
        const d = quotRes.value.data;
        const list = d?.items || (Array.isArray(d) ? d : d?.data || []);
        setQuotations(list);
        setQuotationsTotal(d?.total ?? list.length);
      }
      if (mafRes.status === 'fulfilled') {
        const d = mafRes.value.data;
        setMafQuestions(Array.isArray(d) ? d : d?.data || []);
      }
      if (setsRes.status === 'fulfilled') {
        const d = setsRes.value.data;
        setQuestionSets(Array.isArray(d) ? d : d?.data || []);
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

  // Group MAF questions by category
  const mafByCategory = new Map<string, number>();
  mafQuestions.forEach((q) => {
    const cat = q.category || q.questionType || 'general';
    mafByCategory.set(cat, (mafByCategory.get(cat) || 0) + 1);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/40">
            <HeartPulse className="w-7 h-7 text-fuchsia-600 dark:text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HI Quotation System</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Health insurance retail/individual quotation — MAF questions, members, deep nested documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Application
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="https://zorbit.scalatics.com/api/hi-quotation/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Swagger Docs
          </a>
        </div>
      </div>

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
            Service: <span className="font-mono">{health?.service || 'zorbit-app-hi_quotation'}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isHealthy ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {health?.status || 'checking...'}
          </span>
          <span className="text-xs text-gray-400 ml-auto font-mono">Port 3117</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Quotations</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{quotationsTotal}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">MAF Questions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{mafQuestions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Question Sets</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{questionSets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Question Categories</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{mafByCategory.size}</p>
        </div>
      </div>

      {/* MAF Question Categories */}
      {mafByCategory.size > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-fuchsia-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">MAF Question Categories</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(mafByCategory.entries()).map(([cat, count]) => (
              <span key={cat} className="text-xs font-semibold px-2 py-1 rounded bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400">
                {cat} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quotations List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4 text-fuchsia-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Quotations</h2>
          <span className="text-xs text-gray-400">({quotationsTotal})</span>
        </div>
        {quotations.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {quotations.slice(0, 20).map((q) => (
              <div key={q.hashId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <span className="text-xs font-mono text-gray-500 w-24 truncate">{q.hashId}</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                  {q.quotationNumber || renderPiiName(q.proposerName, visibility)}
                </span>
                {q.status && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    {q.status}
                  </span>
                )}
                {q.productCode && (
                  <span className="text-xs text-gray-400 font-mono">{q.productCode}</span>
                )}
                <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            No quotations yet. Create a quotation via the API to see data here.
          </div>
        )}
      </div>

      {/* MAF Questions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">MAF Questions</h2>
          <span className="text-xs text-gray-400">({mafQuestions.length})</span>
        </div>
        {mafQuestions.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {mafQuestions.map((q) => (
              <div key={q.hashId || q.code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 w-28 truncate">{q.code}</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{q.question}</span>
                {q.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {q.category}
                  </span>
                )}
                {q.isRequired && (
                  <span className="text-[10px] text-red-500 font-semibold">required</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            No MAF questions seeded yet. Create questions via the API.
          </div>
        )}
      </div>

      {/* Question Sets */}
      {questionSets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">MAF Question Sets</h2>
            <span className="text-xs text-gray-400">({questionSets.length})</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {questionSets.map((set) => (
              <div key={set.hashId || set.code} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 w-28 truncate">{set.code}</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{set.name}</span>
                {set.description && (
                  <span className="text-xs text-gray-400 max-w-[200px] truncate">{set.description}</span>
                )}
                {set.questionCount !== undefined && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                    {set.questionCount} questions
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

export default HIQuotationPage;

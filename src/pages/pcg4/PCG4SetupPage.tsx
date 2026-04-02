import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Activity,
  Shield,
  Download,
  Copy,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import {
  getSetupTables,
  getSetupStats,
  startSetupSSE,
  type SetupTableInfo,
  type SetupLogEvent,
} from '../../api/pcg4Api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetupStats {
  configurations: { total: number; draft: number; inReview: number; published: number; archived: number };
  plans: { total: number };
  encounterTypes: { total: number };
  benefits: { total: number };
}

type Operation = 'seed-system' | 'seed-demo' | 'flush-demo' | 'flush-all';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TABLE_LABELS: Record<string, string> = {
  configurations: 'Configurations',
  plans: 'Plans',
  plan_benefits: 'Plan Benefits',
  encounter_types: 'Encounter Types',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4SetupPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Table inventory
  const [tables, setTables] = useState<SetupTableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [loadingTables, setLoadingTables] = useState(true);

  // Stats (still used for quick glance)
  const [stats, setStats] = useState<SetupStats | null>(null);

  // SSE log
  const [logs, setLogs] = useState<SetupLogEvent[]>([]);
  const [running, setRunning] = useState<Operation | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Flush-all double confirmation
  const [flushAllStep, setFlushAllStep] = useState(0); // 0=none, 1=first confirm, 2=type confirm
  const [flushConfirmText, setFlushConfirmText] = useState('');

  // ---- Data loading ----

  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const data = await getSetupTables(orgId);
      setTables(data.tables);
    } catch {
      toast('Failed to load table inventory', 'error');
    } finally {
      setLoadingTables(false);
    }
  }, [orgId, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getSetupStats(orgId);
      setStats(data);
    } catch {
      // silent — stats are secondary
    }
  }, [orgId]);

  useEffect(() => {
    fetchTables();
    fetchStats();
  }, [fetchTables, fetchStats]);

  const refreshAll = () => {
    fetchTables();
    fetchStats();
  };

  // ---- Table selection ----

  const toggleTable = (name: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    const selectable = tables.filter((t) => !t.protected).map((t) => t.name);
    if (selectedTables.size === selectable.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(selectable));
    }
  };

  // ---- SSE operations ----

  const startOperation = (op: Operation) => {
    if (running) return;

    const tablesParam = selectedTables.size > 0 ? Array.from(selectedTables) : undefined;

    setRunning(op);
    setLogs([]);
    setIsPaused(false);

    const controller = startSetupSSE(
      orgId,
      op,
      tablesParam,
      (event) => {
        setLogs((prev) => [...prev, event]);
      },
      () => {
        setRunning(null);
        refreshAll();
      },
      (err) => {
        setLogs((prev) => [
          ...prev,
          { type: 'error', message: `Error: ${err}`, timestamp: new Date().toISOString() },
        ]);
      },
    );

    abortRef.current = controller;
  };

  const handleFlushAll = () => {
    if (flushAllStep === 0) {
      setFlushAllStep(1);
      return;
    }
    if (flushAllStep === 1) {
      setFlushAllStep(2);
      setFlushConfirmText('');
      return;
    }
    if (flushAllStep === 2 && flushConfirmText === 'FLUSH ALL') {
      setFlushAllStep(0);
      setFlushConfirmText('');
      startOperation('flush-all');
    }
  };

  // ---- Auto-scroll ----

  useEffect(() => {
    if (!isPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  // ---- Log export ----

  const downloadLog = () => {
    const text = logs
      .map((l) => `[${formatTimestamp(l.timestamp)}] [${l.type.toUpperCase()}]${l.table ? ` [${l.table}]` : ''} ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcg4-setup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLog = () => {
    const text = logs
      .map((l) => `[${formatTimestamp(l.timestamp)}] [${l.type.toUpperCase()}]${l.table ? ` [${l.table}]` : ''} ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => toast('Log copied to clipboard', 'success'));
  };

  // ---- Derived ----

  const hasData = tables.some((t) => t.count > 0);
  const selectableCount = tables.filter((t) => !t.protected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/pcg4/configurations')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to Product Catalog"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              PCG4 Setup
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage seed data and table contents for this organization
            </p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          disabled={loadingTables}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingTables ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ================================================================== */}
      {/* Table Inventory */}
      {/* ================================================================== */}
      <div className="card">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Table Inventory
          </h2>

          {loadingTables ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedTables.size === selectableCount && selectableCount > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    Table Name
                  </th>
                  <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    Records
                  </th>
                  <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    Protected
                  </th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr
                    key={t.name}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedTables.has(t.name)}
                        onChange={() => toggleTable(t.name)}
                        disabled={t.protected}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-900 dark:text-gray-100">
                      {TABLE_LABELS[t.name] || t.name}
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        {t.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-semibold ${
                          t.count === 0
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {t.count}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.protected ? (
                        <Shield className="w-4 h-4 text-amber-500 inline" />
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedTables.size > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {selectedTables.size} table(s) selected — operations will target only these tables
            </p>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* Operation Cards — 4 in a row */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seed System Data */}
        <OperationCard
          title="Seed System"
          description="Encounter types and reference data"
          icon={<Activity className="w-5 h-5" />}
          theme="blue"
          disabled={!!running}
          loading={running === 'seed-system'}
          onClick={() => startOperation('seed-system')}
        />

        {/* Seed Demo Data */}
        <OperationCard
          title="Seed Demo"
          description="Sample configs, plans, and benefits"
          icon={<Database className="w-5 h-5" />}
          theme="green"
          disabled={!!running}
          loading={running === 'seed-demo'}
          onClick={() => startOperation('seed-demo')}
        />

        {/* Flush Demo Data */}
        <OperationCard
          title="Flush Demo"
          description="Remove configs/plans (keep encounter types)"
          icon={<Trash2 className="w-5 h-5" />}
          theme="amber"
          disabled={!!running || !hasData}
          loading={running === 'flush-demo'}
          onClick={() => startOperation('flush-demo')}
        />

        {/* Flush All Data */}
        <OperationCard
          title="Flush All"
          description="Remove ALL data including encounter types"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme="red"
          disabled={!!running || !hasData}
          loading={running === 'flush-all'}
          onClick={handleFlushAll}
        />
      </div>

      {/* ================================================================== */}
      {/* Flush All — Double Confirmation */}
      {/* ================================================================== */}
      {flushAllStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {flushAllStep === 1 ? 'Confirm Flush All' : 'Final Confirmation'}
              </h3>
            </div>

            {flushAllStep === 1 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  This will permanently delete <strong>all</strong> data for organization{' '}
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    {orgId}
                  </code>{' '}
                  including configurations, plans, benefits, and encounter types. This cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setFlushAllStep(0)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlushAll}
                    className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Yes, Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Type <strong>FLUSH ALL</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={flushConfirmText}
                  onChange={(e) => setFlushConfirmText(e.target.value)}
                  placeholder="FLUSH ALL"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setFlushAllStep(0); setFlushConfirmText(''); }}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlushAll}
                    disabled={flushConfirmText !== 'FLUSH ALL'}
                    className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Flush Everything
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* SSE Streaming Log Panel */}
      {/* ================================================================== */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Operation Log
            </h2>
            {running && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Streaming
              </span>
            )}
            {!running && logs.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {logs.length} events
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && !running && (
              <>
                <button
                  onClick={copyLog}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  title="Copy to clipboard"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={downloadLog}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  title="Download as .txt"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </>
            )}
          </div>
        </div>

        <div
          ref={logContainerRef}
          className="overflow-y-auto font-mono text-xs leading-5"
          style={{
            backgroundColor: '#0a0a0a',
            minHeight: '200px',
            maxHeight: '400px',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              {running ? 'Waiting for events...' : 'Run an operation to see streaming logs here'}
            </div>
          ) : (
            <div className="p-3 space-y-0.5">
              {logs.map((log, idx) => (
                <LogLine key={idx} event={log} />
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// OperationCard sub-component
// ---------------------------------------------------------------------------

const THEME_CLASSES: Record<string, { bg: string; iconBg: string; border: string; btn: string; btnHover: string }> = {
  blue: {
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    btn: 'bg-blue-600 text-white',
    btnHover: 'hover:bg-blue-700',
  },
  green: {
    bg: 'bg-green-50/50 dark:bg-green-950/20',
    iconBg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    btn: 'bg-green-600 text-white',
    btnHover: 'hover:bg-green-700',
  },
  amber: {
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    btn: 'bg-amber-600 text-white',
    btnHover: 'hover:bg-amber-700',
  },
  red: {
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    btn: 'bg-red-600 text-white',
    btnHover: 'hover:bg-red-700',
  },
};

function OperationCard({
  title,
  description,
  icon,
  theme,
  disabled,
  loading,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  theme: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const t = THEME_CLASSES[theme] || THEME_CLASSES.blue;

  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-4 flex flex-col`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${t.iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-auto w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${t.btn} ${t.btnHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Running...
          </>
        ) : (
          title
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LogLine sub-component
// ---------------------------------------------------------------------------

function LogLine({ event }: { event: SetupLogEvent }) {
  const ts = formatTimestamp(event.timestamp);

  const typeColor: Record<string, string> = {
    info: 'text-cyan-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  const typeLabel: Record<string, string> = {
    info: 'INFO',
    success: ' OK ',
    warning: 'WARN',
    error: ' ERR',
  };

  return (
    <div className="flex gap-0 whitespace-pre-wrap break-all">
      <span className="text-gray-500 select-none">[{ts}]</span>
      <span className={`${typeColor[event.type] || 'text-gray-400'} select-none`}>
        {' '}[{typeLabel[event.type] || event.type}]
      </span>
      {event.table && (
        <span className="text-fuchsia-400"> [{event.table}]</span>
      )}
      <span className="text-gray-200"> {event.message}</span>
    </div>
  );
}

export default PCG4SetupPage;

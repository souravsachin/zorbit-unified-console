import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  Activity,
  AlertTriangle,
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../Toast';
import api from '../../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModuleSetupPageProps {
  moduleId: string;
  moduleName: string;
  icon: React.ElementType;

  /** POST — seeds system data (roles, privileges, default configs) */
  seedEndpoint: string;
  /** POST — seeds demo data */
  demoSeedEndpoint?: string;
  /** DELETE — removes demo data only */
  demoFlushEndpoint?: string;
  /** DELETE — removes ALL module data */
  flushEndpoint?: string;

  /** GET — health check */
  healthEndpoint: string;

  /** Optional: render the AI Demo Data Generator below the standard cards */
  demoGenerator?: React.ReactNode;
}

interface HealthStatus {
  status: string;
  version?: string;
  uptime?: number;
  database?: string;
  lastSeed?: string;
  [key: string]: unknown;
}

type OperationState = 'idle' | 'running' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUptime(seconds?: number): string {
  if (!seconds) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------------------------------------------------------------------------
// ModuleSetupPage
// ---------------------------------------------------------------------------

const ModuleSetupPage: React.FC<ModuleSetupPageProps> = ({
  moduleId,
  moduleName,
  icon: Icon,
  seedEndpoint,
  demoSeedEndpoint,
  demoFlushEndpoint,
  flushEndpoint,
  healthEndpoint,
  demoGenerator,
}) => {
  const { orgId } = useAuth();
  const { toast } = useToast();

  // Health
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Operation states
  const [seedState, setSeedState] = useState<OperationState>('idle');
  const [demoSeedState, setDemoSeedState] = useState<OperationState>('idle');
  const [demoFlushState, setDemoFlushState] = useState<OperationState>('idle');
  const [flushState, setFlushState] = useState<OperationState>('idle');

  // Operation results
  const [seedResult, setSeedResult] = useState<string>('');
  const [demoSeedResult, setDemoSeedResult] = useState<string>('');
  const [demoFlushResult, setDemoFlushResult] = useState<string>('');
  const [flushResult, setFlushResult] = useState<string>('');

  // Flush confirmation
  const [showFlushConfirm, setShowFlushConfirm] = useState(false);
  const [flushConfirmText, setFlushConfirmText] = useState('');

  // Demo flush confirmation
  const [showDemoFlushConfirm, setShowDemoFlushConfirm] = useState(false);

  // ---- Health check ----

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await api.get(healthEndpoint);
      setHealth(res.data);
    } catch {
      setHealth({ status: 'unreachable' });
    } finally {
      setHealthLoading(false);
    }
  }, [healthEndpoint]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // ---- Operations ----

  const runOperation = async (
    method: 'post' | 'delete',
    endpoint: string,
    setState: (s: OperationState) => void,
    setResult: (s: string) => void,
    label: string,
  ) => {
    setState('running');
    setResult('');
    try {
      const res = method === 'post'
        ? await api.post(endpoint, { organizationHashId: orgId })
        : await api.delete(endpoint, { data: { organizationHashId: orgId } });
      setState('success');
      const msg = res.data?.message || res.data?.msg || `${label} completed successfully`;
      setResult(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast(`${label} completed`, 'success');
      fetchHealth();
    } catch (err: any) {
      setState('error');
      const msg = err?.response?.data?.message || err?.message || 'Operation failed';
      setResult(msg);
      toast(`${label} failed: ${msg}`, 'error');
    }
  };

  const handleSeedSystem = () => runOperation('post', seedEndpoint, setSeedState, setSeedResult, 'Seed System Data');
  const handleSeedDemo = () => {
    if (!demoSeedEndpoint) return;
    runOperation('post', demoSeedEndpoint, setDemoSeedState, setDemoSeedResult, 'Seed Demo Data');
  };
  const handleFlushDemo = () => {
    if (!demoFlushEndpoint) return;
    setShowDemoFlushConfirm(false);
    runOperation('delete', demoFlushEndpoint, setDemoFlushState, setDemoFlushResult, 'Clear Demo Data');
  };
  const handleFlushAll = () => {
    if (!flushEndpoint || flushConfirmText !== moduleName) return;
    setShowFlushConfirm(false);
    setFlushConfirmText('');
    runOperation('delete', flushEndpoint, setFlushState, setFlushResult, 'Flush All Data');
  };

  const anyRunning = seedState === 'running' || demoSeedState === 'running' || demoFlushState === 'running' || flushState === 'running';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {moduleName} — Setup
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage seed data, demo data, and module health
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================ */}
        {/* Section 1: System Seed Data */}
        {/* ================================================================ */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  System Seed Data
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Roles, privileges, default configurations
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Seeds the required system data for <strong>{moduleName}</strong> including
              default roles, privileges, and baseline configurations. Safe to run multiple
              times (idempotent).
            </div>
            <button
              onClick={handleSeedSystem}
              disabled={anyRunning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seedState === 'running' ? (
                <><Loader2 size={16} className="animate-spin" /> Seeding...</>
              ) : (
                <><Database size={16} /> Seed System Data</>
              )}
            </button>
            <OperationResult state={seedState} result={seedResult} />
          </div>
        </div>

        {/* ================================================================ */}
        {/* Section 2: Demo Data */}
        {/* ================================================================ */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Demo Data
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sample entries prefixed with DEMO-
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Creates sample demo entries for training and demonstration purposes. Demo
              entries are prefixed with <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">DEMO-</code> for
              easy identification.
            </div>
            <div className="flex gap-3 flex-wrap">
              {demoSeedEndpoint && (
                <button
                  onClick={handleSeedDemo}
                  disabled={anyRunning}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoSeedState === 'running' ? (
                    <><Loader2 size={16} className="animate-spin" /> Seeding...</>
                  ) : (
                    <><Sparkles size={16} /> Seed Demo Data</>
                  )}
                </button>
              )}
              {demoFlushEndpoint && (
                <button
                  onClick={() => setShowDemoFlushConfirm(true)}
                  disabled={anyRunning}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {demoFlushState === 'running' ? (
                    <><Loader2 size={16} className="animate-spin" /> Clearing...</>
                  ) : (
                    <><Trash2 size={16} /> Clear Demo Data</>
                  )}
                </button>
              )}
              {!demoSeedEndpoint && !demoFlushEndpoint && (
                <p className="text-sm text-gray-400 italic">
                  Demo data endpoints not configured for this module.
                </p>
              )}
            </div>
            <OperationResult state={demoSeedState} result={demoSeedResult} />
            <OperationResult state={demoFlushState} result={demoFlushResult} />
          </div>
        </div>

        {/* ================================================================ */}
        {/* Section 3: Flush All Data */}
        {/* ================================================================ */}
        <div className="card overflow-hidden border-red-200 dark:border-red-800/50">
          <div className="px-5 py-4 border-b border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
                  Flush All Data
                </h2>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Danger zone — requires superadmin
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                This will delete <strong>ALL</strong> data for {moduleName}.
                This action cannot be undone.
              </p>
            </div>
            {flushEndpoint ? (
              <button
                onClick={() => setShowFlushConfirm(true)}
                disabled={anyRunning}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {flushState === 'running' ? (
                  <><Loader2 size={16} className="animate-spin" /> Flushing...</>
                ) : (
                  <><Trash2 size={16} /> Flush All Module Data</>
                )}
              </button>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Flush endpoint not configured for this module.
              </p>
            )}
            <OperationResult state={flushState} result={flushResult} />
          </div>
        </div>

        {/* ================================================================ */}
        {/* Section 4: Module Health */}
        {/* ================================================================ */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <Heart size={18} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Module Health
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Real-time service status
                  </p>
                </div>
              </div>
              <button
                onClick={fetchHealth}
                disabled={healthLoading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Refresh health"
              >
                <RefreshCw size={16} className={`text-gray-400 ${healthLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="p-5">
            {healthLoading && !health ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : health ? (
              <div className="space-y-3">
                <HealthRow
                  label="Status"
                  value={
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                      health.status === 'ok' || health.status === 'healthy' || health.status === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {health.status === 'ok' || health.status === 'healthy' || health.status === 'up'
                        ? <CheckCircle2 size={14} />
                        : <XCircle size={14} />}
                      {health.status}
                    </span>
                  }
                />
                {health.version && (
                  <HealthRow label="Version" value={<span className="text-sm font-mono">{health.version}</span>} />
                )}
                {health.uptime !== undefined && (
                  <HealthRow
                    label="Uptime"
                    value={
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Clock size={14} className="text-gray-400" />
                        {formatUptime(health.uptime)}
                      </span>
                    }
                  />
                )}
                {health.database && (
                  <HealthRow
                    label="Database"
                    value={
                      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                        health.database === 'connected' || health.database === 'ok'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {health.database === 'connected' || health.database === 'ok'
                          ? <CheckCircle2 size={14} />
                          : <XCircle size={14} />}
                        {health.database}
                      </span>
                    }
                  />
                )}
                {health.lastSeed && (
                  <HealthRow
                    label="Last Seed"
                    value={<span className="text-sm">{new Date(health.lastSeed).toLocaleString()}</span>}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unable to reach service</p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* AI Demo Data Generator (optional)                                */}
      {/* ================================================================ */}
      {demoGenerator}

      {/* ================================================================ */}
      {/* Demo Flush Confirmation Modal */}
      {/* ================================================================ */}
      {showDemoFlushConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Trash2 className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Clear Demo Data?
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              This will remove all demo entries (DEMO- prefix) from <strong>{moduleName}</strong>.
              System data will not be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDemoFlushConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlushDemo}
                className="px-4 py-2 text-sm rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
              >
                Clear Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Flush All Confirmation Modal */}
      {/* ================================================================ */}
      {showFlushConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Flush All {moduleName} Data
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete <strong>all</strong> data for {moduleName}.
              This action cannot be undone.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Type <strong>{moduleName}</strong> to confirm:
            </p>
            <input
              type="text"
              value={flushConfirmText}
              onChange={(e) => setFlushConfirmText(e.target.value)}
              placeholder={moduleName}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowFlushConfirm(false); setFlushConfirmText(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlushAll}
                disabled={flushConfirmText !== moduleName}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Flush Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OperationResult({ state, result }: { state: OperationState; result: string }) {
  if (state === 'idle' || !result) return null;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
      state === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : state === 'error'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
    }`}>
      {state === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
      <span>{result}</span>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      {value}
    </div>
  );
}

export default ModuleSetupPage;
export type { ModuleSetupPageProps as ModuleSetupProps };

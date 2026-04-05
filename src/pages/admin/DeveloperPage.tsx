import React, { useState, useCallback, useRef } from 'react';
import {
  Terminal, Play, Download, Activity, Trash2, RefreshCw, ExternalLink,
  CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Server, Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Service definitions                                                */
/* ------------------------------------------------------------------ */

interface ServiceDef {
  name: string;
  url: string;
  layer: 'core' | 'pfs' | 'app' | 'console';
}

const SERVICES: ServiceDef[] = [
  { name: 'Identity',        url: '/api/identity/api/v1/G/auth/providers',               layer: 'core' },
  { name: 'Authorization',   url: '/api/authorization/api/v1/G/health',                   layer: 'core' },
  { name: 'Navigation',      url: '/api/navigation/api/v1/G/health',                      layer: 'core' },
  { name: 'Event Bus',       url: '/api/messaging/api/v1/G/health',                       layer: 'core' },
  { name: 'Audit',           url: '/api/audit/api/v1/G/health',                           layer: 'core' },
  { name: 'PII Vault',       url: '/api/pii-vault/api/v1/G/health',                       layer: 'core' },
  { name: 'DataTable',       url: '/api/datatable/api/v1/G/health',                       layer: 'pfs' },
  { name: 'Form Builder',    url: '/api/form-builder/api/v1/G/form-builder/health',       layer: 'pfs' },
  { name: 'Notification',    url: '/api/notification/api/v1/G/notifications/health',      layer: 'pfs' },
  { name: 'PCG4',            url: '/api/app/pcg4/api/v1/G/health',                        layer: 'app' },
  { name: 'Product Pricing', url: '/api/product-pricing/api/v1/G/product-pricing/health', layer: 'app' },
  { name: 'UW Workflow',     url: '/api/uw-workflow/api/v1/G/uw-workflow/health',         layer: 'app' },
  { name: 'HI Decisioning',  url: '/api/hi-decisioning/api/v1/G/hi-decisioning/health',  layer: 'app' },
  { name: 'HI Quotation',    url: '/api/hi-quotation/api/v1/G/hi-quotation/health',      layer: 'app' },
  { name: 'Console Server',  url: '/api/unified-console/api/v1/G/health',                 layer: 'console' },
];

/* ------------------------------------------------------------------ */
/*  Health check result type                                           */
/* ------------------------------------------------------------------ */

interface HealthResult {
  name: string;
  url: string;
  layer: string;
  status: 'ok' | 'error' | 'warning' | 'pending';
  httpStatus: number | null;
  responseTime: number | null;
  size: string | null;
  contentType: string | null;
  issue: string | null;
}

const LAYER_COLORS: Record<string, { text: string; bg: string }> = {
  core:    { text: 'text-red-400',    bg: 'bg-red-900/40' },
  pfs:     { text: 'text-indigo-400', bg: 'bg-indigo-900/40' },
  app:     { text: 'text-green-400',  bg: 'bg-green-900/40' },
  console: { text: 'text-gray-400',   bg: 'bg-gray-700' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  ok:      <CheckCircle2 className="h-4 w-4 text-green-400" />,
  error:   <XCircle className="h-4 w-4 text-red-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  pending: <Clock className="h-4 w-4 text-gray-500" />,
};

/* ------------------------------------------------------------------ */
/*  Utility: human-readable bytes                                      */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DeveloperPage: React.FC = () => {
  const [results, setResults] = useState<HealthResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ---- Run Health Check ---- */
  const runHealthCheck = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    // Initialize all as pending
    const initial: HealthResult[] = SERVICES.map((s) => ({
      name: s.name,
      url: s.url,
      layer: s.layer,
      status: 'pending',
      httpStatus: null,
      responseTime: null,
      size: null,
      contentType: null,
      issue: null,
    }));
    setResults([...initial]);

    let completed = 0;

    const checkService = async (idx: number) => {
      const svc = SERVICES[idx];
      const start = performance.now();
      try {
        const resp = await fetch(svc.url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        const elapsed = Math.round(performance.now() - start);
        const body = await resp.text();
        const ct = resp.headers.get('content-type') || 'unknown';
        const sizeBytes = new Blob([body]).size;

        let status: 'ok' | 'error' | 'warning' = 'ok';
        let issue: string | null = null;

        if (!resp.ok) {
          status = resp.status >= 500 ? 'error' : 'warning';
          issue = `HTTP ${resp.status} ${resp.statusText}`;
        } else if (elapsed > 3000) {
          status = 'warning';
          issue = 'Slow response (> 3s)';
        }

        initial[idx] = {
          ...initial[idx],
          status,
          httpStatus: resp.status,
          responseTime: elapsed,
          size: formatBytes(sizeBytes),
          contentType: ct.split(';')[0].trim(),
          issue,
        };
      } catch (err: unknown) {
        const elapsed = Math.round(performance.now() - start);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        initial[idx] = {
          ...initial[idx],
          status: 'error',
          httpStatus: null,
          responseTime: elapsed,
          size: null,
          contentType: null,
          issue: msg.includes('abort') ? 'Aborted' : msg,
        };
      }

      completed++;
      setProgress(Math.round((completed / SERVICES.length) * 100));
      setResults([...initial]);
    };

    // Run checks in batches of 4 to avoid overloading
    const batchSize = 4;
    for (let i = 0; i < SERVICES.length; i += batchSize) {
      if (controller.signal.aborted) break;
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, SERVICES.length); j++) {
        batch.push(checkService(j));
      }
      await Promise.all(batch);
    }

    setRunning(false);
    setLastRun(new Date().toLocaleTimeString());
  }, [running]);

  /* ---- Summary Stats ---- */
  const okCount = results.filter((r) => r.status === 'ok').length;
  const errCount = results.filter((r) => r.status === 'error').length;
  const warnCount = results.filter((r) => r.status === 'warning').length;
  const avgTime =
    results.filter((r) => r.responseTime !== null).length > 0
      ? Math.round(
          results
            .filter((r) => r.responseTime !== null)
            .reduce((a, r) => a + (r.responseTime || 0), 0) /
            results.filter((r) => r.responseTime !== null).length,
        )
      : 0;

  /* ---- Quick Actions ---- */
  const clearMenuCache = () => {
    const keys = Object.keys(sessionStorage);
    let cleared = 0;
    keys.forEach((k) => {
      if (k.includes('menu') || k.includes('nav') || k.includes('navigation')) {
        sessionStorage.removeItem(k);
        cleared++;
      }
    });
    alert(`Cleared ${cleared} cached menu entries from sessionStorage.`);
  };

  const reloadNavigation = () => {
    clearMenuCache();
    window.location.reload();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-800 border border-gray-700">
          <Terminal className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Tools</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Platform health checks, metrics, and diagnostics
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Section C: Platform Metrics (top, always visible)             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Services</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{SERVICES.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Core</p>
          <p className="text-2xl font-bold text-red-500">{SERVICES.filter((s) => s.layer === 'core').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Platform Features</p>
          <p className="text-2xl font-bold text-indigo-500">{SERVICES.filter((s) => s.layer === 'pfs').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Business Apps</p>
          <p className="text-2xl font-bold text-green-500">{SERVICES.filter((s) => s.layer === 'app').length}</p>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Server className="h-4 w-4" /> Service Endpoints
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {SERVICES.map((svc) => {
            const result = results.find((r) => r.name === svc.name);
            const dotColor = !result
              ? 'bg-gray-400'
              : result.status === 'ok'
              ? 'bg-green-500'
              : result.status === 'warning'
              ? 'bg-amber-500'
              : result.status === 'error'
              ? 'bg-red-500'
              : 'bg-gray-400';
            const layerStyle = LAYER_COLORS[svc.layer];
            return (
              <div
                key={svc.name}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{svc.name}</span>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${layerStyle.bg} ${layerStyle.text}`}>
                  {svc.layer.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Section A: Platform Health Check                              */}
      {/* ============================================================ */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        {/* Terminal header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-mono text-gray-400">zorbit-health-check</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRun && (
              <span className="text-xs text-gray-500 font-mono">Last run: {lastRun}</span>
            )}
            <button
              onClick={runHealthCheck}
              disabled={running}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                running
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Health Check
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {running && (
          <div className="h-1 bg-gray-800">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Summary stats (after run) */}
        {results.length > 0 && !running && (
          <div className="flex items-center gap-6 px-4 py-2.5 bg-gray-800/50 border-b border-gray-700/50 font-mono text-xs">
            <span className="text-green-400">{okCount} passed</span>
            {errCount > 0 && <span className="text-red-400">{errCount} failed</span>}
            {warnCount > 0 && <span className="text-amber-400">{warnCount} warnings</span>}
            <span className="text-gray-500">avg {avgTime}ms</span>
            <span className="text-gray-500">{SERVICES.length} total</span>
          </div>
        )}

        {/* Results table */}
        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700/50">
                  <th className="px-4 py-2 text-left w-8" />
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Layer</th>
                  <th className="px-4 py-2 text-right">Status</th>
                  <th className="px-4 py-2 text-right">Time</th>
                  <th className="px-4 py-2 text-right">Size</th>
                  <th className="px-4 py-2 text-left">Content-Type</th>
                  <th className="px-4 py-2 text-left">Issue</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  const layerStyle = LAYER_COLORS[r.layer] || LAYER_COLORS.console;
                  return (
                    <tr
                      key={r.name}
                      className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/70'
                      }`}
                    >
                      <td className="px-4 py-2">{STATUS_ICON[r.status]}</td>
                      <td className="px-4 py-2 text-gray-200">{r.name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${layerStyle.bg} ${layerStyle.text}`}>
                          {r.layer.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.httpStatus !== null ? (
                          <span className={r.httpStatus < 300 ? 'text-green-400' : r.httpStatus < 500 ? 'text-amber-400' : 'text-red-400'}>
                            {r.httpStatus}
                          </span>
                        ) : r.status === 'pending' ? (
                          <span className="text-gray-600">---</span>
                        ) : (
                          <span className="text-red-500">ERR</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.responseTime !== null ? (
                          <span className={r.responseTime > 3000 ? 'text-amber-400' : r.responseTime > 1000 ? 'text-yellow-500' : 'text-gray-400'}>
                            {r.responseTime}ms
                          </span>
                        ) : (
                          <span className="text-gray-600">---</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {r.size || '---'}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {r.contentType || '---'}
                      </td>
                      <td className="px-4 py-2">
                        {r.issue ? (
                          <span className={r.status === 'error' ? 'text-red-400' : 'text-amber-400'}>
                            {r.issue}
                          </span>
                        ) : r.status === 'ok' ? (
                          <span className="text-green-600">OK</span>
                        ) : (
                          <span className="text-gray-600">---</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Activity className="h-8 w-8 mb-3 text-gray-600" />
            <p className="text-sm font-mono">Click "Run Health Check" to test all platform services</p>
            <p className="text-xs text-gray-600 mt-1">Tests {SERVICES.length} service endpoints via browser fetch()</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Section B: Downloadable Health Check Bundle                   */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Download className="h-4 w-4" /> Playwright Health Check Bundle
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Download a standalone Playwright test script that runs full E2E health checks from your machine.
              Includes <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">health-check.mjs</code>,{' '}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">runme.sh</code>, and{' '}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">package.json</code>.
            </p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Coming Soon
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Section D: Quick Actions                                      */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" /> Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={clearMenuCache}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear Menu Cache
          </button>
          <button
            onClick={reloadNavigation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Navigation
          </button>
        </div>

        {/* API Docs links */}
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-4 mb-2">API Documentation</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { name: 'Identity',      path: '/api/identity' },
            { name: 'Authorization',  path: '/api/authorization' },
            { name: 'Navigation',     path: '/api/navigation' },
            { name: 'Event Bus',      path: '/api/messaging' },
            { name: 'Audit',          path: '/api/audit' },
            { name: 'PII Vault',      path: '/api/pii-vault' },
            { name: 'PCG4',           path: '/api/app/pcg4' },
            { name: 'Form Builder',   path: '/api/form-builder' },
            { name: 'UW Workflow',    path: '/api/uw-workflow' },
            { name: 'HI Decisioning', path: '/api/hi-decisioning' },
            { name: 'HI Quotation',   path: '/api/hi-quotation' },
            { name: 'Console Server', path: '/api/unified-console' },
          ].map((svc) => (
            <a
              key={svc.name}
              href={`${svc.path}/api-docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {svc.name}
            </a>
          ))}
        </div>

        {/* E2E Test Bundle */}
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-2">E2E Test Bundle</h4>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Standalone E2E Test Bundle</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">v1.0</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Portable Playwright test suite for the Zorbit platform. Config-driven, no code changes needed.
                Covers identity, PCG4 product configurator, menu sanity, and broken link detection.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                {[
                  { name: 'Smoke Test', desc: 'Login, dashboard, health' },
                  { name: 'Identity', desc: 'Users, orgs, departments' },
                  { name: 'PCG4', desc: '8-step product wizard' },
                  { name: 'Menu Sanity', desc: 'Every menu item' },
                  { name: 'Broken Links', desc: 'Full site crawl' },
                ].map((t) => (
                  <div key={t.name} className="bg-white/60 dark:bg-gray-800/40 rounded-lg px-2.5 py-1.5 text-center">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><strong>How to use:</strong> Unzip → run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">./runme.sh smoke-test</code> → enter credentials when prompted → tests run in visible Chrome</p>
                <p><strong>MFA handled automatically</strong> — paste your TOTP secret when prompted, no Google Authenticator needed during tests</p>
                <p><strong>Add tests:</strong> Edit JSON configs in <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">configs/</code> — no code changes required</p>
              </div>
            </div>
            <a
              href="/downloads/zorbit-e2e-bundle.zip"
              download
              className="ml-4 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
            >
              <Download className="h-4 w-4" />
              Download Bundle
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPage;

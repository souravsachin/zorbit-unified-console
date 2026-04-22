/**
 * Seeder Generator — single-bundle detail page.
 * Route: /m/seeder/seed-bundles/:bundleId. Added 2026-04-23 by Soldier AV.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  Play,
  Send,
  Package,
  RefreshCw,
} from 'lucide-react';
import {
  seederBundlesService,
  type BundleDetail,
  type BundleRun,
} from '../../../services/seederBundles';

export default function SeedBundleDetailPage() {
  const nav = useNavigate();
  const { bundleId } = useParams();
  const [bundle, setBundle] = useState<BundleDetail | null>(null);
  const [runs, setRuns] = useState<BundleRun[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!bundleId) return;
    try {
      const b = await seederBundlesService.getBundle(bundleId);
      setBundle(b);
      const r = await seederBundlesService.listRuns(bundleId);
      setRuns(r.data || []);
    } catch (e: any) {
      setMsg({ ok: false, msg: e?.response?.data?.message || e?.message || 'load failed' });
    }
  }, [bundleId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async () => {
    if (!bundleId) return;
    setBusy('run');
    try {
      const res = await seederBundlesService.startRun(bundleId);
      setMsg({ ok: true, msg: `Run ${res.runId} started (${res.total} requests)` });
      nav(`/m/seeder/seed-bundles/${bundleId}/runs/${res.runId}`);
    } catch (e: any) {
      setMsg({ ok: false, msg: e?.response?.data?.message || e?.message || 'run failed' });
    } finally {
      setBusy(null);
    }
  };

  const handleDeliver = async (target: 'module' | 'central') => {
    if (!bundleId) return;
    setBusy('deliver');
    try {
      const res = await seederBundlesService.deliver(bundleId, { target });
      setMsg({ ok: true, msg: `Delivered to ${res.target}: ${res.modulePath || '(central store)'} (${res.sqlBytes} bytes)` });
    } catch (e: any) {
      setMsg({ ok: false, msg: e?.response?.data?.message || e?.message || 'delivery failed' });
    } finally {
      setBusy(null);
    }
  };

  if (!bundle) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/m/seeder/seed-bundles" className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1">
          <ChevronLeft size={14} /> Back
        </Link>
        <Package size={18} className="text-indigo-600" />
        <h1 className="text-xl font-semibold font-mono">{bundle.bundleId}</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{bundle.status}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={load}
          className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {msg && (
        <div className={`mb-3 px-3 py-2 rounded text-sm border ${msg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {msg.msg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div><span className="text-xs text-gray-500">Module</span><div>{bundle.moduleId}</div></div>
        <div><span className="text-xs text-gray-500">Count</span><div>{bundle.count}</div></div>
        <div className="col-span-2"><span className="text-xs text-gray-500">Entities</span><div>{(bundle.entities || []).join(', ')}</div></div>
      </div>

      <div className="flex gap-2 mb-4">
        <a href={seederBundlesService.sqlUrl(bundle.bundleId)} download className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Download size={12} /> SQL
        </a>
        <a href={seederBundlesService.postmanUrl(bundle.bundleId)} download className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Download size={12} /> Postman
        </a>
        <button type="button" onClick={handleRun} disabled={!!busy} className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white inline-flex items-center gap-1 hover:bg-emerald-700 disabled:bg-gray-400">
          <Play size={12} /> Run against API
        </button>
        <button type="button" onClick={() => handleDeliver('module')} disabled={!!busy} className="text-sm px-3 py-1.5 rounded bg-amber-600 text-white inline-flex items-center gap-1 hover:bg-amber-700 disabled:bg-gray-400">
          <Send size={12} /> Deliver to module
        </button>
        <button type="button" onClick={() => handleDeliver('central')} disabled={!!busy} className="text-sm px-3 py-1.5 rounded bg-amber-700 text-white inline-flex items-center gap-1 hover:bg-amber-800 disabled:bg-gray-400">
          <Send size={12} /> Deliver to central
        </button>
      </div>

      <h3 className="text-sm font-semibold mb-2">Runs</h3>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Run</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Progress</th>
              <th className="px-3 py-2 text-left">Started</th>
              <th className="px-3 py-2 text-left">Completed</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-3 text-center text-gray-500">No runs yet.</td></tr>
            )}
            {runs.map((r) => (
              <tr key={r.runId} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link to={`/m/seeder/seed-bundles/${bundle.bundleId}/runs/${r.runId}`} className="text-indigo-600 hover:underline">
                    {r.runId}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-right text-xs">{r.sent}/{r.total} ({r.succeeded} ok / {r.failed} failed)</td>
                <td className="px-3 py-2 text-xs text-gray-500">{r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

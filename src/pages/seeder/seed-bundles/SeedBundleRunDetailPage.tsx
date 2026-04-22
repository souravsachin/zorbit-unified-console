/**
 * Seeder Generator — single run detail with live log stream.
 * Route: /m/seeder/seed-bundles/:bundleId/runs/:runId.
 * Added 2026-04-23 by Soldier AV.
 */
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { seederBundlesService, type BundleRun } from '../../../services/seederBundles';

export default function SeedBundleRunDetailPage() {
  const { bundleId, runId } = useParams();
  const [run, setRun] = useState<BundleRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!bundleId || !runId) return;
      try {
        const r = await seederBundlesService.getRun(bundleId, runId);
        if (!cancelled) setRun(r);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'failed');
      }
    };
    tick();
    const iv = setInterval(tick, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [bundleId, runId]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link to={`/m/seeder/seed-bundles/${bundleId}`} className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1">
          <ChevronLeft size={14} /> Back
        </Link>
        <h1 className="text-xl font-semibold">Run <span className="font-mono">{runId}</span></h1>
        {run && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            run.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
            run.status === 'failed' ? 'bg-red-100 text-red-800' :
            run.status === 'running' ? 'bg-amber-100 text-amber-800' :
            'bg-gray-100 text-gray-700'
          }`}>{run.status}</span>
        )}
        <RefreshCw size={12} className="animate-spin text-gray-400" />
      </div>

      {error && <div className="mb-3 px-3 py-2 bg-red-50 text-red-800 text-sm rounded">{error}</div>}

      {run && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
            <Stat label="Total" value={run.total} />
            <Stat label="Sent" value={run.sent} />
            <Stat label="Succeeded" value={run.succeeded} color="text-emerald-700" />
            <Stat label="Failed" value={run.failed} color="text-red-700" />
          </div>

          <h3 className="text-sm font-semibold mb-2">Log tail</h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-950 text-gray-100 font-mono text-[11px] p-3 max-h-[60vh] overflow-auto">
            {Array.isArray(run.logTail) && run.logTail.length > 0 ? (
              (run.logTail as any[]).map((e, i) => (
                <div key={i} className="mb-1">
                  <span className="text-gray-500">{e.at}</span>{' '}
                  <span className={`${e.status >= 400 || e.status === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {e.method} {e.status}
                  </span>{' '}
                  <span className="text-gray-300">{e.name}</span>
                  {e.error && <span className="text-red-300"> — {e.error}</span>}
                  <span className="text-gray-500"> ({e.elapsedMs}ms)</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No events yet.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-semibold ${color || ''}`}>{value}</div>
    </div>
  );
}

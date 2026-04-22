/**
 * Seeder Generator — list of existing seed bundles.
 * Route: /m/seeder/seed-bundles. Added 2026-04-23 by Soldier AV.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Download, Play, Trash2, RefreshCw } from 'lucide-react';
import { seederBundlesService, type BundleSummary } from '../../../services/seederBundles';

export default function SeedBundlesListPage() {
  const [rows, setRows] = useState<BundleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await seederBundlesService.listBundles();
      setRows(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Package size={20} className="text-indigo-600" />
        <h1 className="text-xl font-semibold">Seed Bundles</h1>
        <span className="text-xs text-gray-500 hidden md:inline">
          — generator outputs from module introspection
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={load}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw size={14} /> Refresh
        </button>
        <Link
          to="/m/seeder/seed-bundles/new"
          className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white inline-flex items-center gap-1 hover:bg-indigo-700"
        >
          <Plus size={14} /> New bundle
        </Link>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded bg-red-50 text-red-800 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Bundle</th>
              <th className="px-3 py-2 text-left">Module</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Count</th>
              <th className="px-3 py-2 text-left">Entities</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No bundles yet.{' '}
                  <Link to="/m/seeder/seed-bundles/new" className="text-indigo-600 underline">
                    Create one →
                  </Link>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.bundleId} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link to={`/m/seeder/seed-bundles/${r.bundleId}`} className="text-indigo-600 hover:underline">
                    {r.bundleId}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.moduleId}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      r.status === 'generated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.status === 'stale'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{r.count}</td>
                <td className="px-3 py-2 text-xs">{(r.entities || []).join(', ')}</td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <a
                      href={seederBundlesService.sqlUrl(r.bundleId)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                      download
                    >
                      <Download size={12} /> SQL
                    </a>
                    <a
                      href={seederBundlesService.postmanUrl(r.bundleId)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                      download
                    >
                      <Download size={12} /> Postman
                    </a>
                    <Link
                      to={`/m/seeder/seed-bundles/${r.bundleId}/runs`}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Play size={12} /> Runs
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Delete ${r.bundleId}?`)) return;
                        await seederBundlesService.deleteBundle(r.bundleId);
                        load();
                      }}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 inline-flex items-center gap-1 hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

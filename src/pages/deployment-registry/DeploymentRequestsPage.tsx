import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GitBranch,
  RefreshCw,
  ArrowRight,
  Eye,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/shared/Toast';
import Select from '../../components/shared/Select';
import JsonViewer from '../../components/shared/JsonViewer';

// --- types ---------------------------------------------------------

interface DR {
  drId: string;
  sourceEnvId: string;
  targetEnvId: string;
  moduleId: string;
  resourceKind: string;
  resourceIds: string[];
  resourceCount: number;
  payloadHash: string;
  makerUserId: string;
  checkerUserId: string | null;
  status: string;
  reviewComment: string | null;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  rolledBackAt: string | null;
}

interface DRDetail extends DR {
  payloadSnapshot: Record<string, unknown>;
}

// --- helpers -------------------------------------------------------

const DR_API = '/api/deployment-registry/api/v1/G';

const STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'APPLIED',
  'FAILED',
  'ROLLED_BACK',
] as const;

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  APPROVED:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  REJECTED:
    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  APPLIED:
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  ROLLED_BACK:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

function whenAgo(iso?: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

// --- component -----------------------------------------------------

/**
 * Central deployment-requests page (mounted at
 * `/m/deployment-registry/requests`). Phase-3 scope:
 *   - List + filters (status, source, target, module, maker, checker)
 *   - Status stat chips
 *   - View diff modal (JsonViewer)
 *   - Approve/Reject buttons rendered but DISABLED (Phase 4)
 */
const DeploymentRequestsPage: React.FC = () => {
  const { toast } = useToast();

  const [rows, setRows] = useState<DR[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [makerFilter, setMakerFilter] = useState('');
  const [checkerFilter, setCheckerFilter] = useState('');

  const [envOptions, setEnvOptions] = useState<{ value: string; label: string }[]>([]);
  const [moduleOptions, setModuleOptions] = useState<{ value: string; label: string }[]>([]);

  const [viewTarget, setViewTarget] = useState<DRDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('sourceEnvId', sourceFilter);
      if (targetFilter) params.set('targetEnvId', targetFilter);
      if (moduleFilter) params.set('moduleId', moduleFilter);
      if (makerFilter) params.set('makerUserId', makerFilter);
      if (checkerFilter) params.set('checkerUserId', checkerFilter);
      const url = `${DR_API}/requests${params.size > 0 ? `?${params.toString()}` : ''}`;
      const res = await api.get<DR[]>(url);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message || 'Failed to load deployment requests';
      toast(msg, 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, targetFilter, moduleFilter, makerFilter, checkerFilter, toast]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const res = await api.get<{ envId: string; name: string }[]>(
        `${DR_API}/environments`,
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setEnvOptions([
        { value: '', label: 'Any env' },
        ...list.map((e) => ({
          value: e.envId,
          label: `${e.name} (${e.envId})`,
        })),
      ]);
    } catch {
      setEnvOptions([{ value: '', label: 'Any env' }]);
    }
    try {
      const res = await api.get<{ moduleId: string }[]>(
        `/api/module-registry/api/v1/G/modules`,
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setModuleOptions([
        { value: '', label: 'Any module' },
        ...list.map((m) => ({ value: m.moduleId, label: m.moduleId })),
      ]);
    } catch {
      setModuleOptions([{ value: '', label: 'Any module' }]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const stats = useMemo(() => {
    const out: Record<string, number> = { total: rows.length };
    for (const s of STATUSES) out[s] = 0;
    for (const r of rows) {
      if (r.status in out) out[r.status]++;
    }
    return out;
  }, [rows]);

  const openView = async (drId: string) => {
    try {
      const res = await api.get<DRDetail>(`${DR_API}/requests/${drId}`);
      setViewTarget(res.data);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message || 'Failed to fetch detail';
      toast(msg, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch size={22} className="text-indigo-600" />
            <h1 className="text-2xl font-bold">Deployment Requests</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Config/data promotions across environments. Maker flow is live
            in Phase 3; Approve / Reject actions land in Phase 4.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <StatChip label="Total" value={stats.total} style="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200" />
        {STATUSES.map((s) => (
          <StatChip
            key={s}
            label={s}
            value={stats[s]}
            style={STATUS_STYLE[s]}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 flex items-center gap-2 flex-wrap">
        <div className="text-xs text-gray-500 mr-2">Filter</div>
        <Select
          value={statusFilter}
          options={[{ value: '', label: 'Any status' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          onChange={setStatusFilter}
          minWidth={160}
        />
        <Select
          value={sourceFilter}
          options={envOptions}
          onChange={setSourceFilter}
          minWidth={220}
        />
        <Select
          value={targetFilter}
          options={envOptions}
          onChange={setTargetFilter}
          minWidth={220}
        />
        <Select
          value={moduleFilter}
          options={moduleOptions}
          onChange={setModuleFilter}
          minWidth={220}
        />
        <input
          type="text"
          value={makerFilter}
          onChange={(e) => setMakerFilter(e.target.value)}
          placeholder="Maker user id"
          className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        <input
          type="text"
          value={checkerFilter}
          onChange={(e) => setCheckerFilter(e.target.value)}
          placeholder="Checker user id"
          className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        {(statusFilter || sourceFilter || targetFilter || moduleFilter || makerFilter || checkerFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setSourceFilter('');
              setTargetFilter('');
              setModuleFilter('');
              setMakerFilter('');
              setCheckerFilter('');
            }}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2 font-semibold">drId</th>
              <th className="px-4 py-2 font-semibold">Source → Target</th>
              <th className="px-4 py-2 font-semibold">Module</th>
              <th className="px-4 py-2 font-semibold">Kind</th>
              <th className="px-4 py-2 font-semibold text-center">#</th>
              <th className="px-4 py-2 font-semibold">Maker</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Created</th>
              <th className="px-4 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No deployment requests match these filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.drId}
                  className="border-b border-gray-100 dark:border-gray-700/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                >
                  <td className="px-4 py-2 font-mono text-xs">{r.drId}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono">{r.sourceEnvId}</span>
                      <ArrowRight size={12} className="text-gray-400" />
                      <span className="font-mono">{r.targetEnvId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {r.moduleId}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {r.resourceKind}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">{r.resourceCount}</td>
                  <td className="px-4 py-2 text-xs font-mono">{r.makerUserId}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[r.status] || STATUS_STYLE.DRAFT}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {whenAgo(r.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openView(r.drId)}
                        title="View diff"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        disabled
                        title="Approve (Phase 4)"
                        className="p-1 rounded text-green-600 opacity-30 cursor-not-allowed"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        disabled
                        title="Reject (Phase 4)"
                        className="p-1 rounded text-red-600 opacity-30 cursor-not-allowed"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setViewTarget(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <GitBranch size={18} /> {viewTarget.drId}
                </h2>
                <div className="text-xs text-gray-500 mt-0.5 font-mono">
                  {viewTarget.sourceEnvId} → {viewTarget.targetEnvId} ·{' '}
                  {viewTarget.moduleId} · {viewTarget.resourceKind}
                </div>
              </div>
              <button
                onClick={() => setViewTarget(null)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Detail label="Status">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[viewTarget.status]}`}
                  >
                    {viewTarget.status}
                  </span>
                </Detail>
                <Detail label="Maker">
                  <span className="font-mono">{viewTarget.makerUserId}</span>
                </Detail>
                <Detail label="Resource count">
                  {viewTarget.resourceCount}
                </Detail>
                <Detail label="Created">{whenAgo(viewTarget.createdAt)}</Detail>
                <Detail label="Payload hash">
                  <span className="font-mono break-all">
                    {viewTarget.payloadHash.slice(0, 16)}…
                  </span>
                </Detail>
                <Detail label="Submitted">{whenAgo(viewTarget.submittedAt)}</Detail>
                {viewTarget.reviewComment && (
                  <Detail label="Comment" wide>
                    {viewTarget.reviewComment}
                  </Detail>
                )}
              </div>
              <div className="text-xs font-semibold uppercase text-gray-500">
                Payload snapshot
              </div>
              <JsonViewer
                value={viewTarget.payloadSnapshot}
                maxHeightClass="max-h-96"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatChip: React.FC<{ label: string; value: number; style: string }> = ({
  label,
  value,
  style,
}) => (
  <div className={`rounded-lg p-2.5 ${style}`}>
    <div className="text-[10px] uppercase opacity-80">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

const Detail: React.FC<{
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ label, children, wide }) => (
  <div className={wide ? 'col-span-full' : ''}>
    <div className="text-[10px] uppercase text-gray-500 font-semibold">
      {label}
    </div>
    <div className="text-sm">{children}</div>
  </div>
);

export default DeploymentRequestsPage;

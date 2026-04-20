import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Rocket,
  Globe,
  ArrowRight,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ChevronRight,
  ChevronLeft,
  Send,
} from 'lucide-react';
import { useModuleContext } from '../../contexts/ModuleContext';
import api from '../../services/api';
import { useToast } from '../../components/shared/Toast';
import Select from '../../components/shared/Select';
import JsonViewer from '../../components/shared/JsonViewer';
import { Link } from 'react-router-dom';

// --- types ----------------------------------------------------------

type Health = 'unknown' | 'healthy' | 'degraded' | 'down';

interface EnvironmentRow {
  envId: string;
  name: string;
  category: 'PP' | 'ORG';
  orgHashId: string;
  baseUrl: string;
  capabilities: string[] | null;
  healthStatus: Health;
  lastHealthAt: string | null;
}

interface DeployableSummary {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  kind: string;
}

interface DeploymentRequestPublic {
  drId: string;
  sourceEnvId: string;
  targetEnvId: string;
  moduleId: string;
  resourceKind: string;
  resourceIds: string[];
  status: string;
  createdAt: string;
  resourceCount: number;
}

// --- helpers --------------------------------------------------------

const DR_API = '/api/deployment-registry/api/v1/G';

function whenAgo(iso?: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

const HEALTH_STYLE: Record<Health, string> = {
  healthy:
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  degraded:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  down: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  unknown:
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

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

// --- component ------------------------------------------------------

/**
 * Replaces the manifest-driven `DeploymentsView` for modules that
 * declare `deployments.deployableKinds`. Renders:
 *   - "Where is <module> live?" — env table
 *   - Deploy FROM this env wizard
 *   - Recent deployments timeline
 *
 * Mounted at `/m/<slug>/deployments` when the manifest's deployments nav
 * item sets `feComponent: "DeploymentsModulePage"`.
 */
const DeploymentsModulePage: React.FC = () => {
  const { moduleId, manifest, loading: moduleLoading } = useModuleContext();
  const { toast } = useToast();

  const moduleName = manifest?.moduleName || moduleId || 'this module';
  const deployableKinds: string[] = useMemo(() => {
    // manifest.deployments.deployableKinds is the v3 field. Older modules
    // may not have it; gracefully handle missing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((manifest as any)?.deployments?.deployableKinds || []) as string[];
  }, [manifest]);

  const [envs, setEnvs] = useState<EnvironmentRow[]>([]);
  const [envsLoading, setEnvsLoading] = useState(true);
  const [recentDRs, setRecentDRs] = useState<DeploymentRequestPublic[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const loadEnvs = useCallback(async () => {
    if (!moduleId) return;
    setEnvsLoading(true);
    try {
      const res = await api.get<EnvironmentRow[]>(
        `${DR_API}/environments?capability=${encodeURIComponent(moduleId)}`,
      );
      // Current BE doesn't implement capability filter in Phase 2, so
      // filter client-side by capabilities array.
      const list = Array.isArray(res.data) ? res.data : [];
      const filtered = list.filter(
        (e) => !e.capabilities || e.capabilities.includes(moduleId),
      );
      setEnvs(filtered);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message || 'Failed to load environments';
      toast(msg, 'error');
      setEnvs([]);
    } finally {
      setEnvsLoading(false);
    }
  }, [moduleId, toast]);

  const loadRecent = useCallback(async () => {
    if (!moduleId) return;
    try {
      const res = await api.get<DeploymentRequestPublic[]>(
        `${DR_API}/requests?moduleId=${encodeURIComponent(moduleId)}&limit=5`,
      );
      setRecentDRs(Array.isArray(res.data) ? res.data : []);
    } catch {
      // non-fatal
    }
  }, [moduleId]);

  useEffect(() => {
    loadEnvs();
    loadRecent();
  }, [loadEnvs, loadRecent]);

  if (moduleLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading deployments…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Rocket size={22} className="text-indigo-600" />
            <h1 className="text-2xl font-bold">
              Where is {moduleName} live?
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Environments that declare <code className="font-mono">{moduleId}</code> as
            a capability. Deployable resource kinds:{' '}
            {deployableKinds.length > 0 ? (
              deployableKinds.map((k, i) => (
                <span key={k} className="font-mono">
                  {i > 0 && ', '}
                  <span className="text-gray-700 dark:text-gray-300">{k}</span>
                </span>
              ))
            ) : (
              <span className="italic">none declared</span>
            )}
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadEnvs();
              loadRecent();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw size={14} /> Reload
          </button>
          <button
            onClick={() => setWizardOpen(true)}
            disabled={envs.length < 2 || deployableKinds.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitBranch size={14} /> Deploy FROM this environment
          </button>
        </div>
      </div>

      {/* Env table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold text-gray-500 flex items-center gap-2">
          <Globe size={14} /> Environments ({envs.length})
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2 font-semibold">envId</th>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Version</th>
              <th className="px-4 py-2 font-semibold">Last seen</th>
              <th className="px-4 py-2 font-semibold">Drift Δ</th>
              <th className="px-4 py-2 font-semibold">Health</th>
              <th className="px-4 py-2 font-semibold">baseUrl</th>
            </tr>
          </thead>
          <tbody>
            {envsLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!envsLoading && envs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No environments declare <code>{moduleId}</code> as a capability.
                  Register envs via the{' '}
                  <Link
                    to="/m/deployment-registry/environments"
                    className="text-indigo-600 hover:underline"
                  >
                    Environments
                  </Link>{' '}
                  page.
                </td>
              </tr>
            )}
            {envs.map((env) => (
              <tr
                key={env.envId}
                className="border-b border-gray-100 dark:border-gray-700/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/40"
              >
                <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {env.envId}
                </td>
                <td className="px-4 py-2 font-medium">{env.name}</td>
                <td className="px-4 py-2 text-xs text-gray-500">—</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {whenAgo(env.lastHealthAt)}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">—</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${HEALTH_STYLE[env.healthStatus]}`}
                  >
                    {env.healthStatus}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-xs">
                  <a
                    href={env.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {env.baseUrl}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent deployments */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitBranch size={14} /> Recent deployments
          </span>
          <Link
            to="/m/deployment-registry/requests"
            className="text-[11px] text-indigo-600 hover:underline normal-case"
          >
            View all →
          </Link>
        </div>
        {recentDRs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No deployment requests yet for this module.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentDRs.map((dr) => (
              <div
                key={dr.drId}
                className="px-4 py-2.5 flex items-center gap-3 text-sm"
              >
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {dr.drId}
                </span>
                <span className="text-xs text-gray-500">
                  {dr.sourceEnvId} → {dr.targetEnvId}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {dr.resourceKind} × {dr.resourceCount}
                </span>
                <span
                  className={`ml-auto inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[dr.status] || STATUS_STYLE.DRAFT}`}
                >
                  {dr.status}
                </span>
                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                  {whenAgo(dr.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wizard */}
      {wizardOpen && moduleId && deployableKinds.length > 0 && (
        <DeployWizard
          moduleId={moduleId}
          deployableKinds={deployableKinds}
          envs={envs}
          onClose={() => setWizardOpen(false)}
          onSuccess={(drId) => {
            toast(`Deployment request ${drId} submitted.`, 'success');
            setWizardOpen(false);
            loadRecent();
          }}
        />
      )}
    </div>
  );
};

// --- Wizard ---------------------------------------------------------

interface WizardProps {
  moduleId: string;
  deployableKinds: string[];
  envs: EnvironmentRow[];
  onClose: () => void;
  onSuccess: (drId: string) => void;
}

const DeployWizard: React.FC<WizardProps> = ({
  moduleId,
  deployableKinds,
  envs,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  // Pick defaults: source = env whose baseUrl matches current origin,
  // else the first env. Target = first different env.
  const defaultSource = useMemo(() => {
    const origin = window.location.origin;
    const match = envs.find(
      (e) =>
        e.baseUrl.replace(/\/+$/, '') === origin.replace(/\/+$/, ''),
    );
    return match?.envId || envs[0]?.envId || '';
  }, [envs]);

  const [sourceEnvId, setSourceEnvId] = useState(defaultSource);
  const [targetEnvId, setTargetEnvId] = useState(
    envs.find((e) => e.envId !== defaultSource)?.envId || '',
  );
  const [kind, setKind] = useState(deployableKinds[0]);
  const [resources, setResources] = useState<DeployableSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [diffPreview, setDiffPreview] = useState<
    Record<string, unknown> | null
  >(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadResources = useCallback(async () => {
    if (!kind) return;
    setResourcesLoading(true);
    try {
      const slug = moduleIdToSlug(moduleId);
      // Call THIS browser's same-origin FE, which will hit the local
      // nginx-proxied module endpoint. In Phase 3 we assume the source
      // env's module is the same as the one this page is served from;
      // cross-env source fetches wait for Phase 5.
      const res = await api.get<DeployableSummary[]>(
        `/api/${slug}/api/v1/G/_deployable/${encodeURIComponent(kind)}`,
      );
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message || 'Failed to load resources';
      toast(msg, 'error');
      setResources([]);
    } finally {
      setResourcesLoading(false);
    }
  }, [kind, moduleId, toast]);

  useEffect(() => {
    if (step === 3) loadResources();
  }, [step, loadResources]);

  const loadDiffPreview = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setDiffPreview(null);
      return;
    }
    try {
      const slug = moduleIdToSlug(moduleId);
      const snapshots: Record<string, unknown> = {};
      // Fetch one-at-a-time to mirror BE flow; Phase 4 may batch.
      for (const id of ids) {
        const res = await api.get(
          `/api/${slug}/api/v1/G/_deployable/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/snapshot?sourceEnvId=${encodeURIComponent(sourceEnvId)}`,
        );
        snapshots[id] = res.data;
      }
      setDiffPreview({
        kind,
        moduleId,
        sourceEnvId,
        targetEnvId,
        resources: snapshots,
      });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message || 'Failed to fetch diff';
      toast(msg, 'error');
      setDiffPreview(null);
    }
  }, [selected, kind, moduleId, sourceEnvId, targetEnvId, toast]);

  useEffect(() => {
    if (step === 4) loadDiffPreview();
  }, [step, loadDiffPreview]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const createRes = await api.post(`${DR_API}/requests`, {
        sourceEnvId,
        targetEnvId,
        moduleId,
        resourceKind: kind,
        resourceIds: Array.from(selected),
        reviewComment: comment || undefined,
      });
      const drId: string = createRes.data?.drId;
      if (!drId) throw new Error('No drId returned from DR create');
      await api.post(`${DR_API}/requests/${drId}/submit`, {
        comment: comment || undefined,
      });
      onSuccess(drId);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.message || 'Failed to submit deployment request';
      toast(String(msg), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sourceEnv = envs.find((e) => e.envId === sourceEnvId);
  const targetEnv = envs.find((e) => e.envId === targetEnvId);

  const canNext = (() => {
    if (step === 1) return !!sourceEnvId;
    if (step === 2) return !!targetEnvId && targetEnvId !== sourceEnvId;
    if (step === 3) return selected.size > 0;
    if (step === 4) return !!diffPreview;
    return true;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GitBranch size={18} /> New deployment request
            </h2>
            <div className="text-xs text-gray-500 mt-0.5">
              Step {step} of 5
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-[11px]">
          {['Source', 'Target', 'Resources', 'Review diff', 'Submit'].map(
            (label, i) => (
              <React.Fragment key={label}>
                <div
                  className={`px-2 py-0.5 rounded ${
                    step === i + 1
                      ? 'bg-indigo-600 text-white'
                      : step > i + 1
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                  }`}
                >
                  {i + 1}. {label}
                </div>
                {i < 4 && <ChevronRight size={12} className="text-gray-400" />}
              </React.Fragment>
            ),
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1 — Source */}
          {step === 1 && (
            <div>
              <div className="text-sm font-medium mb-2">Pick source environment</div>
              <p className="text-xs text-gray-500 mb-3">
                The environment whose data you want to promote. Defaulted to
                the environment this browser is viewing.
              </p>
              <Select
                value={sourceEnvId}
                options={envs.map((e) => ({
                  value: e.envId,
                  label: `${e.name} (${e.envId})`,
                }))}
                onChange={setSourceEnvId}
                placeholder="Select source env"
                minWidth={320}
              />
              {sourceEnv && (
                <div className="text-[11px] text-gray-500 mt-2 font-mono">
                  {sourceEnv.baseUrl}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Target */}
          {step === 2 && (
            <div>
              <div className="text-sm font-medium mb-2">Pick target environment</div>
              <p className="text-xs text-gray-500 mb-3">
                Where the configuration/data will be promoted to. Must be
                different from source.
              </p>
              <Select
                value={targetEnvId}
                options={envs
                  .filter((e) => e.envId !== sourceEnvId)
                  .map((e) => ({
                    value: e.envId,
                    label: `${e.name} (${e.envId})`,
                  }))}
                onChange={setTargetEnvId}
                placeholder="Select target env"
                minWidth={320}
              />
              {targetEnv && (
                <div className="text-[11px] text-gray-500 mt-2 font-mono">
                  {targetEnv.baseUrl}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Resources */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Resource kind</div>
                <Select
                  value={kind}
                  options={deployableKinds.map((k) => ({
                    value: k,
                    label: k,
                  }))}
                  onChange={(v) => {
                    setKind(v);
                    setSelected(new Set());
                  }}
                  minWidth={220}
                />
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded max-h-72 overflow-y-auto">
                {resourcesLoading ? (
                  <div className="p-4 text-sm text-gray-500">Loading…</div>
                ) : resources.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No resources available for kind{' '}
                    <code className="font-mono">{kind}</code>.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {resources.map((r) => {
                      const checked = selected.has(r.id);
                      return (
                        <li key={r.id} className="px-3 py-2 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelected((prev) => {
                                const n = new Set(prev);
                                if (e.target.checked) n.add(r.id);
                                else n.delete(r.id);
                                return n;
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{r.name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {r.id}
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {whenAgo(r.lastUpdated)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {selected.size} resource{selected.size === 1 ? '' : 's'} selected
              </div>
            </div>
          )}

          {/* Step 4 — Review diff */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Review payload snapshot
              </div>
              <div className="text-xs text-gray-500">
                Immutable JSON bundled for this request. Checker will see the
                same content in the approval UI.
              </div>
              {diffPreview ? (
                <JsonViewer value={diffPreview} maxHeightClass="max-h-80" />
              ) : (
                <div className="text-sm text-gray-500">Loading snapshot…</div>
              )}
            </div>
          )}

          {/* Step 5 — Submit */}
          {step === 5 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Confirm &amp; submit</div>
              <div className="rounded border border-gray-200 dark:border-gray-700 p-3 text-sm bg-gray-50 dark:bg-gray-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{sourceEnvId}</span>
                  <ArrowRight size={14} />
                  <span className="font-mono text-xs">{targetEnvId}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {moduleId} · {kind} · {selected.size} resource
                  {selected.size === 1 ? '' : 's'}
                </div>
              </div>
              <textarea
                className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800"
                placeholder="Optional comment for the checker…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3 flex gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  This creates a DRAFT and immediately moves it to{' '}
                  <strong>SUBMITTED</strong>. A checker must approve it
                  (Phase 4) before it is applied to {targetEnvId}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Back
          </button>
          {step < 5 ? (
            <button
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send size={14} /> Submit
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function moduleIdToSlug(moduleId: string): string {
  const parts = moduleId.split('-');
  if (parts.length >= 3 && parts[0] === 'zorbit') {
    return parts.slice(2).join('-').replace(/_/g, '-');
  }
  return moduleId.replace(/_/g, '-');
}

export default DeploymentsModulePage;

// Ensure CheckCircle2 + Link are referenced (avoid unused import warnings
// when builds tighten lint rules)
void CheckCircle2;
void Link;

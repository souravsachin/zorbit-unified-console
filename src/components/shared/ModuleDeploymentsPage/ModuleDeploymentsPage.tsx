import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Server,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  GitBranch,
  History,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '../Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModuleDeploymentsPageProps {
  moduleId: string;
  moduleName: string;
  icon: React.ElementType;
}

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
  apiToken: string;
  type: 'Dev' | 'UAT' | 'Prod' | 'Training';
  status: 'Active' | 'Inactive';
  lastSync: string | null;
}

interface ConfigVersion {
  id: string;
  version: string;
  createdBy: string;
  createdAt: string;
  status: 'Draft' | 'Published' | 'Deployed';
  environment: string | null;
}

interface DeploymentRecord {
  id: string;
  version: string;
  fromEnv: string;
  toEnv: string;
  deployedBy: string;
  deployedAt: string;
  status: 'Success' | 'Failed' | 'Pending';
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'zorbit_deployments_';

function loadEnvironments(moduleId: string): Environment[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${moduleId}_envs`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Default: local environment
  return [{
    id: 'env-local',
    name: 'Local',
    baseUrl: window.location.origin,
    apiToken: '',
    type: 'Dev',
    status: 'Active',
    lastSync: new Date().toISOString(),
  }];
}

function saveEnvironments(moduleId: string, envs: Environment[]) {
  localStorage.setItem(`${STORAGE_PREFIX}${moduleId}_envs`, JSON.stringify(envs));
}

function loadVersions(moduleId: string): ConfigVersion[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${moduleId}_versions`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveVersions(moduleId: string, versions: ConfigVersion[]) {
  localStorage.setItem(`${STORAGE_PREFIX}${moduleId}_versions`, JSON.stringify(versions));
}

function loadHistory(moduleId: string): DeploymentRecord[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${moduleId}_history`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// ModuleDeploymentsPage
// ---------------------------------------------------------------------------

const ModuleDeploymentsPage: React.FC<ModuleDeploymentsPageProps> = ({
  moduleId,
  moduleName,
  icon: Icon,
}) => {
  const { toast } = useToast();

  // State
  const [environments, setEnvironments] = useState<Environment[]>(() => loadEnvironments(moduleId));
  const [versions] = useState<ConfigVersion[]>(() => loadVersions(moduleId));
  const [history] = useState<DeploymentRecord[]>(() => loadHistory(moduleId));

  // Forms
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [editEnvId, setEditEnvId] = useState<string | null>(null);
  const [envForm, setEnvForm] = useState({ name: '', baseUrl: '', apiToken: '', type: 'Dev' as Environment['type'] });

  // Sections collapsible
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['environments', 'versions', 'history']));

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Persist environments
  useEffect(() => {
    saveEnvironments(moduleId, environments);
  }, [moduleId, environments]);

  // ---- Environment CRUD ----

  const handleAddEnvironment = () => {
    if (!envForm.name.trim() || !envForm.baseUrl.trim()) {
      toast('Name and Base URL are required', 'error');
      return;
    }
    const newEnv: Environment = {
      id: generateId(),
      name: envForm.name.trim(),
      baseUrl: envForm.baseUrl.trim(),
      apiToken: envForm.apiToken.trim(),
      type: envForm.type,
      status: 'Active',
      lastSync: null,
    };
    setEnvironments((prev) => [...prev, newEnv]);
    setEnvForm({ name: '', baseUrl: '', apiToken: '', type: 'Dev' });
    setShowAddEnv(false);
    toast(`Environment "${newEnv.name}" added`, 'success');
  };

  const handleEditEnvironment = () => {
    if (!editEnvId || !envForm.name.trim() || !envForm.baseUrl.trim()) {
      toast('Name and Base URL are required', 'error');
      return;
    }
    setEnvironments((prev) =>
      prev.map((e) =>
        e.id === editEnvId
          ? { ...e, name: envForm.name.trim(), baseUrl: envForm.baseUrl.trim(), apiToken: envForm.apiToken.trim(), type: envForm.type }
          : e,
      ),
    );
    setEditEnvId(null);
    setEnvForm({ name: '', baseUrl: '', apiToken: '', type: 'Dev' });
    toast('Environment updated', 'success');
  };

  const handleDeleteEnvironment = (id: string) => {
    if (id === 'env-local') {
      toast('Cannot delete the Local environment', 'error');
      return;
    }
    setEnvironments((prev) => prev.filter((e) => e.id !== id));
    toast('Environment removed', 'success');
  };

  const startEditEnv = (env: Environment) => {
    setEditEnvId(env.id);
    setEnvForm({ name: env.name, baseUrl: env.baseUrl, apiToken: env.apiToken, type: env.type });
    setShowAddEnv(false);
  };

  const cancelForm = () => {
    setShowAddEnv(false);
    setEditEnvId(null);
    setEnvForm({ name: '', baseUrl: '', apiToken: '', type: 'Dev' });
  };

  const ENV_TYPE_COLORS: Record<string, string> = {
    Dev: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    UAT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    Prod: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    Training: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  const STATUS_COLORS: Record<string, string> = {
    Active: 'text-green-600 dark:text-green-400',
    Inactive: 'text-gray-400 dark:text-gray-500',
    Success: 'text-green-600 dark:text-green-400',
    Failed: 'text-red-600 dark:text-red-400',
    Pending: 'text-amber-600 dark:text-amber-400',
    Draft: 'text-gray-500 dark:text-gray-400',
    Published: 'text-blue-600 dark:text-blue-400',
    Deployed: 'text-green-600 dark:text-green-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {moduleName} — Deployments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage environments, configuration versions, and deployment history
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Section 1: Environments */}
      {/* ================================================================ */}
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection('environments')}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Globe size={18} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Environments
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {environments.length} configured
              </p>
            </div>
          </div>
          {expandedSections.has('environments') ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {expandedSections.has('environments') && (
          <div className="p-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">URL</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Last Sync</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {environments.map((env) => (
                    <tr key={env.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Server size={14} className="text-gray-400" />
                          {env.name}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {env.baseUrl}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ENV_TYPE_COLORS[env.type] || ''}`}>
                          {env.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${STATUS_COLORS[env.status] || ''}`}>
                          {env.status === 'Active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {env.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                        {env.lastSync ? new Date(env.lastSync).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => startEditEnv(env)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} className="text-gray-400" />
                          </button>
                          {env.id !== 'env-local' && (
                            <button
                              onClick={() => handleDeleteEnvironment(env.id)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add/Edit Environment Form */}
            {(showAddEnv || editEnvId) && (
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editEnvId ? 'Edit Environment' : 'Add Environment'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={envForm.name}
                      onChange={(e) => setEnvForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Production EU"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Base URL</label>
                    <input
                      type="text"
                      value={envForm.baseUrl}
                      onChange={(e) => setEnvForm((f) => ({ ...f, baseUrl: e.target.value }))}
                      placeholder="https://api.example.com"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Token</label>
                    <input
                      type="password"
                      value={envForm.apiToken}
                      onChange={(e) => setEnvForm((f) => ({ ...f, apiToken: e.target.value }))}
                      placeholder="Bearer token"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                    <select
                      value={envForm.type}
                      onChange={(e) => setEnvForm((f) => ({ ...f, type: e.target.value as Environment['type'] }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="Dev">Dev</option>
                      <option value="UAT">UAT</option>
                      <option value="Prod">Prod</option>
                      <option value="Training">Training</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelForm}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editEnvId ? handleEditEnvironment : handleAddEnvironment}
                    className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                  >
                    {editEnvId ? 'Save Changes' : 'Add Environment'}
                  </button>
                </div>
              </div>
            )}

            {!showAddEnv && !editEnvId && (
              <button
                onClick={() => { setShowAddEnv(true); setEditEnvId(null); setEnvForm({ name: '', baseUrl: '', apiToken: '', type: 'Dev' }); }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Plus size={16} />
                Add Environment
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Section 2: Configuration Versions */}
      {/* ================================================================ */}
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection('versions')}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <GitBranch size={18} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Configuration Versions
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {expandedSections.has('versions') ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {expandedSections.has('versions') && (
          <div className="p-5">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <FileText size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  No configuration versions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Configuration versions will be created when the module's API supports
                  snapshotting configuration state.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-3 py-2">Version</th>
                      <th className="px-3 py-2">Created By</th>
                      <th className="px-3 py-2">Created At</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Environment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2.5 font-mono font-medium">{v.version}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{v.createdBy}</td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(v.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium ${STATUS_COLORS[v.status] || ''}`}>{v.status}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{v.environment || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Section 3: Deployment History */}
      {/* ================================================================ */}
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection('history')}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <History size={18} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Deployment History
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {history.length} deployment{history.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {expandedSections.has('history') ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {expandedSections.has('history') && (
          <div className="p-5">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <History size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  No deployments yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Deployment records will appear here once configurations are published
                  to target environments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-3 py-2">Version</th>
                      <th className="px-3 py-2">From</th>
                      <th className="px-3 py-2">To</th>
                      <th className="px-3 py-2">Deployed By</th>
                      <th className="px-3 py-2">Deployed At</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2.5 font-mono font-medium">{d.version}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{d.fromEnv}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{d.toEnv}</td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{d.deployedBy}</td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(d.deployedAt).toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${STATUS_COLORS[d.status] || ''}`}>
                            {d.status === 'Success' ? <CheckCircle2 size={12} /> : d.status === 'Failed' ? <XCircle size={12} /> : <Clock size={12} />}
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="card p-6">
        <div className="flex items-start space-x-3">
          <Rocket size={20} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">About Deployments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              The Deployments page lets you manage target environments and track configuration
              versions for <strong>{moduleName}</strong>. Each deployment creates an immutable
              snapshot that can be rolled back if needed. Cross-environment push will be
              available when multiple deployment targets are configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDeploymentsPage;

import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  Plus,
  Loader2,
  ChevronRight,
  MessageSquare,
  ClipboardList,
  Shield,
  Wrench,
  MessageCircle,
  XCircle,
  X,
  Save,
  Trash2,
  GripVertical,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

interface WorkflowStep {
  order: number;
  type: 'greet' | 'collect' | 'verify' | 'action' | 'respond' | 'close';
  prompt: string;
  field?: string;
  tool?: string;
}

interface Workflow {
  hashId: string;
  organizationHashId: string;
  agentHashId: string;
  name: string;
  steps: WorkflowStep[];
  isActive: boolean;
  _isDemo?: boolean;
  createdAt?: string;
}

interface Agent {
  hashId: string;
  name: string;
}

const STEP_TYPES = [
  { type: 'greet', label: 'Greet', icon: MessageSquare, color: 'text-green-500' },
  { type: 'collect', label: 'Collect Info', icon: ClipboardList, color: 'text-blue-500' },
  { type: 'verify', label: 'Verify', icon: Shield, color: 'text-amber-500' },
  { type: 'action', label: 'Action', icon: Wrench, color: 'text-violet-500' },
  { type: 'respond', label: 'Respond', icon: MessageCircle, color: 'text-cyan-500' },
  { type: 'close', label: 'Close', icon: XCircle, color: 'text-rose-500' },
] as const;

const STEP_TYPE_MAP = Object.fromEntries(STEP_TYPES.map((s) => [s.type, s]));

const JaynaWorkflowsPage: React.FC = () => {
  const { orgId } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formSteps, setFormSteps] = useState<WorkflowStep[]>([
    { order: 1, type: 'greet', prompt: 'Greet the caller' },
    { order: 2, type: 'close', prompt: 'Thank the caller and close' },
  ]);

  const base = (API_CONFIG as Record<string, string>).JAYNA_URL || '/api/jayna';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wfRes, agRes] = await Promise.allSettled([
        api.get(`${base}/api/v1/O/${orgId}/jayna/workflows`),
        api.get(`${base}/api/v1/O/${orgId}/jayna/agents`),
      ]);
      if (wfRes.status === 'fulfilled') {
        const d = wfRes.value.data;
        setWorkflows(d?.workflows || d?.data || (Array.isArray(d) ? d : []));
      }
      if (agRes.status === 'fulfilled') {
        const d = agRes.value.data;
        setAgents(d?.agents || d?.data || (Array.isArray(d) ? d : []));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const addStep = () => {
    const order = formSteps.length + 1;
    setFormSteps([...formSteps, { order, type: 'respond', prompt: '' }]);
  };

  const removeStep = (idx: number) => {
    const updated = formSteps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setFormSteps(updated);
  };

  const updateStep = (idx: number, patch: Partial<WorkflowStep>) => {
    const updated = [...formSteps];
    updated[idx] = { ...updated[idx], ...patch };
    setFormSteps(updated);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post(`${base}/api/v1/O/${orgId}/jayna/workflows`, {
        name: formName,
        agentHashId: formAgentId,
        steps: formSteps,
        isActive: true,
      });
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setSaving(false);
    }
  };

  const getAgentName = (id: string) => agents.find((a) => a.hashId === id)?.name || id;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
            <GitBranch className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Design step-by-step conversation flows for AI agents
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormAgentId(agents[0]?.hashId || '');
            setFormSteps([
              { order: 1, type: 'greet', prompt: 'Greet the caller' },
              { order: 2, type: 'close', prompt: 'Thank the caller and close' },
            ]);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-16 text-center">
          <GitBranch className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No workflows configured yet</p>
          <p className="text-xs text-gray-400">Create a workflow or seed demo data from the Setup page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const isExpanded = expanded === wf.hashId;
            return (
              <div
                key={wf.hashId}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Workflow Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : wf.hashId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors text-left"
                >
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  <GitBranch className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{wf.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">{wf.hashId}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {wf.steps?.length || 0} steps
                  </span>
                  <span className="text-xs text-gray-500">
                    Agent: <span className="font-medium text-gray-700 dark:text-gray-300">{getAgentName(wf.agentHashId)}</span>
                  </span>
                  {wf._isDemo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-medium">
                      demo
                    </span>
                  )}
                  {wf.isActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-medium">active</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">inactive</span>
                  )}
                </button>

                {/* Expanded Steps */}
                {isExpanded && wf.steps && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="relative ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-3">
                      {wf.steps.sort((a, b) => a.order - b.order).map((step, idx) => {
                        const meta = STEP_TYPE_MAP[step.type] || STEP_TYPE_MAP.respond;
                        const Icon = meta.icon;
                        return (
                          <div key={idx} className="relative">
                            <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center`}>
                              <span className="text-[8px] font-bold text-gray-500">{step.order}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                                {step.field && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-mono">
                                    field: {step.field}
                                  </span>
                                )}
                                {step.tool && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 font-mono">
                                    tool: {step.tool}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{step.prompt}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Workflow</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="e.g. Policy Inquiry Flow"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Agent</label>
                <select
                  value={formAgentId}
                  onChange={(e) => setFormAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="">Select agent...</option>
                  {agents.map((a) => (
                    <option key={a.hashId} value={a.hashId}>{a.name} ({a.hashId})</option>
                  ))}
                </select>
              </div>

              {/* Steps Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Steps</label>
                  <button
                    onClick={addStep}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-2">
                  {formSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                      <GripVertical className="h-4 w-4 text-gray-300 mt-2 shrink-0" />
                      <span className="text-xs text-gray-400 font-bold mt-2 w-5 shrink-0">{idx + 1}</span>
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(idx, { type: e.target.value as WorkflowStep['type'] })}
                        className="px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white w-28 shrink-0"
                      >
                        {STEP_TYPES.map((s) => (
                          <option key={s.type} value={s.type}>{s.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={step.prompt}
                        onChange={(e) => updateStep(idx, { prompt: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        placeholder="Step prompt..."
                      />
                      {(step.type === 'collect' || step.type === 'verify') && (
                        <input
                          type="text"
                          value={step.field || ''}
                          onChange={(e) => updateStep(idx, { field: e.target.value })}
                          className="w-28 px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="Field name"
                        />
                      )}
                      {step.type === 'action' && (
                        <input
                          type="text"
                          value={step.tool || ''}
                          onChange={(e) => updateStep(idx, { tool: e.target.value })}
                          className="w-28 px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="Tool name"
                        />
                      )}
                      <button onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-500 mt-1.5 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formName || !formAgentId}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JaynaWorkflowsPage;

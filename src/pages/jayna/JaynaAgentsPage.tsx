import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Plus,
  Loader2,
  Sparkles,
  Mic,
  Brain,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  Phone,
  X,
  Save,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

interface Agent {
  hashId: string;
  organizationHashId: string;
  name: string;
  description: string;
  systemPrompt: string;
  voiceEngine: string;
  voiceId: string;
  llmProvider: string;
  llmModel: string;
  tools: { name: string; endpoint: string }[];
  greeting: string;
  isActive: boolean;
  _isDemo?: boolean;
  createdAt?: string;
}

const LLM_OPTIONS = [
  { provider: 'openai', models: ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { provider: 'anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307'] },
  { provider: 'ollama', models: ['llama3', 'mistral', 'mixtral'] },
];

const VOICE_OPTIONS = [
  'en-US-AriaNeural',
  'en-US-GuyNeural',
  'en-US-JennyNeural',
  'en-GB-SoniaNeural',
  'en-GB-RyanNeural',
  'en-AU-NatashaNeural',
  'ar-AE-FatimaNeural',
  'ar-AE-HamdanNeural',
];

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  anthropic: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ollama: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const EMPTY_AGENT: Omit<Agent, 'hashId' | 'organizationHashId' | 'createdAt'> = {
  name: '',
  description: '',
  systemPrompt: '',
  voiceEngine: 'edge-tts',
  voiceId: 'en-US-AriaNeural',
  llmProvider: 'openai',
  llmModel: 'gpt-4',
  tools: [],
  greeting: '',
  isActive: true,
};

const JaynaAgentsPage: React.FC = () => {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState(EMPTY_AGENT);
  const [saving, setSaving] = useState(false);

  const base = (API_CONFIG as Record<string, string>).JAYNA_URL || '/api/jayna';

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/jayna/agents`);
      const d = res.data;
      setAgents(d?.agents || d?.data || (Array.isArray(d) ? d : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, [orgId]);

  const openCreate = () => {
    setEditingAgent(null);
    setForm({ ...EMPTY_AGENT });
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      voiceEngine: agent.voiceEngine,
      voiceId: agent.voiceId,
      llmProvider: agent.llmProvider,
      llmModel: agent.llmModel,
      tools: agent.tools || [],
      greeting: agent.greeting,
      isActive: agent.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAgent) {
        await api.put(`${base}/api/v1/O/${orgId}/jayna/agents/${editingAgent.hashId}`, form);
      } else {
        await api.post(`${base}/api/v1/O/${orgId}/jayna/agents`, form);
      }
      setShowModal(false);
      fetchAgents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hashId: string) => {
    if (!confirm('Delete this agent?')) return;
    try {
      await api.delete(`${base}/api/v1/O/${orgId}/jayna/agents/${hashId}`);
      fetchAgents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
            <Bot className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure voice agents with personalities, voices, and LLM settings
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Agent
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
      ) : agents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-16 text-center">
          <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No agents configured yet</p>
          <p className="text-xs text-gray-400">Create an agent or seed demo data from the Setup page</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.hashId}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
            >
              {/* Card Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {agent._isDemo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-medium">
                        demo
                      </span>
                    )}
                    {agent.isActive ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-medium flex items-center gap-0.5">
                        <ToggleRight className="h-3 w-3" /> active
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium flex items-center gap-0.5">
                        <ToggleLeft className="h-3 w-3" /> inactive
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-400">{agent.hashId}</span>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{agent.description}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PROVIDER_COLORS[agent.llmProvider] || 'bg-gray-100 text-gray-600'}`}>
                    <Brain className="h-3 w-3 inline mr-0.5" />
                    {agent.llmProvider}/{agent.llmModel}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    <Mic className="h-3 w-3 inline mr-0.5" />
                    {agent.voiceId}
                  </span>
                </div>

                {agent.greeting && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 mb-0.5">Greeting</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">"{agent.greeting}"</p>
                  </div>
                )}

                {agent.tools && agent.tools.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-gray-400">Tools:</span>
                    {agent.tools.map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/jayna/test-call?agent=${agent.hashId}`)}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" /> Test Call
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(agent)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(agent.hashId)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingAgent ? 'Edit Agent' : 'Create Agent'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="e.g. AWNIC Customer Service"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="Handles policy inquiries and claims status"
                />
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">System Prompt</label>
                <textarea
                  rows={4}
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono"
                  placeholder="You are a friendly customer service agent for AWNIC insurance..."
                />
              </div>

              {/* Greeting */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Greeting Message</label>
                <input
                  type="text"
                  value={form.greeting}
                  onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="Hello, this is AWNIC customer service. How can I help you today?"
                />
              </div>

              {/* LLM Provider & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">LLM Provider</label>
                  <select
                    value={form.llmProvider}
                    onChange={(e) => {
                      const provider = e.target.value;
                      const models = LLM_OPTIONS.find((o) => o.provider === provider)?.models || [];
                      setForm({ ...form, llmProvider: provider, llmModel: models[0] || '' });
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    {LLM_OPTIONS.map((o) => (
                      <option key={o.provider} value={o.provider}>{o.provider}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                  <select
                    value={form.llmModel}
                    onChange={(e) => setForm({ ...form, llmModel: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    {(LLM_OPTIONS.find((o) => o.provider === form.llmProvider)?.models || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Voice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Voice Engine</label>
                  <select
                    value={form.voiceEngine}
                    onChange={(e) => setForm({ ...form, voiceEngine: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    <option value="edge-tts">Edge TTS (Microsoft)</option>
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="azure">Azure Neural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Voice ID</label>
                  <select
                    value={form.voiceId}
                    onChange={(e) => setForm({ ...form, voiceId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-xs text-gray-700 dark:text-gray-300">Agent is active</label>
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
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingAgent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JaynaAgentsPage;

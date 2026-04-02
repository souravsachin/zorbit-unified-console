import React, { useEffect, useState } from 'react';
import {
  Code,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Hash,
  ToggleLeft,
  Calendar,
  Type,
  Braces,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FieldDef {
  path: string;
  label: string;
  type: string;
  category?: string;
}

interface FieldGroup {
  label: string;
  fields: FieldDef[];
}

interface OperatorDef {
  value: string;
  label: string;
}

interface ActionDef {
  value: string;
  label: string;
  category: string;
  actionCode: string;
  statusAutomated: string;
  statusNonAutomated: string;
}

interface FieldsResponse {
  fields: Record<string, FieldGroup>;
  operators: Record<string, OperatorDef[]>;
  actions: ActionDef[];
  loadingTypes: { value: string; label: string }[];
  categories: string[];
}

/* ------------------------------------------------------------------ */
/*  Type Icon                                                          */
/* ------------------------------------------------------------------ */

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'number': return <Hash className="h-3 w-3 text-blue-500" />;
    case 'boolean': return <ToggleLeft className="h-3 w-3 text-purple-500" />;
    case 'date': return <Calendar className="h-3 w-3 text-amber-500" />;
    case 'string': return <Type className="h-3 w-3 text-green-500" />;
    default: return <Braces className="h-3 w-3 text-gray-400" />;
  }
}

const TYPE_COLORS: Record<string, string> = {
  number: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  boolean: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  date: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  string: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const HIDecisioningFieldsPage: React.FC = () => {
  const { orgId } = useAuth();
  const [data, setData] = useState<FieldsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'operators' | 'actions' | 'categories'>('fields');

  const base = API_CONFIG.HI_DECISIONING_URL;

  const fetchFields = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/hi-decisioning/available-fields`);
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFields(); }, [orgId]);

  // Count total fields
  const totalFields = data
    ? Object.values(data.fields).reduce((sum, g) => sum + g.fields.length, 0)
    : 0;

  // Filtered fields
  const filterFields = (fields: FieldDef[]) => {
    if (!search) return fields;
    const q = search.toLowerCase();
    return fields.filter((f) => f.label.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  };

  const tabs = [
    { key: 'fields' as const, label: 'Fields', count: totalFields },
    { key: 'operators' as const, label: 'Operators', count: data ? Object.keys(data.operators).length : 0 },
    { key: 'actions' as const, label: 'Actions', count: data?.actions.length || 0 },
    { key: 'categories' as const, label: 'Categories', count: data?.categories.length || 0 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
            <Code className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Field Introspection</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalFields} fields &middot; All available fields, operators, and actions for rule building
            </p>
          </div>
        </div>
        <button
          onClick={fetchFields}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label} <span className="text-gray-400 ml-1">({tab.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data ? (
        <>
          {/* ---- FIELDS TAB ---- */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields by name or path..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
              </div>

              {/* Field Groups */}
              {Object.entries(data.fields).map(([key, group]) => {
                const filtered = filterFields(group.fields);
                if (filtered.length === 0) return null;
                const isExpanded = expandedGroup === key || expandedGroup === null;

                return (
                  <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                      onClick={() => setExpandedGroup(expandedGroup === key ? null : key)}
                    >
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      }
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group.label}</span>
                      <span className="text-xs text-gray-400">({filtered.length} fields)</span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filtered.map((field, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/10">
                            <TypeIcon type={field.type} />
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[field.type] || 'bg-gray-100 text-gray-500'}`}>
                              {field.type}
                            </span>
                            <span className="text-sm text-gray-800 dark:text-gray-200 w-48 truncate">{field.label}</span>
                            <span className="font-mono text-[10px] text-gray-400 flex-1 truncate" title={field.path}>
                              {field.path}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- OPERATORS TAB ---- */}
          {activeTab === 'operators' && (
            <div className="space-y-4">
              {Object.entries(data.operators).map(([type, ops]) => (
                <div key={type} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <TypeIcon type={type} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{type} Operators</span>
                    <span className="text-xs text-gray-400">({ops.length})</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                    {ops.map((op) => (
                      <div key={op.value} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{op.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{op.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- ACTIONS TAB ---- */}
          {activeTab === 'actions' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <th className="text-left py-2.5 px-3 font-medium">Code</th>
                      <th className="text-left py-2.5 px-3 font-medium">Action</th>
                      <th className="text-left py-2.5 px-3 font-medium">Value</th>
                      <th className="text-center py-2.5 px-3 font-medium">Type</th>
                      <th className="text-left py-2.5 px-3 font-medium">Status (Automated)</th>
                      <th className="text-left py-2.5 px-3 font-medium">Status (Non-Automated)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {data.actions.map((action) => (
                      <tr key={action.value} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                        <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-400">{action.actionCode}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">{action.label}</td>
                        <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400">{action.value}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            action.category === 'terminal'
                              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                          }`}>
                            {action.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">{action.statusAutomated}</td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">{action.statusNonAutomated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- CATEGORIES TAB ---- */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.categories.map((cat) => (
                  <div key={cat} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cat}</p>
                  </div>
                ))}
              </div>
              {data.loadingTypes && (
                <div className="mt-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Loading Types</h4>
                  <div className="flex gap-3">
                    {data.loadingTypes.map((lt) => (
                      <div key={lt.value} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg px-4 py-2">
                        <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{lt.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{lt.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default HIDecisioningFieldsPage;

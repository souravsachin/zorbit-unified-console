import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FileText,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Hash,
  Type,
  ToggleLeft,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const API_BASE = '/api/form-builder';

interface FormComponent {
  type: string;
  key: string;
  label?: string;
  title?: string;
  validate?: Record<string, unknown>;
  data?: Record<string, unknown>;
  conditional?: Record<string, unknown>;
  components?: FormComponent[];
  hidden?: boolean;
  [k: string]: unknown;
}

interface FormDefinition {
  _id: string;
  hashId: string;
  organizationHashId: string;
  name: string;
  slug: string;
  description?: string;
  version: number;
  status: string;
  formType: string;
  schema: {
    display: string;
    components: FormComponent[];
  };
  createdAt: string;
  updatedAt: string;
}

// Count fields recursively within a component tree
function countFields(components: FormComponent[]): number {
  let count = 0;
  for (const c of components) {
    if (c.type === 'panel') {
      count += countFields(c.components || []);
    } else if (c.type === 'datagrid' || c.type === 'editgrid' || c.type === 'columns' || c.type === 'fieldset') {
      count += countFields(c.components || []);
    } else if (c.type === 'htmlelement' || c.type === 'content') {
      // Static elements don't count as fields
    } else {
      count += 1;
    }
  }
  return count;
}

function getFieldIcon(type: string) {
  switch (type) {
    case 'textfield': case 'textarea': return <Type size={14} className="text-blue-500" />;
    case 'number': return <Hash size={14} className="text-green-500" />;
    case 'select': case 'selectboxes': case 'radio': return <Layers size={14} className="text-purple-500" />;
    case 'checkbox': return <ToggleLeft size={14} className="text-orange-500" />;
    case 'email': return <Type size={14} className="text-cyan-500" />;
    case 'phoneNumber': return <Hash size={14} className="text-teal-500" />;
    case 'datetime': return <Type size={14} className="text-pink-500" />;
    case 'file': return <FileText size={14} className="text-amber-500" />;
    case 'datagrid': case 'editgrid': return <Layers size={14} className="text-indigo-500" />;
    default: return <Type size={14} className="text-gray-400" />;
  }
}

const FormEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('zorbit_token');
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE}/api/v1/O/O-OZPY/form-builder/forms`, { headers })
      .then(r => r.ok ? r.json() : { forms: [] })
      .then(data => {
        const forms = data.forms || (Array.isArray(data) ? data : []);
        const found = forms.find((f: FormDefinition) => f.slug === slug);
        if (found) {
          setForm(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const expandAll = () => {
    if (!form) return;
    const steps = form.schema.components.filter(c => c.type === 'panel');
    setExpandedSteps(new Set(steps.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const updateFieldLabel = useCallback((stepIdx: number, fieldIdx: number, newLabel: string) => {
    if (!form) return;
    const updated = { ...form };
    const steps = updated.schema.components.filter(c => c.type === 'panel');
    const step = steps[stepIdx];
    if (step && step.components && step.components[fieldIdx]) {
      step.components[fieldIdx] = { ...step.components[fieldIdx], label: newLabel };
      setForm({ ...updated });
      setDirty(true);
    }
  }, [form]);

  const toggleFieldVisibility = useCallback((stepIdx: number, fieldIdx: number) => {
    if (!form) return;
    const updated = { ...form };
    const steps = updated.schema.components.filter(c => c.type === 'panel');
    const step = steps[stepIdx];
    if (step && step.components && step.components[fieldIdx]) {
      const field = step.components[fieldIdx];
      step.components[fieldIdx] = { ...field, hidden: !field.hidden };
      setForm({ ...updated });
      setDirty(true);
    }
  }, [form]);

  const moveField = useCallback((stepIdx: number, fieldIdx: number, direction: 'up' | 'down') => {
    if (!form) return;
    const updated = { ...form };
    const steps = updated.schema.components.filter(c => c.type === 'panel');
    const step = steps[stepIdx];
    if (!step || !step.components) return;
    const arr = [...step.components];
    const swapIdx = direction === 'up' ? fieldIdx - 1 : fieldIdx + 1;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[fieldIdx], arr[swapIdx]] = [arr[swapIdx], arr[fieldIdx]];
    step.components = arr;
    setForm({ ...updated });
    setDirty(true);
  }, [form]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const token = localStorage.getItem('zorbit_token');
      const res = await fetch(`${API_BASE}/api/v1/O/O-OZPY/form-builder/forms/${form.slug}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          schema: form.schema,
        }),
      });
      if (res.ok) {
        setSaveStatus('success');
        setDirty(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Form not found</p>
        <p className="text-sm text-gray-400 mt-1">No form with slug "{slug}" exists.</p>
        <button
          onClick={() => navigate('/form-builder/templates')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          Back to Templates
        </button>
      </div>
    );
  }

  const steps = form.schema.components.filter(c => c.type === 'panel');
  const totalFields = countFields(form.schema.components);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/form-builder/templates')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{form.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {form.description || 'No description'} &middot; v{form.version} &middot;{' '}
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
              form.status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {form.status}
            </span>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            dirty
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : saveStatus === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      {saveStatus === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to save changes. Please try again.
        </div>
      )}

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{steps.length}</p>
          <p className="text-xs text-gray-500 mt-1">Wizard Steps</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalFields}</p>
          <p className="text-xs text-gray-500 mt-1">Total Fields</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 capitalize">{form.schema.display}</p>
          <p className="text-xs text-gray-500 mt-1">Display Mode</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{form.formType}</p>
          <p className="text-xs text-gray-500 mt-1">Form Type</p>
        </div>
      </div>

      {/* Step list controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Form Steps & Fields</h2>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Expand All
          </button>
          <button onClick={collapseAll} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Collapse All
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, stepIdx) => {
          const isExpanded = expandedSteps.has(stepIdx);
          const fields = step.components || [];
          const fieldCount = countFields(fields);
          return (
            <div
              key={step.key || stepIdx}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Step header */}
              <button
                onClick={() => toggleStep(stepIdx)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  {stepIdx + 1}
                </span>
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 text-left">
                  {step.title || step.key}
                </span>
                <span className="text-xs text-gray-400">{fieldCount} fields</span>
              </button>

              {/* Fields */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {fields.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400">No fields in this step.</p>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {fields.map((field, fieldIdx) => {
                        const isHidden = !!field.hidden;
                        const hasCondition = !!field.conditional;
                        const isRequired = !!(field.validate as Record<string, unknown>)?.required;
                        const isDataGrid = field.type === 'datagrid' || field.type === 'editgrid';

                        return (
                          <div
                            key={field.key || fieldIdx}
                            className={`flex items-center gap-3 px-5 py-3 group ${isHidden ? 'opacity-50' : ''}`}
                          >
                            {/* Drag handle placeholder */}
                            <GripVertical size={14} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

                            {/* Type icon */}
                            {getFieldIcon(field.type)}

                            {/* Label (editable) */}
                            <input
                              type="text"
                              value={field.label || field.title || field.key}
                              onChange={(e) => updateFieldLabel(stepIdx, fieldIdx, e.target.value)}
                              className="flex-1 text-sm bg-transparent border-0 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none px-1 py-0.5 text-gray-900 dark:text-white transition-colors"
                            />

                            {/* Type badge */}
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">
                              {field.type}
                            </span>

                            {/* Key */}
                            <span className="text-xs text-gray-400 font-mono hidden lg:inline">
                              {field.key}
                            </span>

                            {/* Indicators */}
                            {isRequired && (
                              <span className="text-xs text-red-400" title="Required">*</span>
                            )}
                            {hasCondition && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" title="Has conditional logic">
                                if
                              </span>
                            )}

                            {/* Reorder buttons */}
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => moveField(stepIdx, fieldIdx, 'up')}
                                disabled={fieldIdx === 0}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                title="Move up"
                              >
                                <ChevronRight size={12} className="rotate-[-90deg] text-gray-400" />
                              </button>
                              <button
                                onClick={() => moveField(stepIdx, fieldIdx, 'down')}
                                disabled={fieldIdx === fields.length - 1}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                title="Move down"
                              >
                                <ChevronRight size={12} className="rotate-90 text-gray-400" />
                              </button>
                            </div>

                            {/* Visibility toggle */}
                            <button
                              onClick={() => toggleFieldVisibility(stepIdx, fieldIdx)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title={isHidden ? 'Show field' : 'Hide field'}
                            >
                              {isHidden ? (
                                <EyeOff size={14} className="text-gray-400" />
                              ) : (
                                <Eye size={14} className="text-gray-400" />
                              )}
                            </button>

                            {/* Sub-fields for datagrid */}
                            {isDataGrid && field.components && field.components.length > 0 && (
                              <span className="text-xs text-indigo-400" title={`${field.components.length} sub-fields`}>
                                ({field.components.length} sub)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Raw JSON preview */}
      <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <summary className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
          Raw JSON Schema
        </summary>
        <div className="px-5 pb-5">
          <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            {JSON.stringify(form.schema, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default FormEditorPage;

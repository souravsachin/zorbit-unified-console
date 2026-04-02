import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Save, Send, Loader2, AlertTriangle,
  CheckCircle2, FileText, Upload, X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormField {
  type: string;
  key: string;
  label?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  content?: string;
  tag?: string;
  defaultValue?: unknown;
  validate?: {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  conditional?: {
    show: boolean;
    when: string;
    eq: unknown;
  };
  data?: {
    values: Array<{ label: string; value: string }>;
  };
  values?: Array<{ label: string; value: string }>;
  components?: FormField[];
  inputMask?: string;
  format?: string;
  storage?: string;
  filePattern?: string;
  fileMaxSize?: string;
}

interface FormPanel {
  type: string;
  key: string;
  title: string;
  components: FormField[];
}

interface FormDefinition {
  hashId: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  formType: string;
  schema: {
    display: string;
    components: FormPanel[];
  };
  piiFields?: Array<{ fieldPath: string; piiType: string }>;
}

interface RegionalFormPageProps {
  formSlug: string;
  regionName: string;
  regionFlag: string;
  accentColor: string;
}

const FORM_BUILDER_API = '/api/form-builder';

/* ------------------------------------------------------------------ */
/*  Field Renderer                                                     */
/* ------------------------------------------------------------------ */

function shouldShowField(field: FormField, formData: Record<string, unknown>): boolean {
  if (!field.conditional) return true;
  const { show, when, eq } = field.conditional;
  const currentValue = formData[when];
  const matches = currentValue === eq || String(currentValue) === String(eq);
  return show ? matches : !matches;
}

function FieldRenderer({
  field,
  value,
  onChange,
  formData,
}: {
  field: FormField;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
  formData: Record<string, unknown>;
}) {
  if (!shouldShowField(field, formData)) return null;

  const isRequired = field.validate?.required;
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800';

  switch (field.type) {
    case 'htmlelement':
      return (
        <div className={field.className || 'text-sm text-gray-600 dark:text-gray-400 mb-2'}>
          {field.tag === 'h4' || field.tag === 'h5' ? (
            <h4 className={field.className || 'font-semibold text-lg mb-2'}>{field.content}</h4>
          ) : (
            <p className={field.className}>{field.content}</p>
          )}
        </div>
      );

    case 'textfield':
    case 'phoneNumber':
    case 'email':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            className={inputClass}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={field.disabled}
            maxLength={field.validate?.maxLength}
          />
          {field.description && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            className={inputClass}
            value={(value as number) ?? ''}
            onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : '')}
            disabled={field.disabled}
            min={field.validate?.min}
            max={field.validate?.max}
          />
          {field.description && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            className={inputClass + ' min-h-[80px]'}
            value={(value as string) || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );

    case 'select':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            className={inputClass}
            value={(value as string) || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={field.disabled}
          >
            <option value="">{field.placeholder || '-- Select --'}</option>
            {(field.data?.values || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'radio':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="flex flex-wrap gap-4 mt-1">
            {(field.values || []).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.key}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(field.key, opt.value)}
                  disabled={field.disabled}
                  className="text-fuchsia-600 focus:ring-fuchsia-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {field.description && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="mb-4">
          <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.key, e.target.checked)}
              className="mt-0.5 text-fuchsia-600 focus:ring-fuchsia-500 rounded"
            />
            <span>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </span>
          </label>
        </div>
      );

    case 'selectboxes':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(field.values || []).map((opt) => {
              const current = (value as Record<string, boolean>) || {};
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!current[opt.value]}
                    onChange={(e) => {
                      onChange(field.key, { ...current, [opt.value]: e.target.checked });
                    }}
                    className="text-fuchsia-600 focus:ring-fuchsia-500 rounded"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'datetime':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            className={inputClass}
            value={(value as string) || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={field.disabled}
          />
          {field.description && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'file':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              {value ? 'File selected' : 'Click or drag to upload'}
            </span>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept={field.filePattern}
              multiple={field.multiple}
              onChange={(e) => onChange(field.key, e.target.files?.[0]?.name || '')}
            />
          </div>
          {field.description && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      );

    case 'datagrid':
      return <DataGridRenderer field={field} value={value} onChange={onChange} formData={formData} />;

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  DataGrid Renderer                                                  */
/* ------------------------------------------------------------------ */

function DataGridRenderer({
  field,
  value,
  onChange,
  formData,
}: {
  field: FormField;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
  formData: Record<string, unknown>;
}) {
  const rows = (value as Array<Record<string, unknown>>) || [{}];
  const subFields = field.components || [];

  const updateRow = (rowIdx: number, subKey: string, val: unknown) => {
    const newRows = [...rows];
    newRows[rowIdx] = { ...newRows[rowIdx], [subKey]: val };
    onChange(field.key, newRows);
  };

  const addRow = () => {
    onChange(field.key, [...rows, {}]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange(field.key, rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {field.label}
      </label>
      <div className="space-y-3">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                #{rowIdx + 1}
              </span>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(rowIdx)}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4">
              {subFields.map((sf) => (
                <FieldRenderer
                  key={sf.key}
                  field={sf}
                  value={row[sf.key]}
                  onChange={(k, v) => updateRow(rowIdx, k, v)}
                  formData={{ ...formData, ...row }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-sm text-fuchsia-600 hover:text-fuchsia-700 font-medium"
      >
        + Add another
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const RegionalFormPage: React.FC<RegionalFormPageProps> = ({
  formSlug,
  regionName,
  regionFlag,
  accentColor,
}) => {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `${FORM_BUILDER_API}/api/v1/O/${orgId}/form-builder/forms/${formSlug}`,
        );
        setFormDef(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load form definition');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [orgId, formSlug]);

  const panels = useMemo(() => {
    if (!formDef?.schema?.components) return [];
    return formDef.schema.components.filter((c) => c.type === 'panel');
  }, [formDef]);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Start a form submission
      await api.post(
        `${FORM_BUILDER_API}/api/v1/O/${orgId}/form-builder/forms/${formSlug}/submissions`,
        { data: formData },
      );
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
        <span className="ml-3 text-gray-500">Loading form definition...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={() => navigate('/hi-quotation/new')}
            className="mt-4 text-sm text-fuchsia-600 hover:underline"
          >
            Back to region selection
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Application Submitted
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Your {regionName} health insurance application has been submitted successfully.
            PII fields have been tokenized and stored securely.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/hi-quotation')}
              className="px-4 py-2 text-sm rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              View Quotations
            </button>
            <button
              onClick={() => navigate('/hi-quotation/new')}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              New Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPanel = panels[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === panels.length - 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/hi-quotation/new')}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-2xl">{regionFlag}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {formDef?.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formDef?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText className={`w-4 h-4 ${accentColor}`} />
          <span className="text-xs text-gray-400 font-mono">{formDef?.hashId}</span>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {panels.map((panel, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <button
                key={panel.key}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>
                  {idx + 1}. {panel.title}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-fuchsia-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep + 1) / panels.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Fields */}
      {currentPanel && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-l-4 border-fuchsia-500 pl-3">
            {currentPanel.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {currentPanel.components.map((field) => (
              <div
                key={field.key}
                className={
                  field.type === 'datagrid' ||
                  field.type === 'htmlelement' ||
                  field.type === 'checkbox' ||
                  field.type === 'textarea'
                    ? 'md:col-span-2'
                    : ''
                }
              >
                <FieldRenderer
                  field={field}
                  value={formData[field.key]}
                  onChange={handleFieldChange}
                  formData={formData}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={isFirstStep}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <span className="text-xs text-gray-400">
          Step {currentStep + 1} of {panels.length}
        </span>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Application
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep((s) => Math.min(panels.length - 1, s + 1))}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RegionalFormPage;

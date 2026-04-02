import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Send, Loader2, AlertTriangle,
  CheckCircle2, Upload, X, Calculator,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';

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
  content?: string;
  tag?: string;
  defaultValue?: unknown;
  validate?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
  data?: {
    values: Array<{ label: string; value: string }>;
  };
  values?: Array<{ label: string; value: string }>;
  components?: FormField[];
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
}

const FORM_BUILDER_API = '/api/form-builder';
const PRODUCT_PRICING_API = API_CONFIG.PRODUCT_PRICING_URL || '/api/product-pricing';

/* ------------------------------------------------------------------ */
/*  Field Renderer                                                     */
/* ------------------------------------------------------------------ */

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
}) {
  const isRequired = field.validate?.required;
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  switch (field.type) {
    case 'htmlelement':
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          {field.content}
        </div>
      );

    case 'textfield':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
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
            min={field.validate?.min}
            max={field.validate?.max}
          />
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
          >
            <option value="">-- Select --</option>
            {(field.data?.values || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'selectboxes':
      return (
        <div className="mb-4">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="flex flex-wrap gap-4 mt-1">
            {(field.values || []).map((opt) => {
              const current = (value as Record<string, boolean>) || {};
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!current[opt.value]}
                    onChange={(e) => onChange(field.key, { ...current, [opt.value]: e.target.checked })}
                    className="text-blue-600 focus:ring-blue-500 rounded"
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
          />
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
              className="mt-0.5 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </span>
          </label>
        </div>
      );

    case 'datagrid':
      return <DataGridRenderer field={field} value={value} onChange={onChange} />;

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
}: {
  field: FormField;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
}) {
  const rows = (value as Array<Record<string, unknown>>) || [{}];
  const subFields = field.components || [];

  const updateRow = (rowIdx: number, subKey: string, val: unknown) => {
    const newRows = [...rows];
    newRows[rowIdx] = { ...newRows[rowIdx], [subKey]: val };
    onChange(field.key, newRows);
  };

  const addRow = () => onChange(field.key, [...rows, {}]);

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange(field.key, rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {field.label}
      </label>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs text-gray-500 font-medium">#</th>
              {subFields.map((sf) => (
                <th key={sf.key} className="px-2 py-1.5 text-left text-xs text-gray-500 font-medium">
                  {sf.label}
                </th>
              ))}
              <th className="px-2 py-1.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-2 py-1 text-gray-400 text-xs">{rowIdx + 1}</td>
                {subFields.map((sf) => (
                  <td key={sf.key} className="px-1 py-1">
                    {sf.type === 'select' ? (
                      <select
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={(row[sf.key] as string) || ''}
                        onChange={(e) => updateRow(rowIdx, sf.key, e.target.value)}
                      >
                        <option value="">--</option>
                        {(sf.data?.values || []).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : sf.type === 'number' ? (
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={(row[sf.key] as number) ?? ''}
                        onChange={(e) => updateRow(rowIdx, sf.key, e.target.value ? Number(e.target.value) : '')}
                        min={sf.validate?.min}
                        max={sf.validate?.max}
                        placeholder={sf.placeholder}
                      />
                    ) : (
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={(row[sf.key] as string) || ''}
                        onChange={(e) => updateRow(rowIdx, sf.key, e.target.value)}
                        placeholder={sf.placeholder}
                      />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button
                    onClick={() => removeRow(rowIdx)}
                    className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove row"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addRow}
        className="mt-2 px-3 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        + Add Row
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

const RateCardImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Load the form definition
  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await api.get(
          `${FORM_BUILDER_API}/api/v1/O/O-OZPY/form-builder/forms/rate-card-import`,
        );
        setForm(res.data);
      } catch (err) {
        setError('Failed to load rate card import form. Is it created in Form Builder?');
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, []);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const steps = form?.schema?.components?.filter((c) => c.type === 'panel') || [];
  const totalSteps = steps.length;

  const goNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    setError(null);

    try {
      // Build rate table payload from form data
      const ageBands = (formData.ageBands as Array<Record<string, unknown>>) || [];
      const networks = (formData.networks as Array<Record<string, unknown>>) || [];
      const copayOptions = (formData.copayOptions as Array<Record<string, unknown>>) || [];
      const rates = (formData.rates as Array<Record<string, unknown>>) || [];
      const genders = formData.genders as Record<string, boolean> | undefined;

      const selectedGenders = genders
        ? Object.entries(genders).filter(([, v]) => v).map(([k]) => k)
        : ['Male', 'Female'];

      const rateTablePayload = {
        insurerName: formData.insurerName,
        productName: formData.productName,
        variant: formData.variant || 'Default',
        region: formData.region,
        currency: formData.currency || 'AED',
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo,
        status: 'draft',
        parameters: {
          ageBands: ageBands.map((ab) => ab.bandLabel || `[${ab.minAge}-${ab.maxAge}]`),
          genders: selectedGenders,
          networks: networks.map((n) => n.code as string).filter(Boolean),
          plans: [],
          copayOptions: copayOptions.map((c) => c.copayValue as string).filter(Boolean),
        },
        rates: rates.map((r) => ({
          ageBand: r.ageBand,
          gender: r.gender,
          network: r.network || undefined,
          plan: r.plan || undefined,
          copay: r.copay || '0%',
          netRate: Number(r.netRate) || 0,
        })),
        notes: formData.notes || '',
      };

      const res = await api.post(
        `${PRODUCT_PRICING_API}/api/v1/O/O-OZPY/product-pricing/rate-tables`,
        rateTablePayload,
      );

      setSubmitResult(res.data);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create rate table';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (submitted && submitResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <CheckCircle2 className="mx-auto text-green-500" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rate Table Created Successfully
        </h2>
        <p className="text-gray-500">
          Hash ID: <span className="font-mono font-bold text-blue-600">{submitResult.hashId || submitResult._id}</span>
        </p>
        <p className="text-gray-500">
          Status: <span className="font-semibold text-yellow-600">draft</span> -- activate it from the Rate Tables page.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/product-pricing/rate-tables')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            View Rate Tables
          </button>
          <button
            onClick={() => { setSubmitted(false); setFormData({}); setCurrentStep(0); }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Import Another
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="mx-auto text-yellow-500" size={48} />
        <p className="text-gray-500">{error || 'Rate card import form not found.'}</p>
        <button
          onClick={() => navigate('/product-pricing')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Back to Product Pricing
        </button>
      </div>
    );
  }

  const currentPanel = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/product-pricing')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} className="text-gray-500" />
        </button>
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Import Rate Card
          </h1>
          <p className="text-sm text-gray-500">
            {form.description}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <button
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                idx === currentStep
                  ? 'bg-blue-600 text-white'
                  : idx < currentStep
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border border-current">
                {idx < currentStep ? '\u2713' : idx + 1}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {idx < steps.length - 1 && (
              <div className={`h-px w-8 ${idx < currentStep ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current step content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calculator className="text-blue-500" size={20} />
          Step {currentStep + 1}: {currentPanel?.title}
        </h2>

        {currentPanel?.components?.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={handleFieldChange}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Review summary on last step */}
      {isLastStep && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Import Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Insurer</span>
              <span className="font-medium">{(formData.insurerName as string) || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Product</span>
              <span className="font-medium">{(formData.productName as string) || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Region</span>
              <span className="font-medium">{(formData.region as string) || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Currency</span>
              <span className="font-medium">{(formData.currency as string) || 'AED'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Age Bands</span>
              <span className="font-medium">{((formData.ageBands as any[]) || []).length}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Networks</span>
              <span className="font-medium">{((formData.networks as any[]) || []).length}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Copay Options</span>
              <span className="font-medium">{((formData.copayOptions as any[]) || []).length}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Rate Entries</span>
              <span className="font-bold text-blue-600">{((formData.rates as any[]) || []).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
            currentStep === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.confirmImport}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              submitting || !formData.confirmImport
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
            {submitting ? 'Creating Rate Table...' : 'Create Rate Table'}
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default RateCardImportPage;

import React, { useState, useEffect, useCallback } from 'react';
import type { StepProps, InsurerDetails } from '../../../types/pcg4';

const EMPTY: InsurerDetails = {
  name: '',
  description: '',
  internal_code: '',
  regulator_assigned_code: '',
};

const Step1_InsurerDetails: React.FC<StepProps> = ({
  configuration,
  onNext,
  onSave,
  saving,
}) => {
  const [form, setForm] = useState<InsurerDetails>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (configuration?.insurer) {
      setForm(configuration.insurer);
    }
  }, [configuration]);

  const validate = useCallback((data: InsurerDetails) => {
    const e: Record<string, string> = {};
    if (!data.name?.trim()) e.name = 'Insurer name is required';
    if (!data.internal_code?.trim()) e.internal_code = 'Internal code is required';
    if (!data.regulator_assigned_code?.trim())
      e.regulator_assigned_code = 'Regulator assigned code is required';
    return e;
  }, []);

  useEffect(() => {
    setErrors(validate(form));
  }, [form, validate]);

  const isValid = Object.keys(errors).length === 0;
  const showError = (field: string) => (touched[field] || submitted) && errors[field];

  const handleChange = (field: keyof InsurerDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNext = async () => {
    setSubmitted(true);
    if (!isValid) return;
    await onNext({ insurer: form });
  };

  const handleSave = async () => {
    await onSave({ insurer: form });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Insurer Details
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Configure the insurance company information and regulatory details.
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Insurer Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Healthy Life Insurance Co."
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
              showError('name') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {showError('name') && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Internal Code *
          </label>
          <input
            type="text"
            placeholder="e.g., HLI001"
            value={form.internal_code}
            onChange={(e) => handleChange('internal_code', e.target.value)}
            onBlur={() => handleBlur('internal_code')}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
              showError('internal_code') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {showError('internal_code') && (
            <p className="text-xs text-red-500">{errors.internal_code}</p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Regulator Assigned Code *
          </label>
          <input
            type="text"
            placeholder="e.g., REG-HLI-2024-001"
            value={form.regulator_assigned_code}
            onChange={(e) => handleChange('regulator_assigned_code', e.target.value)}
            onBlur={() => handleBlur('regulator_assigned_code')}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
              showError('regulator_assigned_code')
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {showError('regulator_assigned_code') && (
            <p className="text-xs text-red-500">{errors.regulator_assigned_code}</p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            placeholder="Provide a detailed description of the insurance company..."
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isValid || saving}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next: Product Details
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1_InsurerDetails;

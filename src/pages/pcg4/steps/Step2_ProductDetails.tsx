import React, { useState, useEffect, useCallback } from 'react';
import type { StepProps, ProductDetails } from '../../../types/pcg4';
import { getTemplates } from '../../../api/pcg4Api';

const EMPTY: ProductDetails = {
  name: '',
  description: '',
  internal_code: '',
  regulator_assigned_code: '',
};

const Step2_ProductDetails: React.FC<StepProps> = ({
  configuration,
  onNext,
  onPrevious,
  onSave,
  saving,
}) => {
  const [form, setForm] = useState<ProductDetails>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showInheritance, setShowInheritance] = useState(true);
  const [templates, setTemplates] = useState<Array<{ id: string; hashId: string; insurerName: string; productName: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (configuration?.product) {
      setForm(configuration.product);
      setShowInheritance(false);
    }
  }, [configuration]);

  // Fetch templates for inheritance
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) return;
    setLoadingTemplates(true);
    getTemplates(orgId)
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const validate = useCallback((data: ProductDetails) => {
    const e: Record<string, string> = {};
    if (!data.name?.trim()) e.name = 'Product name is required';
    if (!data.internal_code?.trim()) e.internal_code = 'Internal product code is required';
    if (!data.regulator_assigned_code?.trim())
      e.regulator_assigned_code = 'Regulator assigned product code is required';
    return e;
  }, []);

  useEffect(() => {
    setErrors(validate(form));
  }, [form, validate]);

  const isValid = Object.keys(errors).length === 0;
  const showError = (field: string) => (touched[field] || submitted) && errors[field];

  const handleChange = (field: keyof ProductDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNext = async () => {
    setSubmitted(true);
    if (!isValid) return;
    await onNext({ product: form });
  };

  const handleSave = async () => {
    await onSave({ product: form });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Product Details
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Define the insurance product specifications, codes, and regulatory information.
        </p>
      </div>

      {/* Inheritance Selector */}
      {showInheritance && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Inherit from Existing Configuration?
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
            Start from a published template to save time.
          </p>
          {loadingTemplates ? (
            <p className="text-xs text-gray-500">Loading templates...</p>
          ) : templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    // Inheritance is a UX hint; the actual clone happens at the API level
                    setShowInheritance(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  <span className="font-medium">{t.productName}</span>
                  <span className="text-xs text-gray-500 ml-2">({t.insurerName})</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No templates available.</p>
          )}
          <button
            type="button"
            onClick={() => setShowInheritance(false)}
            className="mt-3 text-xs text-blue-600 hover:underline"
          >
            Skip — start from scratch
          </button>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Comprehensive Health Plus"
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
            Internal Product Code *
          </label>
          <input
            type="text"
            placeholder="e.g., CHP-2024-V1"
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
            Regulator Assigned Product Code *
          </label>
          <input
            type="text"
            placeholder="e.g., REG-PROD-CHP-2024-001"
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
            Product Description
          </label>
          <textarea
            placeholder="Describe the insurance product, its coverage scope, target market, key features..."
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Preview */}
      {configuration?.insurer && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Configuration Preview
          </h3>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Insurer:</span> {configuration.insurer.name}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Product:</span> {form.name || 'Not set'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onPrevious}
          className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
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
            Next: Create Plans
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

function getOrgId(): string {
  try {
    const user = localStorage.getItem('zorbit_user');
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.organizationHashId || parsed.orgId || 'O-DEFAULT';
    }
  } catch {
    // ignore
  }
  return 'O-DEFAULT';
}

export default Step2_ProductDetails;

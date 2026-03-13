import React, { useState, useEffect } from 'react';
import type { StepProps, ValidationError, PublishSettings } from '../../../types/pcg4';

const Step8_ReviewPublish: React.FC<StepProps> = ({
  configuration,
  onPrevious,
  onSave,
  saving,
}) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    target_environment: 'staging',
    scheduled_date: '',
    notes: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'encounters' | 'publish'>(
    'overview',
  );

  useEffect(() => {
    validateConfiguration();
  }, [configuration]);

  const validateConfiguration = () => {
    const errs: ValidationError[] = [];

    if (!configuration?.insurer?.name) {
      errs.push({ type: 'error', message: 'Insurer name is required' });
    }
    if (!configuration?.product?.name) {
      errs.push({ type: 'error', message: 'Product name is required' });
    }
    if (!configuration?.plans || configuration.plans.length === 0) {
      errs.push({ type: 'error', message: 'At least one plan is required' });
    }

    configuration?.plans?.forEach((plan, i) => {
      if (!plan.plan_name) errs.push({ type: 'error', message: `Plan ${i + 1}: Name is required` });
      if (!plan.plan_tier) errs.push({ type: 'error', message: `Plan ${i + 1}: Tier is required` });
      if (!plan.regions || plan.regions.length === 0)
        errs.push({ type: 'warning', message: `Plan ${i + 1}: No coverage regions specified` });

      const covered = plan.benefits?.encounter_specific?.filter((e) => e.coverage) || [];
      if (covered.length === 0)
        errs.push({ type: 'warning', message: `Plan ${i + 1}: No encounters have coverage enabled` });
    });

    setValidationErrors(errs);
  };

  const errorCount = validationErrors.filter((e) => e.type === 'error').length;
  const warningCount = validationErrors.filter((e) => e.type === 'warning').length;
  const canPublish = errorCount === 0;

  const handlePublish = async () => {
    if (!canPublish) return;
    await onSave({
      status: 'published',
      environments_live_in: [
        {
          env_type: publishSettings.target_environment,
          env_name: `${publishSettings.target_environment} Environment`,
          env_url: `https://${publishSettings.target_environment}.example.com`,
          made_live_on: new Date().toISOString(),
          made_live_by: 'current_user',
          status: 'active',
        },
      ],
    });
  };

  const handleSaveDraft = async () => {
    await onSave({ status: 'draft' });
  };

  const handleSubmitReview = async () => {
    if (!canPublish) return;
    await onSave({ status: 'in_review' });
  };

  const planStats = (plan: (typeof configuration.plans)[number]) => {
    const encounters = plan.benefits?.encounter_specific || [];
    const covered = encounters.filter((e) => e.coverage).length;
    return {
      annualLimit: plan.benefits?.general_rules?.annual_limit || 0,
      covered,
      total: encounters.length,
      pct: encounters.length > 0 ? Math.round((covered / encounters.length) * 100) : 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Review & Publish
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Review your complete configuration and publish to target environments.
        </p>
      </div>

      {/* Validation Status */}
      <div
        className={`border-l-4 rounded-lg p-4 ${
          canPublish
            ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
            : 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Validation Status
          </h3>
          <div className="flex gap-2">
            {errorCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {errorCount} Error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                {warningCount} Warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {canPublish && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Ready to Publish
              </span>
            )}
          </div>
        </div>
        {validationErrors.length > 0 && (
          <div className="space-y-1.5 mt-3">
            {validationErrors.map((err, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-1.5 rounded ${
                  err.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {err.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Tabs */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'plans', 'encounters', 'publish'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition capitalize ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'publish' ? 'Publish Settings' : tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Insurer */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Insurer Information
                  </h4>
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <p><span className="font-medium">Name:</span> {configuration?.insurer?.name || 'Not set'}</p>
                    <p><span className="font-medium">Internal Code:</span> {configuration?.insurer?.internal_code || 'Not set'}</p>
                    <p><span className="font-medium">Regulator Code:</span> {configuration?.insurer?.regulator_assigned_code || 'Not set'}</p>
                  </div>
                </div>
                {/* Product */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Product Information
                  </h4>
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <p><span className="font-medium">Name:</span> {configuration?.product?.name || 'Not set'}</p>
                    <p><span className="font-medium">Internal Code:</span> {configuration?.product?.internal_code || 'Not set'}</p>
                    <p><span className="font-medium">Regulator Code:</span> {configuration?.product?.regulator_assigned_code || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Plans summary cards */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Plans Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configuration?.plans?.map((plan, i) => {
                    const stats = planStats(plan);
                    return (
                      <div
                        key={i}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {plan.plan_name}
                          </h5>
                          <span className="px-2 py-0.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-full text-gray-500">
                            {plan.plan_tier}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <p>Annual Limit: ${stats.annualLimit?.toLocaleString() || 'Unlimited'}</p>
                          <p>
                            Coverage: {stats.covered}/{stats.total} encounters ({stats.pct}%)
                          </p>
                          <p>
                            Regions: {plan.regions?.length || 0} region
                            {plan.regions?.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Plans Detail */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              {configuration?.plans?.map((plan, i) => (
                <div
                  key={i}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {plan.plan_name}
                    </h4>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 text-xs border border-gray-200 dark:border-gray-600 rounded-full text-gray-500">
                        {plan.plan_tier}
                      </span>
                      <span className="px-2 py-0.5 text-xs border border-gray-200 dark:border-gray-600 rounded-full text-gray-500">
                        {plan.currency}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Annual Limit</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        ${plan.benefits?.general_rules?.annual_limit?.toLocaleString() || 'Unlimited'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Deductible</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        ${plan.benefits?.general_rules?.deductible?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">OOP Max</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        ${plan.benefits?.general_rules?.out_of_pocket_max?.toLocaleString() || 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Network</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {plan.benefits?.general_rules?.network_restrictions || 'Both'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Coverage Regions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.regions?.length ? (
                        plan.regions.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 text-xs border border-gray-200 dark:border-gray-600 rounded-full text-gray-500"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No regions specified</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Encounters */}
          {activeTab === 'encounters' && (
            <div className="space-y-4">
              {configuration?.plans?.map((plan, planIdx) => {
                const encounters = plan.benefits?.encounter_specific || [];
                const covered = encounters.filter((e) => e.coverage).length;
                const authReq = encounters.filter((e) => e.authorization?.required).length;
                return (
                  <div key={planIdx}>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {plan.plan_name}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{encounters.length}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{covered}</p>
                        <p className="text-xs text-gray-500">Covered</p>
                      </div>
                      <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{authReq}</p>
                        <p className="text-xs text-gray-500">Auth Required</p>
                      </div>
                      <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {encounters.length > 0
                            ? Math.round((covered / encounters.length) * 100)
                            : 0}
                          %
                        </p>
                        <p className="text-xs text-gray-500">Coverage Rate</p>
                      </div>
                    </div>
                    {planIdx < (configuration?.plans?.length || 0) - 1 && (
                      <hr className="border-gray-200 dark:border-gray-700 my-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Publish Settings */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target Environment
                  </label>
                  <select
                    value={publishSettings.target_environment}
                    onChange={(e) =>
                      setPublishSettings((prev) => ({
                        ...prev,
                        target_environment: e.target.value as PublishSettings['target_environment'],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="staging">Staging Environment</option>
                    <option value="production">Production Environment</option>
                    <option value="testing">Testing Environment</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Scheduled Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={publishSettings.scheduled_date}
                    onChange={(e) =>
                      setPublishSettings((prev) => ({ ...prev, scheduled_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Publication Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter notes about this publication..."
                  value={publishSettings.notes}
                  onChange={(e) =>
                    setPublishSettings((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          )}
        </div>
      </div>

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
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={!canPublish || saving}
            className="px-4 py-2 text-sm font-medium border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit for Review
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish || saving}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              'Publishing...'
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full transition-all duration-300 w-full" />
      </div>
    </div>
  );
};

export default Step8_ReviewPublish;

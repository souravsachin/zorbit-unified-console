import React, { useState, useEffect, useCallback } from 'react';
import type { StepProps, GeneralRules, NetworkRestriction } from '../../../types/pcg4';

const DEFAULT_RULES: GeneralRules = {
  annual_limit: 0,
  deductible: 0,
  out_of_pocket_max: 0,
  network_restrictions: 'Both',
  waiting_period_days: 0,
};

const Step4_BasePlanConfig: React.FC<StepProps> = ({
  configuration,
  onNext,
  onPrevious,
  onSave,
  saving,
}) => {
  const [rules, setRules] = useState<GeneralRules>(DEFAULT_RULES);
  const [activePlanTab, setActivePlanTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (configuration?.plans && configuration.plans.length > 0) {
      const first = configuration.plans[0];
      if (first.benefits?.general_rules) {
        setRules(first.benefits.general_rules);
      }
    }
  }, [configuration]);

  const validate = useCallback((r: GeneralRules) => {
    const e: Record<string, string> = {};
    if (r.annual_limit < 0) e.annual_limit = 'Cannot be negative';
    if (r.deductible < 0) e.deductible = 'Cannot be negative';
    if (r.out_of_pocket_max < 0) e.out_of_pocket_max = 'Cannot be negative';
    if (r.waiting_period_days < 0) e.waiting_period_days = 'Cannot be negative';
    if (
      r.out_of_pocket_max > 0 &&
      r.annual_limit > 0 &&
      r.out_of_pocket_max > r.annual_limit
    ) {
      e.out_of_pocket_max = 'Cannot exceed annual limit';
    }
    return e;
  }, []);

  useEffect(() => {
    setErrors(validate(rules));
  }, [rules, validate]);

  const isValid = Object.keys(errors).length === 0;

  const handleNumericChange = (field: keyof GeneralRules, raw: string) => {
    const val = field === 'network_restrictions' ? raw : parseFloat(raw) || 0;
    setRules((prev) => ({ ...prev, [field]: val }));
  };

  const buildUpdatedPlans = () =>
    (configuration?.plans || []).map((plan) => ({
      ...plan,
      benefits: { ...plan.benefits, general_rules: rules },
    }));

  const handleNext = async () => {
    if (!isValid) return;
    await onNext({ plans: buildUpdatedPlans() });
  };

  const handleSave = async () => {
    await onSave({ plans: buildUpdatedPlans() });
  };

  const plans = configuration?.plans || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Base Plan Configuration
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Configure general rules and limits that apply across all plans as defaults.
        </p>
      </div>

      {/* Plan tabs (if multiple plans, show which one is being configured) */}
      {plans.length > 1 && (
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          {plans.map((plan, i) => (
            <button
              key={plan.plan_id}
              type="button"
              onClick={() => setActivePlanTab(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                activePlanTab === i
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {plan.plan_name || `Plan ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Rules Form */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          General Rules & Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Annual Limit */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Annual Coverage Limit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min={0}
                value={rules.annual_limit}
                onChange={(e) => handleNumericChange('annual_limit', e.target.value)}
                className={`w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
                  errors.annual_limit ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.annual_limit && (
              <p className="text-xs text-red-500">{errors.annual_limit}</p>
            )}
            <p className="text-xs text-gray-400">Set to 0 for unlimited coverage</p>
          </div>

          {/* Deductible */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Annual Deductible
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min={0}
                value={rules.deductible}
                onChange={(e) => handleNumericChange('deductible', e.target.value)}
                className={`w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
                  errors.deductible ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.deductible && (
              <p className="text-xs text-red-500">{errors.deductible}</p>
            )}
          </div>

          {/* OOP Max */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Out-of-Pocket Maximum
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min={0}
                value={rules.out_of_pocket_max}
                onChange={(e) => handleNumericChange('out_of_pocket_max', e.target.value)}
                className={`w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
                  errors.out_of_pocket_max
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.out_of_pocket_max && (
              <p className="text-xs text-red-500">{errors.out_of_pocket_max}</p>
            )}
          </div>

          {/* Waiting Period */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Waiting Period (Days)
            </label>
            <input
              type="number"
              min={0}
              value={rules.waiting_period_days}
              onChange={(e) => handleNumericChange('waiting_period_days', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
                errors.waiting_period_days
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.waiting_period_days && (
              <p className="text-xs text-red-500">{errors.waiting_period_days}</p>
            )}
          </div>

          {/* Network Restrictions */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Network Restrictions
            </label>
            <select
              value={rules.network_restrictions}
              onChange={(e) =>
                setRules((prev) => ({
                  ...prev,
                  network_restrictions: e.target.value as NetworkRestriction,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="In-Network">In-Network Only</option>
              <option value="Out-of-Network">Out-of-Network Only</option>
              <option value="Both">Both In-Network & Out-of-Network</option>
            </select>
          </div>
        </div>
      </div>

      {/* Affected Plans */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Affected Plans
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          These general rules will apply to all {plans.length} plan(s):
        </p>
        <ul className="list-disc list-inside text-sm text-gray-500 space-y-1 pl-2">
          {plans.map((plan) => (
            <li key={plan.plan_id}>
              {plan.plan_name || 'Unnamed'} ({plan.plan_tier || 'No tier'})
            </li>
          ))}
        </ul>
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
            Next: Encounter Config
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4_BasePlanConfig;

import React, { useState, useEffect, useCallback } from 'react';
import type { StepProps, Plan, PlanTier, CurrencyCode } from '../../../types/pcg4';

const PLAN_TIERS: PlanTier[] = [
  'Bronze', 'Silver', 'Gold', 'Platinum', 'Basic', 'Premium', 'Comprehensive',
];

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const REGIONS = [
  'North America', 'South America', 'Europe', 'Asia Pacific', 'Africa', 'Middle East',
];

function createNewPlan(): Plan {
  return {
    plan_id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    plan_name: '',
    plan_tier: '',
    regions: [],
    currency: 'USD',
    benefits: {
      general_rules: {
        annual_limit: 0,
        deductible: 0,
        out_of_pocket_max: 0,
        network_restrictions: 'Both',
        waiting_period_days: 0,
      },
      encounter_specific: [],
    },
  };
}

const Step3_CreatePlans: React.FC<StepProps> = ({
  configuration,
  onNext,
  onPrevious,
  onSave,
  saving,
}) => {
  const [plans, setPlans] = useState<Plan[]>([createNewPlan()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (configuration?.plans && configuration.plans.length > 0) {
      setPlans(configuration.plans);
    }
  }, [configuration]);

  const validate = useCallback((data: Plan[]) => {
    const e: Record<string, string> = {};
    data.forEach((plan, i) => {
      if (!plan.plan_name?.trim()) e[`${i}_name`] = 'Plan name is required';
      if (!plan.plan_tier) e[`${i}_tier`] = 'Plan tier is required';
      if (!plan.regions || plan.regions.length === 0)
        e[`${i}_regions`] = 'At least one region is required';
    });
    return e;
  }, []);

  useEffect(() => {
    setErrors(validate(plans));
  }, [plans, validate]);

  const isValid = plans.length > 0 && Object.keys(errors).length === 0;
  const showError = (field: string) => (touched[field] || submitted) && errors[field];

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePlanChange = (index: number, field: keyof Plan, value: unknown) => {
    setPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const toggleRegion = (index: number, region: string) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const regions = p.regions.includes(region)
          ? p.regions.filter((r) => r !== region)
          : [...p.regions, region];
        return { ...p, regions };
      }),
    );
  };

  const addPlan = () => setPlans((prev) => [...prev, createNewPlan()]);

  const removePlan = (index: number) => {
    if (plans.length > 1) {
      setPlans((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    setSubmitted(true);
    if (!isValid) return;
    await onNext({ plans });
  };

  const handleSave = async () => {
    await onSave({ plans });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Create Plans
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Set up the insurance plan structure, tiers, and regional coverage.
        </p>
      </div>

      {/* Plans */}
      <div className="space-y-6">
        {plans.map((plan, index) => (
          <div
            key={plan.plan_id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Plan {index + 1}
              </h3>
              {plans.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlan(index)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plan Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Health Plus Gold"
                    value={plan.plan_name}
                    onChange={(e) => handlePlanChange(index, 'plan_name', e.target.value)}
                    onBlur={() => handleBlur(`${index}_name`)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
                      showError(`${index}_name`)
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {showError(`${index}_name`) && (
                    <p className="text-xs text-red-500">{errors[`${index}_name`]}</p>
                  )}
                </div>

                {/* Plan Tier */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan Tier *
                  </label>
                  <select
                    value={plan.plan_tier}
                    onChange={(e) => handlePlanChange(index, 'plan_tier', e.target.value)}
                    onBlur={() => handleBlur(`${index}_tier`)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100 ${
                      showError(`${index}_tier`)
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select tier</option>
                    {PLAN_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {showError(`${index}_tier`) && (
                    <p className="text-xs text-red-500">{errors[`${index}_tier`]}</p>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Currency
                  </label>
                  <select
                    value={plan.currency}
                    onChange={(e) =>
                      handlePlanChange(index, 'currency', e.target.value as CurrencyCode)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Regions */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Coverage Regions *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {REGIONS.map((region) => (
                    <label
                      key={region}
                      className="flex items-center space-x-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={plan.regions.includes(region)}
                        onChange={() => toggleRegion(index, region)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{region}</span>
                    </label>
                  ))}
                </div>
                {showError(`${index}_regions`) && (
                  <p className="text-xs text-red-500">{errors[`${index}_regions`]}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan */}
      <div className="text-center">
        <button
          type="button"
          onClick={addPlan}
          className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Another Plan
        </button>
      </div>

      {/* Summary */}
      {configuration?.insurer && configuration?.product && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500">
          <p>
            <span className="font-medium">Insurer:</span> {configuration.insurer.name}
          </p>
          <p>
            <span className="font-medium">Product:</span> {configuration.product.name}
          </p>
          <p>
            <span className="font-medium">Plans:</span> {plans.length} plan
            {plans.length !== 1 ? 's' : ''} defined
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
            Next: Base Plan Config
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3_CreatePlans;

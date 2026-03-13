import React, { useState, useEffect, useCallback } from 'react';
import type { StepProps, Plan, EncounterBenefit } from '../../../types/pcg4';

const Step7_PlanOverrides: React.FC<StepProps> = ({
  configuration,
  onNext,
  onPrevious,
  onSave,
  saving,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'general' | 'encounters' | 'regions'>('general');

  useEffect(() => {
    if (configuration?.plans) {
      setPlans(configuration.plans.map((p) => JSON.parse(JSON.stringify(p))));
    }
  }, [configuration]);

  const selectedPlan = plans[selectedPlanIdx];
  const encounters = selectedPlan?.benefits?.encounter_specific || [];

  const updatePlanField = useCallback(
    (planIdx: number, field: string, value: unknown) => {
      setPlans((prev) =>
        prev.map((p, i) => (i === planIdx ? { ...p, [field]: value } : p)),
      );
    },
    [],
  );

  const updateGeneralRule = useCallback(
    (planIdx: number, field: string, value: unknown) => {
      setPlans((prev) =>
        prev.map((p, i) =>
          i === planIdx
            ? {
                ...p,
                benefits: {
                  ...p.benefits,
                  general_rules: { ...p.benefits.general_rules, [field]: value },
                },
              }
            : p,
        ),
      );
    },
    [],
  );

  const updateEncounter = useCallback(
    (
      planIdx: number,
      encIdx: number,
      field: string,
      value: unknown,
      subField?: string,
    ) => {
      setPlans((prev) =>
        prev.map((p, i) => {
          if (i !== planIdx) return p;
          const updated = [...p.benefits.encounter_specific];
          if (subField) {
            updated[encIdx] = {
              ...updated[encIdx],
              [field]: {
                ...(updated[encIdx] as unknown as Record<string, Record<string, unknown>>)[field],
                [subField]: value,
              },
            };
          } else {
            updated[encIdx] = { ...updated[encIdx], [field]: value };
          }
          return {
            ...p,
            benefits: { ...p.benefits, encounter_specific: updated },
          };
        }),
      );
    },
    [],
  );

  const resetToDefaults = (planIdx: number) => {
    if (!configuration?.plans?.[0]) return;
    setPlans((prev) =>
      prev.map((p, i) =>
        i === planIdx
          ? {
              ...p,
              benefits: JSON.parse(JSON.stringify(configuration.plans[0].benefits)),
            }
          : p,
      ),
    );
  };

  const handleNext = async () => {
    await onNext({ plans });
  };

  const handleSave = async () => {
    await onSave({ plans });
  };

  const encounterLabel = (e: EncounterBenefit) =>
    e.description || e.encounter_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  if (plans.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center border-b border-gray-200 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Specific Overrides</h2>
          <p className="text-gray-500">No plans found. Please go back to create plans first.</p>
        </div>
        <button type="button" onClick={onPrevious} className="px-4 py-2 text-sm border rounded-md">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Plan Specific Overrides
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Customize individual plan variations and exceptions to general rules.
        </p>
      </div>

      {/* Plan Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Configure Plan:
          </label>
          <select
            value={selectedPlanIdx}
            onChange={(e) => setSelectedPlanIdx(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100 w-64"
          >
            {plans.map((plan, i) => (
              <option key={i} value={i}>
                {plan.plan_name} ({plan.plan_tier})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => resetToDefaults(selectedPlanIdx)}
          className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Tabs */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['general', 'encounters', 'regions'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition capitalize ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'general'
                ? 'General Rules'
                : tab === 'encounters'
                  ? 'Encounter Overrides'
                  : 'Regional Settings'}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* General Rules Tab */}
          {activeTab === 'general' && selectedPlan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Annual Coverage Limit ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={selectedPlan.benefits?.general_rules?.annual_limit || 0}
                  onChange={(e) =>
                    updateGeneralRule(selectedPlanIdx, 'annual_limit', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Annual Deductible ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={selectedPlan.benefits?.general_rules?.deductible || 0}
                  onChange={(e) =>
                    updateGeneralRule(selectedPlanIdx, 'deductible', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Out-of-Pocket Maximum ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={selectedPlan.benefits?.general_rules?.out_of_pocket_max || 0}
                  onChange={(e) =>
                    updateGeneralRule(
                      selectedPlanIdx,
                      'out_of_pocket_max',
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Waiting Period (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={selectedPlan.benefits?.general_rules?.waiting_period_days || 0}
                  onChange={(e) =>
                    updateGeneralRule(
                      selectedPlanIdx,
                      'waiting_period_days',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Network Restrictions
                </label>
                <select
                  value={selectedPlan.benefits?.general_rules?.network_restrictions || 'Both'}
                  onChange={(e) =>
                    updateGeneralRule(selectedPlanIdx, 'network_restrictions', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="In-Network">In-Network Only</option>
                  <option value="Out-of-Network">Out-of-Network Only</option>
                  <option value="Both">Both In-Network & Out-of-Network</option>
                </select>
              </div>
            </div>
          )}

          {/* Encounter Overrides Tab */}
          {activeTab === 'encounters' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Override Encounter Benefits:
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                  {encounters.length} encounters
                </span>
              </div>
              {encounters.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No encounters configured.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {encounters.map((enc, encIdx) => (
                    <EncounterOverrideRow
                      key={encIdx}
                      encounter={enc}
                      onUpdate={(field, value, subField) =>
                        updateEncounter(selectedPlanIdx, encIdx, field, value, subField)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regional Settings Tab */}
          {activeTab === 'regions' && selectedPlan && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Coverage Regions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'North America',
                  'South America',
                  'Europe',
                  'Asia Pacific',
                  'Africa',
                  'Middle East',
                ].map((region) => (
                  <label key={region} className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPlan.regions?.includes(region) || false}
                      onChange={(e) => {
                        const current = selectedPlan.regions || [];
                        const next = e.target.checked
                          ? [...current, region]
                          : current.filter((r) => r !== region);
                        updatePlanField(selectedPlanIdx, 'regions', next);
                      }}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{region}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency
                </label>
                <select
                  value={selectedPlan.currency || 'USD'}
                  onChange={(e) => updatePlanField(selectedPlanIdx, 'currency', e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Comparison Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Plan Comparison Overview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 text-gray-500 font-medium">Plan</th>
                <th className="text-left p-3 text-gray-500 font-medium">Tier</th>
                <th className="text-left p-3 text-gray-500 font-medium">Annual Limit</th>
                <th className="text-left p-3 text-gray-500 font-medium">Deductible</th>
                <th className="text-left p-3 text-gray-500 font-medium">OOP Max</th>
                <th className="text-left p-3 text-gray-500 font-medium">Covered</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, idx) => {
                const covered =
                  plan.benefits?.encounter_specific?.filter((e) => e.coverage).length || 0;
                const total = plan.benefits?.encounter_specific?.length || 0;
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 dark:border-gray-700 ${
                      idx === selectedPlanIdx ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                      {plan.plan_name}
                    </td>
                    <td className="p-3 text-gray-500">{plan.plan_tier}</td>
                    <td className="p-3 text-gray-500">
                      ${plan.benefits?.general_rules?.annual_limit?.toLocaleString() || 'Unlimited'}
                    </td>
                    <td className="p-3 text-gray-500">
                      ${plan.benefits?.general_rules?.deductible?.toLocaleString() || '0'}
                    </td>
                    <td className="p-3 text-gray-500">
                      ${plan.benefits?.general_rules?.out_of_pocket_max?.toLocaleString() || 'None'}
                    </td>
                    <td className="p-3 text-gray-500">
                      {covered}/{total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next: Review & Publish
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Encounter Override Row                                              */
/* ------------------------------------------------------------------ */
interface EncounterOverrideRowProps {
  encounter: EncounterBenefit;
  onUpdate: (field: string, value: unknown, subField?: string) => void;
}

const EncounterOverrideRow: React.FC<EncounterOverrideRowProps> = ({ encounter, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const label =
    encounter.description ||
    encounter.encounter_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-800 dark:text-gray-200">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
              encounter.coverage
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {encounter.coverage ? 'Covered' : 'Not Covered'}
          </span>
          {encounter.authorization?.required && (
            <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
              Auth
            </span>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">Copay ($)</label>
              <input
                type="number"
                min={0}
                value={encounter.cost_share?.copay || 0}
                onChange={(e) =>
                  onUpdate('cost_share', parseFloat(e.target.value) || 0, 'copay')
                }
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">Coinsurance (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={encounter.cost_share?.coinsurance || 0}
                onChange={(e) =>
                  onUpdate('cost_share', parseFloat(e.target.value) || 0, 'coinsurance')
                }
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">Annual Visits</label>
              <input
                type="number"
                min={0}
                value={encounter.visit_limits?.annual_visits || 0}
                onChange={(e) =>
                  onUpdate('visit_limits', parseInt(e.target.value) || 0, 'annual_visits')
                }
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={encounter.coverage}
                onChange={(e) => onUpdate('coverage', e.target.checked)}
                className="rounded border-gray-300 text-green-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Coverage</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={encounter.authorization?.required || false}
                onChange={(e) => onUpdate('authorization', e.target.checked, 'required')}
                className="rounded border-gray-300 text-orange-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Auth Required</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step7_PlanOverrides;

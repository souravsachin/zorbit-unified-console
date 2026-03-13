import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { StepProps, EncounterBenefit } from '../../../types/pcg4';

const Step6_BenefitsSetup: React.FC<StepProps> = ({
  configuration,
  onNext,
  onPrevious,
  onSave,
  saving,
}) => {
  const [encounters, setEncounters] = useState<EncounterBenefit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'cost' | 'limits' | 'auth' | 'exclusions'>('cost');

  useEffect(() => {
    if (configuration?.plans?.[0]?.benefits?.encounter_specific) {
      setEncounters(
        configuration.plans[0].benefits.encounter_specific.map((e) => ({ ...e })),
      );
    }
  }, [configuration]);

  const current = encounters[currentIndex];

  // Group by category for navigation
  const categories = useMemo(() => {
    const map = new Map<string, number[]>();
    encounters.forEach((e, i) => {
      const cat = e.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(i);
    });
    return map;
  }, [encounters]);

  const updateField = useCallback(
    (index: number, field: string, value: unknown, subField?: string) => {
      setEncounters((prev) =>
        prev.map((enc, i) => {
          if (i !== index) return enc;
          if (subField) {
            return {
              ...enc,
              [field]: {
                ...(enc as unknown as Record<string, Record<string, unknown>>)[field],
                [subField]: value,
              },
            };
          }
          return { ...enc, [field]: value };
        }),
      );
    },
    [],
  );

  const addExclusion = (index: number, text: string) => {
    if (!text.trim()) return;
    setEncounters((prev) =>
      prev.map((enc, i) =>
        i === index ? { ...enc, exclusions: [...enc.exclusions, text.trim()] } : enc,
      ),
    );
  };

  const removeExclusion = (index: number, exIdx: number) => {
    setEncounters((prev) =>
      prev.map((enc, i) =>
        i === index
          ? { ...enc, exclusions: enc.exclusions.filter((_, j) => j !== exIdx) }
          : enc,
      ),
    );
  };

  const buildUpdatedPlans = () =>
    (configuration?.plans || []).map((plan) => ({
      ...plan,
      benefits: { ...plan.benefits, encounter_specific: encounters },
    }));

  const handleNext = async () => {
    await onNext({ plans: buildUpdatedPlans() });
  };

  const handleSave = async () => {
    await onSave({ plans: buildUpdatedPlans() });
  };

  // Stats
  const coveredCount = encounters.filter((e) => e.coverage).length;
  const authCount = encounters.filter((e) => e.authorization?.required).length;

  if (encounters.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Benefits Setup
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            No encounters selected. Go back to Encounter Configuration to select encounter types
            first.
          </p>
        </div>
        <div className="flex justify-start pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>
    );
  }

  const encounterLabel = (e: EncounterBenefit) =>
    e.description || e.encounter_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Benefits Setup
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Configure benefit rules, cost sharing, and coverage details for each encounter type.
        </p>
      </div>

      {/* Encounter Navigation */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar — encounter list grouped by category */}
        <div className="md:w-64 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
            Encounter Types ({encounters.length})
          </div>
          <div className="max-h-96 overflow-y-auto">
            {Array.from(categories.entries()).map(([catName, indices]) => (
              <div key={catName}>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  {catName}
                </div>
                {indices.map((idx) => {
                  const enc = encounters[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`block w-full text-left px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-700 transition ${
                        idx === currentIndex
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="truncate block">{encounterLabel(enc)}</span>
                      <span className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            enc.coverage ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className="text-xs text-gray-400">
                          {enc.coverage ? 'Covered' : 'Not covered'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          {current && (
            <>
              {/* Encounter Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {encounterLabel(current)}
                  </h3>
                  <p className="text-xs text-gray-400">{current.category}</p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Coverage</span>
                  <input
                    type="checkbox"
                    checked={current.coverage}
                    onChange={(e) => updateField(currentIndex, 'coverage', e.target.checked)}
                    className="rounded border-gray-300 text-green-500 focus:ring-green-400 w-5 h-5"
                  />
                </label>
              </div>

              {current.coverage ? (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {(['cost', 'limits', 'auth', 'exclusions'] as const).map((tab) => (
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
                        {tab === 'cost'
                          ? 'Cost Sharing'
                          : tab === 'limits'
                            ? 'Visit Limits'
                            : tab === 'auth'
                              ? 'Authorization'
                              : 'Exclusions'}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Cost Sharing Tab */}
                    {activeTab === 'cost' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Copay ($)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={current.cost_share?.copay || 0}
                            onChange={(e) =>
                              updateField(
                                currentIndex,
                                'cost_share',
                                parseFloat(e.target.value) || 0,
                                'copay',
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Coinsurance (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={current.cost_share?.coinsurance || 0}
                            onChange={(e) =>
                              updateField(
                                currentIndex,
                                'cost_share',
                                parseFloat(e.target.value) || 0,
                                'coinsurance',
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={current.cost_share?.deductible_applies ?? true}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'cost_share',
                                  e.target.checked,
                                  'deductible_applies',
                                )
                              }
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Plan deductible applies to this encounter type
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Visit Limits Tab */}
                    {activeTab === 'limits' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Annual Visit Limit
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder="0 for unlimited"
                              value={current.visit_limits?.annual_visits || 0}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'visit_limits',
                                  parseInt(e.target.value) || 0,
                                  'annual_visits',
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Lifetime Limit
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder="0 for unlimited"
                              value={current.visit_limits?.lifetime_limit || 0}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'visit_limits',
                                  parseInt(e.target.value) || 0,
                                  'lifetime_limit',
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Per Event Cap ($)
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder="0 for no cap"
                              value={current.visit_limits?.per_event_cap || 0}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'visit_limits',
                                  parseFloat(e.target.value) || 0,
                                  'per_event_cap',
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Annual Coverage Limit ($)
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder="0 for unlimited"
                              value={current.annual_limit || 0}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'annual_limit',
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
                              value={current.waiting_period_days || 0}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'waiting_period_days',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Authorization Tab */}
                    {activeTab === 'auth' && (
                      <div className="space-y-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={current.authorization?.required || false}
                            onChange={(e) =>
                              updateField(
                                currentIndex,
                                'authorization',
                                e.target.checked,
                                'required',
                              )
                            }
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Prior authorization required
                          </span>
                        </label>
                        {current.authorization?.required && (
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Authorization Notes
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Enter authorization requirements..."
                              value={current.authorization?.notes || ''}
                              onChange={(e) =>
                                updateField(
                                  currentIndex,
                                  'authorization',
                                  e.target.value,
                                  'notes',
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Exclusions Tab */}
                    {activeTab === 'exclusions' && (
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Coverage Exclusions
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(current.exclusions || []).map((ex, exIdx) => (
                            <span
                              key={exIdx}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                              {ex}
                              <button
                                type="button"
                                onClick={() => removeExclusion(currentIndex, exIdx)}
                                className="ml-1.5 text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add exclusion and press Enter"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addExclusion(currentIndex, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement)
                                .parentElement?.querySelector('input') as HTMLInputElement;
                              if (input) {
                                addExclusion(currentIndex, input.value);
                                input.value = '';
                              }
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">
                          Examples: Experimental treatments, Cosmetic procedures, Pre-existing
                          conditions (first 12 months)
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Coverage is disabled for this encounter type.</p>
                  <p className="text-xs mt-1">Enable coverage above to configure benefits.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{encounters.length}</p>
          <p className="text-xs text-gray-500">Total Encounters</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{coveredCount}</p>
          <p className="text-xs text-gray-500">Covered</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{encounters.length - coveredCount}</p>
          <p className="text-xs text-gray-500">Not Covered</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{authCount}</p>
          <p className="text-xs text-gray-500">Auth Required</p>
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
            Next: Plan Overrides
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6_BenefitsSetup;

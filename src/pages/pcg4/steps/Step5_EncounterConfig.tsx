import React, { useState, useEffect, useMemo } from 'react';
import { ZorbitTreePicker } from '../../../components/ZorbitTreePicker';
import type { TreeNode } from '../../../components/ZorbitTreePicker/types';
import type { StepProps, EncounterBenefit, EncounterCategory } from '../../../types/pcg4';
import ENCOUNTER_TAXONOMY from '../data/encounterTaxonomy';
import { pcg4ConfiguratorApi } from '../../../api/pcg4Api';

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

function taxonomyToTreeNodes(categories: EncounterCategory[]): TreeNode[] {
  return categories.map((cat) => ({
    id: cat.category_id,
    label: cat.category_name,
    description: cat.description,
    children: cat.types.map((t) => ({
      id: t.type_id,
      label: t.label,
      description: t.description,
    })),
  }));
}

function createDefaultEncounterBenefit(
  categoryName: string,
  typeId: string,
  typeLabel: string,
): EncounterBenefit {
  return {
    category: categoryName,
    sub_category: '',
    encounter_type: typeId,
    description: typeLabel,
    coverage: true,
    annual_limit: 0,
    waiting_period_days: 0,
    cost_share: { copay: 0, coinsurance: 0, deductible_applies: true },
    visit_limits: { annual_visits: 0, lifetime_limit: 0, per_event_cap: 0 },
    authorization: { required: false, notes: '' },
    exclusions: [],
  };
}

const Step5_EncounterConfig: React.FC<StepProps> = ({
  configuration,
  onNext,
  onPrevious,
  onSave,
  saving,
}) => {
  const [taxonomy, setTaxonomy] = useState<EncounterCategory[]>(ENCOUNTER_TAXONOMY);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Try fetching from API, fallback to hardcoded
  useEffect(() => {
    const orgId = getOrgId();
    pcg4ConfiguratorApi
      .getTaxonomies(orgId)
      .then((data) => {
        if (data && data.length > 0) {
          setTaxonomy(data);
        }
      })
      .catch(() => {
        // Use fallback — already set
      })
      .finally(() => setLoading(false));
  }, []);

  // Restore previously-selected encounter types from configuration
  useEffect(() => {
    if (configuration?.plans && configuration.plans.length > 0) {
      const firstPlan = configuration.plans[0];
      const existing = firstPlan.benefits?.encounter_specific || [];
      if (existing.length > 0) {
        setSelectedIds(new Set(existing.map((e) => e.encounter_type)));
      }
    }
  }, [configuration]);

  const treeNodes = useMemo(() => taxonomyToTreeNodes(taxonomy), [taxonomy]);

  // Count stats
  const totalTypes = useMemo(
    () => taxonomy.reduce((sum, cat) => sum + cat.types.length, 0),
    [taxonomy],
  );

  const handleSelectionChange = (ids: Set<string>) => {
    setSelectedIds(ids);
  };

  const buildUpdatedPlans = () => {
    // Build encounter_specific array from selected IDs
    const encounterBenefits: EncounterBenefit[] = [];

    // Preserve existing benefits for already-selected encounters
    const existingMap = new Map<string, EncounterBenefit>();
    if (configuration?.plans?.[0]?.benefits?.encounter_specific) {
      for (const eb of configuration.plans[0].benefits.encounter_specific) {
        existingMap.set(eb.encounter_type, eb);
      }
    }

    for (const cat of taxonomy) {
      for (const t of cat.types) {
        if (selectedIds.has(t.type_id)) {
          const existing = existingMap.get(t.type_id);
          encounterBenefits.push(
            existing || createDefaultEncounterBenefit(cat.category_name, t.type_id, t.label),
          );
        }
      }
    }

    return (configuration?.plans || []).map((plan) => ({
      ...plan,
      benefits: {
        ...plan.benefits,
        encounter_specific: encounterBenefits,
      },
    }));
  };

  const handleNext = async () => {
    await onNext({ plans: buildUpdatedPlans() });
  };

  const handleSave = async () => {
    await onSave({ plans: buildUpdatedPlans() });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading encounter taxonomy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Encounter Configuration
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Select the encounter types that will be covered by your insurance plans.
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
        <div className="text-sm">
          <span className="font-semibold text-orange-600">{selectedIds.size}</span>
          <span className="text-gray-500"> of {totalTypes} encounter types selected</span>
        </div>
        <div className="text-sm text-gray-500">
          {taxonomy.length} categories
        </div>
      </div>

      {/* Tree Picker */}
      <ZorbitTreePicker
        nodes={treeNodes}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        mode="multi"
        searchable
        searchPlaceholder="Search encounter types..."
        expandAll={false}
        showSelectAll
        showCount
        maxHeight="450px"
        className="dark:bg-gray-800 dark:border-gray-700"
      />

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
            Next: Benefits Setup
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step5_EncounterConfig;

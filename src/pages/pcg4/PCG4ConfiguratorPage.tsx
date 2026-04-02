import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZorbitStepper } from '../../components/ZorbitStepper';
import { useWizard } from '../../components/ZorbitStepper/useWizard';
import type { StepConfig } from '../../components/ZorbitStepper/types';
import type { PCG4Configuration, ConfigurationStage } from '../../types/pcg4';
import { pcg4ConfiguratorApi } from '../../api/pcg4Api';
import { useAuth } from '../../hooks/useAuth';

import Step1_InsurerDetails from './steps/Step1_InsurerDetails';
import Step2_ProductDetails from './steps/Step2_ProductDetails';
import Step3_CreatePlans from './steps/Step3_CreatePlans';
import Step4_BasePlanConfig from './steps/Step4_BasePlanConfig';
import Step5_EncounterConfig from './steps/Step5_EncounterConfig';
import Step6_BenefitsSetup from './steps/Step6_BenefitsSetup';
import Step7_PlanOverrides from './steps/Step7_PlanOverrides';
import Step8_ReviewPublish from './steps/Step8_ReviewPublish';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STAGE_ORDER: ConfigurationStage[] = [
  'insurer_details',
  'product_details',
  'create_plans',
  'base_plan_configuration',
  'encounter_configuration',
  'benefits_setup',
  'plan_specific_overrides',
  'review_publish',
];

const STEPS: StepConfig[] = [
  { id: 'insurer_details', title: 'Insurer Details', description: 'Insurance company information' },
  { id: 'product_details', title: 'Product Details', description: 'Product specifications and codes' },
  { id: 'create_plans', title: 'Create Plans', description: 'Plan structure and tiers' },
  { id: 'base_plan_configuration', title: 'Base Config', description: 'General rules and limits' },
  { id: 'encounter_configuration', title: 'Encounters', description: 'Coverage encounter types' },
  { id: 'benefits_setup', title: 'Benefits', description: 'Cost sharing and coverage details' },
  { id: 'plan_specific_overrides', title: 'Overrides', description: 'Per-plan customizations' },
  { id: 'review_publish', title: 'Review & Publish', description: 'Final review and publish' },
];

const DEFAULT_CONFIG: PCG4Configuration = {
  insurer: null,
  product: null,
  plans: [],
  current_stage: 'insurer_details',
  status: 'draft',
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const PCG4ConfiguratorPage: React.FC = () => {
  const { configId: rawConfigId } = useParams<{ configId?: string }>();
  const configId = rawConfigId === 'new' ? undefined : rawConfigId;
  const navigate = useNavigate();
  const { orgId } = useAuth();

  const [configuration, setConfiguration] = useState<PCG4Configuration>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(!!configId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wizard = useWizard({
    steps: STEPS,
    initialStep: 0,
    onComplete: () => {
      // Reached the end
    },
  });

  /* ---- Load existing configuration ---- */
  useEffect(() => {
    if (!configId) {
      setLoading(false);
      return;
    }

    pcg4ConfiguratorApi
      .getConfig(orgId, configId)
      .then((data) => {
        setConfiguration(data);
        const stageIdx = STAGE_ORDER.indexOf(data.current_stage);
        if (stageIdx > 0) {
          wizard.goTo(stageIdx);
          // Mark all previous steps completed
          for (let i = 0; i < stageIdx; i++) {
            wizard.markCompleted(i);
          }
          // If config already exists (loaded from API), make all steps navigable for review
          for (let i = 0; i < STEPS.length; i++) {
            wizard.markCompleted(i);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load configuration:', err);
        setError('Failed to load configuration');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId]);

  /* ---- Save handler (draft, no step change) ---- */
  const handleSave = useCallback(
    async (stepData: Partial<PCG4Configuration>): Promise<{ success: boolean; error?: string }> => {
      setSaving(true);
      try {
        const updated = { ...configuration, ...stepData };
        setConfiguration(updated);

        if (configId) {
          await pcg4ConfiguratorApi.updateStage(
            orgId,
            configId,
            STAGE_ORDER[wizard.currentStep],
            stepData as Record<string, unknown>,
          );
        } else {
          const result = await pcg4ConfiguratorApi.createConfig(orgId, updated);
          if (result?.id) {
            navigate(`/O/${orgId}/app/pcg4/configurations/${result.id}`, { replace: true });
          }
          setConfiguration({ ...updated, id: result?.id });
        }

        return { success: true };
      } catch (err) {
        console.error('Save failed:', err);
        return { success: false, error: 'Save failed' };
      } finally {
        setSaving(false);
      }
    },
    [configuration, configId, orgId, wizard.currentStep, navigate],
  );

  /* ---- Next handler (save + advance step) ---- */
  const handleNext = useCallback(
    async (stepData: Partial<PCG4Configuration>): Promise<boolean> => {
      const result = await handleSave(stepData);
      if (result.success) {
        wizard.markCompleted(wizard.currentStep);
        if (wizard.currentStep < STEPS.length - 1) {
          wizard.goTo(wizard.currentStep + 1);
        }
        return true;
      }
      return false;
    },
    [handleSave, wizard],
  );

  /* ---- Previous handler ---- */
  const handlePrevious = useCallback(() => {
    wizard.goPrev();
  }, [wizard]);

  /* ---- Step click handler ---- */
  const handleStepClick = useCallback(
    (stepIdx: number) => {
      wizard.goTo(stepIdx);
    },
    [wizard],
  );

  /* ---- Render current step ---- */
  const renderStep = () => {
    const stepProps = {
      configuration,
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSave: handleSave,
      saving,
      isFirstStep: wizard.isFirst,
      isLastStep: wizard.isLast,
    };

    switch (STAGE_ORDER[wizard.currentStep]) {
      case 'insurer_details':
        return <Step1_InsurerDetails {...stepProps} />;
      case 'product_details':
        return <Step2_ProductDetails {...stepProps} />;
      case 'create_plans':
        return <Step3_CreatePlans {...stepProps} />;
      case 'base_plan_configuration':
        return <Step4_BasePlanConfig {...stepProps} />;
      case 'encounter_configuration':
        return <Step5_EncounterConfig {...stepProps} />;
      case 'benefits_setup':
        return <Step6_BenefitsSetup {...stepProps} />;
      case 'plan_specific_overrides':
        return <Step7_PlanOverrides {...stepProps} />;
      case 'review_publish':
        return <Step8_ReviewPublish {...stepProps} />;
      default:
        return <div>Step not found</div>;
    }
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading configurator...</p>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/O/${orgId}/app/pcg4/configurations`)}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Product Configurator
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {configuration?.product?.name || 'New Configuration'}
            {configuration?.id && (
              <span className="ml-2 text-xs text-gray-400">({configuration.id})</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/O/${orgId}/app/pcg4/configurations`)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Stepper */}
      <ZorbitStepper
        steps={STEPS}
        currentStep={wizard.currentStep}
        onStepChange={handleStepClick}
        completedSteps={wizard.completedSteps}
        orientation="horizontal"
        variant="compact"
        allowJumpToCompleted
        allowJumpToAny
        showStepNumbers
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
      />

      {/* Progress bar */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((wizard.currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        {renderStep()}
      </div>
    </div>
  );
};

export default PCG4ConfiguratorPage;

import { useState, useCallback, useMemo } from 'react';
import { UseWizardOptions, UseWizardReturn } from './types';

export function useWizard(options: UseWizardOptions): UseWizardReturn {
  const { steps, initialStep = 0, onComplete, onStepChange } = options;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const progress = useMemo(() => {
    if (steps.length <= 1) return completedSteps.has(0) ? 100 : 0;
    return Math.round((completedSteps.size / steps.length) * 100);
  }, [completedSteps, steps.length]);

  const canGoPrev = !isFirst;
  const canGoNext = !isLast;

  const markCompleted = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  const goNext = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep];
    if (step?.validate) {
      const valid = await step.validate();
      if (!valid) return false;
    }

    markCompleted(currentStep);

    if (isLast) {
      onComplete?.();
      return true;
    }

    const nextStep = currentStep + 1;
    onStepChange?.(currentStep, nextStep);
    setCurrentStep(nextStep);
    return true;
  }, [currentStep, steps, isLast, markCompleted, onComplete, onStepChange]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    const prevStep = currentStep - 1;
    onStepChange?.(currentStep, prevStep);
    setCurrentStep(prevStep);
  }, [currentStep, isFirst, onStepChange]);

  const goTo = useCallback(
    (step: number) => {
      if (step < 0 || step >= steps.length) return;
      onStepChange?.(currentStep, step);
      setCurrentStep(step);
    },
    [currentStep, steps.length, onStepChange],
  );

  return {
    currentStep,
    completedSteps,
    goNext,
    goPrev,
    goTo,
    markCompleted,
    isFirst,
    isLast,
    progress,
    canGoNext,
    canGoPrev,
  };
}

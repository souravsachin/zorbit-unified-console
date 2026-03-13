import { ReactNode } from 'react';

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

export interface ZorbitStepperProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  completedSteps?: Set<number>;
  orientation?: 'horizontal' | 'vertical';
  allowJumpToCompleted?: boolean;
  allowJumpToAny?: boolean;
  showStepNumbers?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export interface UseWizardOptions {
  steps: StepConfig[];
  initialStep?: number;
  onComplete?: () => void;
  onStepChange?: (from: number, to: number) => void;
}

export interface UseWizardReturn {
  currentStep: number;
  completedSteps: Set<number>;
  goNext: () => Promise<boolean>;
  goPrev: () => void;
  goTo: (step: number) => void;
  markCompleted: (step: number) => void;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
  canGoNext: boolean;
  canGoPrev: boolean;
}

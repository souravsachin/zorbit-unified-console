import React, { useCallback, useEffect, useRef } from 'react';
import { ZorbitStepperProps } from './types';

/* ------------------------------------------------------------------ */
/*  Checkmark SVG                                                      */
/* ------------------------------------------------------------------ */
const CheckIcon: React.FC = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Helper: step status                                                */
/* ------------------------------------------------------------------ */
type StepStatus = 'completed' | 'current' | 'upcoming';

function getStatus(
  index: number,
  currentStep: number,
  completedSteps?: Set<number>,
): StepStatus {
  if (completedSteps?.has(index)) return 'completed';
  if (index === currentStep) return 'current';
  return 'upcoming';
}

/* ------------------------------------------------------------------ */
/*  Helper: is a step clickable?                                       */
/* ------------------------------------------------------------------ */
function isClickable(
  index: number,
  currentStep: number,
  status: StepStatus,
  allowJumpToCompleted?: boolean,
  allowJumpToAny?: boolean,
): boolean {
  if (index === currentStep) return false;
  if (allowJumpToAny) return true;
  if (allowJumpToCompleted && status === 'completed') return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Circle colors per status                                           */
/* ------------------------------------------------------------------ */
const circleClasses: Record<StepStatus, string> = {
  completed: 'bg-green-500 border-green-500 text-white',
  current: 'bg-orange-500 border-orange-500 text-white',
  upcoming: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400',
};

const labelClasses: Record<StepStatus, string> = {
  completed: 'text-green-600 dark:text-green-400',
  current: 'text-orange-600 dark:text-orange-400',
  upcoming: 'text-gray-400 dark:text-gray-500',
};

const connectorDone = 'bg-green-500';
const connectorPending = 'bg-gray-300 dark:bg-gray-600';

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
const ZorbitStepper: React.FC<ZorbitStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  completedSteps,
  orientation = 'horizontal',
  allowJumpToCompleted = true,
  allowJumpToAny = false,
  showStepNumbers = true,
  variant = 'default',
  className = '',
}) => {
  const listRef = useRef<HTMLOListElement>(null);

  /* ---- keyboard navigation ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isHorizontal = orientation === 'horizontal';
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

      let targetIndex: number | null = null;
      if (e.key === prevKey && currentStep > 0) {
        targetIndex = currentStep - 1;
      } else if (e.key === nextKey && currentStep < steps.length - 1) {
        targetIndex = currentStep + 1;
      }

      if (targetIndex !== null) {
        e.preventDefault();
        const status = getStatus(targetIndex, currentStep, completedSteps);
        if (isClickable(targetIndex, currentStep, status, allowJumpToCompleted, allowJumpToAny)) {
          onStepChange(targetIndex);
        }
        // Move focus to the target button regardless
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-step-btn]');
        buttons?.[targetIndex]?.focus();
      }
    },
    [orientation, currentStep, steps.length, completedSteps, allowJumpToCompleted, allowJumpToAny, onStepChange],
  );

  /* ---- focus current step on mount ---- */
  useEffect(() => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-step-btn]');
    buttons?.[currentStep]?.setAttribute('tabindex', '0');
  }, [currentStep]);

  /* ================================================================ */
  /*  Minimal variant — dots only                                      */
  /* ================================================================ */
  if (variant === 'minimal') {
    return (
      <nav aria-label="Progress" className={className}>
        <ol
          ref={listRef}
          role="list"
          className={`flex items-center gap-3 ${orientation === 'vertical' ? 'flex-col' : 'justify-center'}`}
          onKeyDown={handleKeyDown}
        >
          {steps.map((step, i) => {
            const status = getStatus(i, currentStep, completedSteps);
            const clickable = isClickable(i, currentStep, status, allowJumpToCompleted, allowJumpToAny);
            return (
              <li key={step.id} className="flex items-center gap-3">
                <button
                  data-step-btn
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepChange(i)}
                  aria-label={`Step ${i + 1}: ${step.title}${status === 'completed' ? ' (completed)' : status === 'current' ? ' (current)' : ''}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                  tabIndex={i === currentStep ? 0 : -1}
                  className={`
                    w-3 h-3 rounded-full transition-all duration-200
                    ${status === 'completed' ? 'bg-green-500 scale-100' : ''}
                    ${status === 'current' ? 'bg-orange-500 scale-125 ring-2 ring-orange-200 dark:ring-orange-800' : ''}
                    ${status === 'upcoming' ? 'bg-gray-300 dark:bg-gray-600 scale-100' : ''}
                    ${clickable ? 'cursor-pointer hover:scale-150' : i === currentStep ? 'cursor-default' : 'cursor-not-allowed'}
                  `}
                />
                {/* connector */}
                {i < steps.length - 1 && orientation === 'horizontal' && (
                  <div
                    className={`w-6 h-0.5 transition-colors duration-300 ${
                      completedSteps?.has(i) ? connectorDone : connectorPending
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
        {/* current step label */}
        <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">
          {steps[currentStep]?.title}
        </p>
      </nav>
    );
  }

  /* ================================================================ */
  /*  Compact variant — small circle + title                           */
  /* ================================================================ */
  if (variant === 'compact') {
    return (
      <nav aria-label="Progress" className={className}>
        <ol
          ref={listRef}
          role="list"
          className={`flex ${orientation === 'vertical' ? 'flex-col gap-2' : 'items-center justify-between'}`}
          onKeyDown={handleKeyDown}
        >
          {steps.map((step, i) => {
            const status = getStatus(i, currentStep, completedSteps);
            const clickable = isClickable(i, currentStep, status, allowJumpToCompleted, allowJumpToAny);
            return (
              <li key={step.id} className={`flex items-center ${orientation === 'horizontal' ? 'flex-1' : ''}`}>
                <button
                  data-step-btn
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepChange(i)}
                  aria-label={`Step ${i + 1}: ${step.title}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                  tabIndex={i === currentStep ? 0 : -1}
                  className={`
                    flex items-center gap-2 transition-all duration-200
                    ${clickable ? 'cursor-pointer hover:opacity-80' : i === currentStep ? 'cursor-default' : 'cursor-not-allowed'}
                  `}
                >
                  {/* circle */}
                  <span
                    className={`
                      flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-semibold transition-all duration-200
                      ${circleClasses[status]}
                    `}
                  >
                    {status === 'completed' ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : step.icon ? (
                      step.icon
                    ) : showStepNumbers ? (
                      i + 1
                    ) : null}
                  </span>
                  {/* title */}
                  <span className={`text-xs font-medium whitespace-nowrap ${labelClasses[status]}`}>
                    {step.title}
                  </span>
                </button>
                {/* connector */}
                {i < steps.length - 1 && orientation === 'horizontal' && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-0.5 w-full transition-colors duration-300 ${
                        completedSteps?.has(i) ? connectorDone : connectorPending
                      }`}
                    />
                  </div>
                )}
                {i < steps.length - 1 && orientation === 'vertical' && (
                  <div
                    className={`ml-3.5 w-0.5 h-4 transition-colors duration-300 ${
                      completedSteps?.has(i) ? connectorDone : connectorPending
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  /* ================================================================ */
  /*  Default variant — full layout                                    */
  /* ================================================================ */
  const isVertical = orientation === 'vertical';

  return (
    <nav aria-label="Progress" className={className}>
      <ol
        ref={listRef}
        role="list"
        className={`flex ${isVertical ? 'flex-col gap-0' : 'items-center justify-between'}`}
        onKeyDown={handleKeyDown}
      >
        {steps.map((step, i) => {
          const status = getStatus(i, currentStep, completedSteps);
          const clickable = isClickable(i, currentStep, status, allowJumpToCompleted, allowJumpToAny);

          return (
            <li
              key={step.id}
              className={`flex ${isVertical ? 'flex-row items-start' : 'flex-col items-center flex-1'}`}
            >
              {/* ---- step row (circle + label) ---- */}
              <div className={`flex ${isVertical ? 'flex-row items-start gap-3' : 'flex-col items-center'}`}>
                {/* circle + horizontal connector wrapper */}
                <div className={`flex items-center ${!isVertical ? 'w-full' : ''}`}>
                  {/* left connector (horizontal only) */}
                  {!isVertical && i > 0 && (
                    <div className="flex-1">
                      <div
                        className={`h-0.5 w-full transition-colors duration-300 ${
                          completedSteps?.has(i - 1) ? connectorDone : connectorPending
                        }`}
                      />
                    </div>
                  )}

                  {/* circle button */}
                  <button
                    data-step-btn
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && onStepChange(i)}
                    aria-label={`Step ${i + 1}: ${step.title}${step.optional ? ' (optional)' : ''}`}
                    aria-current={status === 'current' ? 'step' : undefined}
                    tabIndex={i === currentStep ? 0 : -1}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0
                      transition-all duration-200
                      ${circleClasses[status]}
                      ${status === 'current' ? 'ring-4 ring-orange-100 dark:ring-orange-900/30' : ''}
                      ${clickable ? 'cursor-pointer hover:scale-110' : i === currentStep ? 'cursor-default' : 'cursor-not-allowed'}
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckIcon />
                    ) : step.icon ? (
                      step.icon
                    ) : showStepNumbers ? (
                      <span className="text-sm font-semibold">{i + 1}</span>
                    ) : null}
                  </button>

                  {/* right connector (horizontal only) */}
                  {!isVertical && i < steps.length - 1 && (
                    <div className="flex-1">
                      <div
                        className={`h-0.5 w-full transition-colors duration-300 ${
                          completedSteps?.has(i) ? connectorDone : connectorPending
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* label + description */}
                <div className={`${isVertical ? 'pt-1 pb-6' : 'mt-2 text-center'}`}>
                  <p className={`text-sm font-medium ${labelClasses[status]}`}>
                    {showStepNumbers && !isVertical && (
                      <span className="block text-xs mb-0.5">Step {i + 1}</span>
                    )}
                    {step.title}
                    {step.optional && (
                      <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                    )}
                  </p>
                  {step.description && status === 'current' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-[140px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* vertical connector */}
              {isVertical && i < steps.length - 1 && (
                <div className="ml-5 -mt-4 mb-0">
                  <div
                    className={`w-0.5 h-6 transition-colors duration-300 ${
                      completedSteps?.has(i) ? connectorDone : connectorPending
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* current step description (horizontal only, shown below) */}
      {!isVertical && steps[currentStep] && (
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      )}
    </nav>
  );
};

export default ZorbitStepper;

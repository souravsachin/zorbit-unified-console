import React, { useState, useCallback } from 'react';
import { ZorbitStepper, useWizard, StepConfig } from '../../components/ZorbitStepper';

/* ------------------------------------------------------------------ */
/*  Sample step definitions                                            */
/* ------------------------------------------------------------------ */
const DEMO_STEPS: StepConfig[] = [
  {
    id: 'personal',
    title: 'Personal Info',
    description: 'Enter your name and email',
  },
  {
    id: 'address',
    title: 'Address',
    description: 'Where should we send things?',
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
    optional: true,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Double-check everything',
  },
  {
    id: 'confirm',
    title: 'Confirm',
    description: 'All done!',
  },
];

/* ------------------------------------------------------------------ */
/*  Form data type                                                     */
/* ------------------------------------------------------------------ */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  zip: string;
  theme: string;
  notifications: boolean;
  language: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  street: '',
  city: '',
  zip: '',
  theme: 'light',
  notifications: true,
  language: 'en',
};

/* ================================================================== */
/*  Step content panels                                                */
/* ================================================================== */

const StepPersonal: React.FC<{ data: FormData; onChange: (d: Partial<FormData>) => void }> = ({
  data,
  onChange,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        First Name
      </label>
      <input
        className="input-field"
        value={data.firstName}
        onChange={(e) => onChange({ firstName: e.target.value })}
        placeholder="John"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Last Name
      </label>
      <input
        className="input-field"
        value={data.lastName}
        onChange={(e) => onChange({ lastName: e.target.value })}
        placeholder="Doe"
      />
    </div>
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Email
      </label>
      <input
        className="input-field"
        type="email"
        value={data.email}
        onChange={(e) => onChange({ email: e.target.value })}
        placeholder="john@example.com"
      />
    </div>
  </div>
);

const StepAddress: React.FC<{ data: FormData; onChange: (d: Partial<FormData>) => void }> = ({
  data,
  onChange,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Street Address
      </label>
      <input
        className="input-field"
        value={data.street}
        onChange={(e) => onChange({ street: e.target.value })}
        placeholder="123 Main St"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        City
      </label>
      <input
        className="input-field"
        value={data.city}
        onChange={(e) => onChange({ city: e.target.value })}
        placeholder="Springfield"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        ZIP Code
      </label>
      <input
        className="input-field"
        value={data.zip}
        onChange={(e) => onChange({ zip: e.target.value })}
        placeholder="12345"
      />
    </div>
  </div>
);

const StepPreferences: React.FC<{ data: FormData; onChange: (d: Partial<FormData>) => void }> = ({
  data,
  onChange,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Theme
      </label>
      <select
        className="input-field"
        value={data.theme}
        onChange={(e) => onChange({ theme: e.target.value })}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Language
      </label>
      <select
        className="input-field"
        value={data.language}
        onChange={(e) => onChange({ language: e.target.value })}
      >
        <option value="en">English</option>
        <option value="de">German</option>
        <option value="fr">French</option>
      </select>
    </div>
    <div className="flex items-center gap-2">
      <input
        id="notifications"
        type="checkbox"
        checked={data.notifications}
        onChange={(e) => onChange({ notifications: e.target.checked })}
        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
      />
      <label htmlFor="notifications" className="text-sm text-gray-700 dark:text-gray-300">
        Enable email notifications
      </label>
    </div>
  </div>
);

const StepReview: React.FC<{ data: FormData }> = ({ data }) => (
  <div className="space-y-3 text-sm">
    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Personal Information</h4>
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 grid grid-cols-2 gap-2">
      <span className="text-gray-500 dark:text-gray-400">Name</span>
      <span className="text-gray-900 dark:text-gray-100">
        {data.firstName} {data.lastName}
      </span>
      <span className="text-gray-500 dark:text-gray-400">Email</span>
      <span className="text-gray-900 dark:text-gray-100">{data.email || '(not set)'}</span>
    </div>
    <h4 className="font-semibold text-gray-900 dark:text-gray-100 pt-2">Address</h4>
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 grid grid-cols-2 gap-2">
      <span className="text-gray-500 dark:text-gray-400">Street</span>
      <span className="text-gray-900 dark:text-gray-100">{data.street || '(not set)'}</span>
      <span className="text-gray-500 dark:text-gray-400">City / ZIP</span>
      <span className="text-gray-900 dark:text-gray-100">
        {data.city || '(not set)'} {data.zip}
      </span>
    </div>
    <h4 className="font-semibold text-gray-900 dark:text-gray-100 pt-2">Preferences</h4>
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 grid grid-cols-2 gap-2">
      <span className="text-gray-500 dark:text-gray-400">Theme</span>
      <span className="text-gray-900 dark:text-gray-100">{data.theme}</span>
      <span className="text-gray-500 dark:text-gray-400">Language</span>
      <span className="text-gray-900 dark:text-gray-100">{data.language}</span>
      <span className="text-gray-500 dark:text-gray-400">Notifications</span>
      <span className="text-gray-900 dark:text-gray-100">{data.notifications ? 'On' : 'Off'}</span>
    </div>
  </div>
);

const StepConfirm: React.FC<{ completed: boolean }> = ({ completed }) => (
  <div className="text-center py-6">
    {completed ? (
      <>
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Done!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your information has been submitted successfully.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ready to Submit?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Click &quot;Complete&quot; to finish the wizard.
        </p>
      </>
    )}
  </div>
);

/* ================================================================== */
/*  Demo Page                                                          */
/* ================================================================== */
const StepperDemoPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [wizardDone, setWizardDone] = useState(false);

  const updateForm = useCallback((partial: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  const wizard = useWizard({
    steps: DEMO_STEPS,
    onComplete: () => setWizardDone(true),
  });

  /* ---- render step content ---- */
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 0:
        return <StepPersonal data={formData} onChange={updateForm} />;
      case 1:
        return <StepAddress data={formData} onChange={updateForm} />;
      case 2:
        return <StepPreferences data={formData} onChange={updateForm} />;
      case 3:
        return <StepReview data={formData} />;
      case 4:
        return <StepConfirm completed={wizardDone} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          ZorbitStepper Demo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          A reusable multi-step wizard component — shown in three variants below.
        </p>
      </div>

      {/* ============================================================ */}
      {/*  Interactive wizard demo                                      */}
      {/* ============================================================ */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Interactive Wizard (Default Variant)
        </h2>

        {/* stepper */}
        <ZorbitStepper
          steps={DEMO_STEPS}
          currentStep={wizard.currentStep}
          onStepChange={wizard.goTo}
          completedSteps={wizard.completedSteps}
          variant="default"
          allowJumpToCompleted
        />

        {/* progress bar */}
        <div className="mt-6 mb-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{wizard.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${wizard.progress}%` }}
            />
          </div>
        </div>

        {/* step content */}
        <div className="mt-6 min-h-[200px]">{renderStepContent()}</div>

        {/* navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="btn-secondary"
            disabled={wizard.isFirst}
            onClick={wizard.goPrev}
          >
            Back
          </button>
          <button
            className="btn-primary"
            onClick={wizard.goNext}
          >
            {wizard.isLast ? 'Complete' : 'Next'}
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Variant showcase                                             */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* -- compact -- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Compact Variant
          </h3>
          <ZorbitStepper
            steps={DEMO_STEPS}
            currentStep={wizard.currentStep}
            onStepChange={wizard.goTo}
            completedSteps={wizard.completedSteps}
            variant="compact"
            allowJumpToCompleted
          />
        </div>

        {/* -- minimal -- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Minimal Variant
          </h3>
          <ZorbitStepper
            steps={DEMO_STEPS}
            currentStep={wizard.currentStep}
            onStepChange={wizard.goTo}
            completedSteps={wizard.completedSteps}
            variant="minimal"
            allowJumpToCompleted
          />
        </div>

        {/* -- vertical -- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Vertical Orientation
          </h3>
          <ZorbitStepper
            steps={DEMO_STEPS}
            currentStep={wizard.currentStep}
            onStepChange={wizard.goTo}
            completedSteps={wizard.completedSteps}
            variant="default"
            orientation="vertical"
            allowJumpToCompleted
          />
        </div>
      </section>
    </div>
  );
};

export default StepperDemoPage;

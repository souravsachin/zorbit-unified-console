import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  Layers,
  Play,
  ArrowRight,
  CheckCircle2,
  PenLine,
  Eye,
  Rocket,
  Archive,
  FileInput,
  GitBranch,
  ShieldCheck,
  Globe,
  Save,
  History,
} from 'lucide-react';
import { DemoTourPlayer } from '../../components/shared/DemoTourPlayer';
import type { ManifestEntry } from '../../components/shared/DemoTourPlayer';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = 'introduction' | 'presentation' | 'lifecycle';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'introduction', label: 'Introduction', icon: Info },
  { key: 'presentation', label: 'Presentation', icon: Play },
  { key: 'lifecycle', label: 'Lifecycle', icon: Layers },
];

// ---------------------------------------------------------------------------
// Capability cards for Introduction tab
// ---------------------------------------------------------------------------

interface Capability {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: FileInput,
    title: 'Form Types',
    description:
      'Multi-step wizards, single-page forms, and tabbed layouts. Choose the right form type for your use case and customize step-by-step flows.',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  },
  {
    icon: GitBranch,
    title: 'Conditional Logic',
    description:
      'Show or hide fields dynamically based on user input. Build complex branching logic with a visual rule builder — no code required.',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  },
  {
    icon: ShieldCheck,
    title: 'PII Protection',
    description:
      'Sensitive fields are automatically tokenized via the PII Vault before storage. Operational databases never store raw personal data.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  },
  {
    icon: Globe,
    title: 'Multi-Region',
    description:
      'Create region-specific form variants from a single base template. Support different regulatory requirements, languages, and field sets per market.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  },
  {
    icon: Save,
    title: 'Auto-Save',
    description:
      'Form progress is automatically saved as users fill in data. Submissions can be resumed from any device without data loss.',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
  },
  {
    icon: History,
    title: 'Versioning',
    description:
      'Every form schema change is versioned. Compare versions side-by-side, roll back to previous definitions, and maintain a full audit trail.',
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30',
  },
];

// ---------------------------------------------------------------------------
// Lifecycle stages for Lifecycle tab
// ---------------------------------------------------------------------------

interface LifecycleStage {
  status: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    status: 'draft',
    label: 'Draft',
    description: 'Form designer creates or edits the form schema using the visual editor. Fields, steps, and validation rules are configured.',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-300 dark:border-amber-700',
    icon: PenLine,
  },
  {
    status: 'published',
    label: 'Published',
    description: 'The form schema is locked and versioned. It becomes available for applications to render but is not yet assigned to any workflow.',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: Eye,
  },
  {
    status: 'active',
    label: 'Active',
    description: 'The form is actively in use by one or more applications. Submissions are being collected and processed.',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: CheckCircle2,
  },
  {
    status: 'archived',
    label: 'Archived',
    description: 'The form is retired from active use. Existing submissions are preserved for audit. New submissions are not accepted.',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-300 dark:border-gray-700',
    icon: Archive,
  },
];

// ---------------------------------------------------------------------------
// Presentation recordings
// ---------------------------------------------------------------------------

const PRESENTATION_RECORDINGS: ManifestEntry[] = [
  {
    file: 'form-builder/form-builder-screencast.mp4',
    title: 'Form Builder Screencast — India, UAE & US Forms',
    timestamp: '2026-03-25T12:00:00.000Z',
    duration: 173,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Platform Templates', startMs: 8000 },
      { title: 'Organization Forms', startMs: 23000 },
      { title: 'India: Plan Selection', startMs: 34000 },
      { title: 'India: KYC & Proposer', startMs: 50000 },
      { title: 'India: Address & Banking', startMs: 63000 },
      { title: 'India: Member Details', startMs: 72000 },
      { title: 'India: Medical Declarations', startMs: 84000 },
      { title: 'India: Documents & Premium', startMs: 100000 },
      { title: 'PII Vault Integration', startMs: 122000 },
      { title: 'UAE vs India Comparison', startMs: 131000 },
      { title: 'One Platform, Any Market', startMs: 151000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormBuilderOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('introduction');
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Form Builder Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Schema-driven form engine with PII protection and multi-region support
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'introduction' && <IntroductionTab />}
      {activeTab === 'presentation' && <PresentationTab />}
      {activeTab === 'lifecycle' && <LifecycleTab navigate={navigate} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Introduction Tab
// ---------------------------------------------------------------------------

function IntroductionTab() {
  return (
    <div className="space-y-8">
      {/* What is Form Builder */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">What is Form Builder?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Form Builder is Zorbit's platform service for designing, managing, and rendering
          schema-driven forms. It powers all application forms across the platform — from
          insurance quotation wizards to KYC verification flows. Forms are defined as JSON
          schemas with built-in support for conditional logic, multi-step navigation, real-time
          validation, PII tokenization, and auto-save. A single form template can be adapted
          for multiple regions and regulatory environments.
        </p>
      </div>

      {/* Key Capabilities */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="card p-5">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${cap.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold mb-1">{cap.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Users */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Target Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { role: 'Form Designers', desc: 'Create and configure form schemas using the visual editor.' },
            { role: 'Product Managers', desc: 'Define region-specific form variants and manage the form lifecycle.' },
            { role: 'Compliance Officers', desc: 'Ensure PII fields are properly protected and audit form changes.' },
            { role: 'Developers', desc: 'Integrate forms into applications using the React SDK and REST APIs.' },
          ].map((user) => (
            <div key={user.role} className="flex items-start space-x-3">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">{user.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentation Tab
// ---------------------------------------------------------------------------

function PresentationTab() {
  return (
    <div className="space-y-4">
      <DemoTourPlayer
        recordings={PRESENTATION_RECORDINGS}
        baseUrl="/demos/"
        title="Form Builder Presentation"
        defaultLayout="youtube"
        layouts={['youtube', 'chapters']}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle Tab
// ---------------------------------------------------------------------------

function LifecycleTab({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">Form Lifecycle</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Every form moves through these stages. Click a stage to learn more.
        </p>

        {/* Workflow diagram */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <React.Fragment key={stage.status}>
                {idx > 0 && (
                  <div className="hidden lg:flex items-center justify-center">
                    <ArrowRight size={20} className="text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <button
                  onClick={() => navigate('/form-builder/templates')}
                  className={`flex-1 rounded-lg border-2 ${stage.borderColor} ${stage.bgColor} p-4 text-left hover:shadow-md transition-shadow group`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon size={18} className={stage.color} />
                    <span className={`font-semibold text-sm ${stage.color}`}>
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {stage.description}
                  </p>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Schema-driven explanation */}
      <div className="card p-6">
        <h3 className="font-semibold mb-3">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div>
              <p className="font-medium">Schema-Driven</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Forms are defined as JSON schemas. The React SDK renders them dynamically.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="font-medium">Version-Controlled</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Every schema change creates a new version. Submissions reference their schema version.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div>
              <p className="font-medium">PII-Safe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sensitive fields are tokenized before storage. Raw PII never touches operational databases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormBuilderOverviewPage;

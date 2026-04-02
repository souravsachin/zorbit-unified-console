import React from 'react';
import {
  FileInput,
  FileText,
  GitBranch,
  ShieldCheck,
  Globe,
  Save,
  History,
  Layers,
  Code,
  Lock,
  Workflow,
  ArrowRight,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Form Builder Presentation Slides
// ---------------------------------------------------------------------------

const FORM_BUILDER_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Form Builder',
    subtitle: 'Dynamic Form Engine — Design, Deploy, Manage',
    icon: <FileInput size={32} />,
    audioSrc: '/audio/form-builder/slide_01.mp3',
    background: 'bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">formio.js</p>
          <p className="text-white/60 text-xs mt-1">Drag-and-drop form design</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Conditional Logic</p>
          <p className="text-white/60 text-xs mt-1">Dynamic show/hide/enable</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">3 Templates</p>
          <p className="text-white/60 text-xs mt-1">Ready to use out of the box</p>
        </div>
      </div>
    ),
  },
  {
    id: 'form-types',
    title: 'Form Types',
    subtitle: 'Simple, Wizard, Survey, and PDF-Mapped',
    icon: <Layers size={32} />,
    audioSrc: '/audio/form-builder/slide_02.mp3',
    background: 'bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800',
    content: (
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-emerald-300">Simple Forms</p>
          <p className="text-white/60 text-xs mt-1">Single-page data collection with validation</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-blue-300">Wizard Forms</p>
          <p className="text-white/60 text-xs mt-1">Multi-step with navigation and progress</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-amber-300">Survey Forms</p>
          <p className="text-white/60 text-xs mt-1">Rating scales, analytics, and scoring</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-purple-300">PDF-Mapped Forms</p>
          <p className="text-white/60 text-xs mt-1">Overlay fields onto existing documents</p>
        </div>
      </div>
    ),
  },
  {
    id: 'conditional-logic',
    title: 'Conditional Logic',
    subtitle: 'Dynamic forms that adapt in real time',
    icon: <GitBranch size={32} />,
    audioSrc: '/audio/form-builder/slide_03.mp3',
    background: 'bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-800',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { label: 'Show / Hide', desc: 'Toggle visibility based on values' },
          { label: 'Enable / Disable', desc: 'Control field interaction' },
          { label: 'AND / OR', desc: 'Complex condition groups' },
        ].map((item) => (
          <div key={item.label} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <p className="font-semibold text-white">{item.label}</p>
            <p className="text-white/50 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'wizard',
    title: 'Multi-Step Wizard',
    subtitle: 'Guided data collection with step validation',
    icon: <Workflow size={32} />,
    audioSrc: '/audio/form-builder/slide_04.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { step: 'Step 1', desc: 'Personal Info', color: 'border-blue-400 bg-blue-500/20' },
          { step: 'Step 2', desc: 'Documents', color: 'border-emerald-400 bg-emerald-500/20' },
          { step: 'Step 3', desc: 'Review', color: 'border-amber-400 bg-amber-500/20' },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${s.color} border backdrop-blur rounded-lg p-4 text-center min-w-[130px]`}>
              <p className="font-bold text-white">{s.step}</p>
              <p className="text-white/60 text-xs mt-1">{s.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
  {
    id: 'pii-protection',
    title: 'PII Protection',
    subtitle: 'Integrated PII Vault tokenization at submission',
    icon: <Lock size={32} />,
    audioSrc: '/audio/form-builder/slide_05.mp3',
    background: 'bg-gradient-to-br from-rose-700 via-pink-700 to-red-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-green-300">Automatic Tokenization</p>
          <p className="text-white/60 text-xs mt-1">
            Names, emails, phone numbers, and addresses are replaced with PII tokens before reaching the operational database.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-amber-300">Zero Raw PII</p>
          <p className="text-white/60 text-xs mt-1">
            Raw personal data never leaves the vault. Only PII tokens are stored in form submissions.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'regional-forms',
    title: 'Regional Forms',
    subtitle: 'Multi-language, multi-currency, multi-regulation',
    icon: <Globe size={32} />,
    audioSrc: '/audio/form-builder/slide_06.mp3',
    background: 'bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800',
    content: (
      <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
        {['India', 'UAE', 'United States', 'Europe'].map((region) => (
          <div key={region} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <p className="font-semibold text-white">{region}</p>
            <p className="text-white/50 text-[10px] mt-1">Language, currency, validation</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'auto-save',
    title: 'Auto-Save & Version History',
    subtitle: 'Never lose progress, always rollback',
    icon: <Save size={32} />,
    audioSrc: '/audio/form-builder/slide_07.mp3',
    background: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-cyan-300">Auto-Save</p>
          <p className="text-white/60 text-xs mt-1">
            Forms auto-save every 30 seconds. Interrupted sessions resume exactly where the user left off.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-purple-300">Version History</p>
          <p className="text-white/60 text-xs mt-1">
            Every form definition change is versioned. Compare, rollback, and audit the full change history.
          </p>
        </div>
      </div>
    ),
  },
];

const FormBuilderHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="form-builder"
      moduleName="Form Builder"
      moduleDescription="Dynamic Form Engine &mdash; formio.js, Conditional Logic, Multi-Step Wizard"
      moduleIntro="Form Builder is a dynamic form creation and rendering engine powered by formio.js. It supports drag-and-drop form design, conditional logic (show/hide fields based on other field values), multi-step wizard forms, auto-save with draft recovery, and seamless integration with Zorbit platform services for data submission and validation."
      icon={FileInput}
      slides={FORM_BUILDER_SLIDES}
      capabilities={[
        {
          icon: FileInput,
          title: 'Form Types',
          description: 'Simple forms, multi-step wizards, survey forms, and PDF-mapped forms. 3 built-in templates provided.',
        },
        {
          icon: GitBranch,
          title: 'Conditional Logic',
          description: 'Show, hide, enable, or disable fields based on other field values. Support for complex AND/OR conditions.',
        },
        {
          icon: ShieldCheck,
          title: 'Validation Rules',
          description: 'Built-in validators (required, min/max, pattern, email, phone) plus custom JavaScript validation functions.',
        },
        {
          icon: Globe,
          title: 'Multi-Language',
          description: 'Form labels and help text can be translated. Language selector renders the form in the chosen locale.',
        },
        {
          icon: Save,
          title: 'Auto-Save & Drafts',
          description: 'Forms auto-save progress every 30 seconds. Users can resume incomplete submissions from where they left off.',
        },
        {
          icon: History,
          title: 'Version History',
          description: 'Every form definition change is versioned. Compare versions, rollback to previous, and track who changed what.',
        },
      ]}
      targetUsers={[
        { role: 'Form Designers', desc: 'Create and configure forms using the drag-and-drop builder.' },
        { role: 'Business Analysts', desc: 'Define form requirements and review form logic.' },
        { role: 'End Users', desc: 'Fill out and submit forms through the rendered form interface.' },
        { role: 'Administrators', desc: 'Manage form templates, review submissions, and configure integrations.' },
      ]}
      lifecycleStages={[
        { label: 'Draft', description: 'Form is being designed in the form builder. Not yet available to users.', color: '#f59e0b' },
        { label: 'Published', description: 'Form is published and available for submissions. URL generated.', color: '#3b82f6' },
        { label: 'Active', description: 'Form is actively receiving submissions. Analytics tracked.', color: '#10b981' },
        { label: 'Archived', description: 'Form is retired. Existing submissions preserved but no new ones accepted.', color: '#64748b' },
      ]}
      recordings={[
        {
          file: 'form-builder-overview.mp4',
          title: 'Form Builder Overview',
          thumbnail: '',
          timestamp: '2026-03-26',
          duration: 120,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Form Designer', startMs: 15000 },
            { title: 'Conditional Logic', startMs: 40000 },
            { title: 'Multi-Step Wizard', startMs: 60000 },
            { title: 'Submissions', startMs: 85000 },
          ],
        },
        {
          file: 'form-creation-tutorial.mp4',
          title: 'Form Creation Tutorial',
          thumbnail: '',
          timestamp: '2026-03-26',
          duration: 180,
          chapters: [
            { title: 'Creating a New Form', startMs: 0 },
            { title: 'Adding Fields', startMs: 20000 },
            { title: 'Setting Validation', startMs: 60000 },
            { title: 'Conditional Logic', startMs: 100000 },
            { title: 'Publishing', startMs: 140000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/form-builder/"
      swaggerUrl="/api/form-builder/api-docs"
      faqs={[
        { question: 'What form components are available?', answer: 'Text fields, text areas, number, select/dropdown, radio, checkbox, date/time, file upload, signature, HTML content, panels, columns, tabs, and custom components.' },
        { question: 'How do I create a multi-step wizard?', answer: 'In the form builder, choose "Wizard" as the form type. Each panel becomes a wizard step. Navigation buttons are added automatically.' },
        { question: 'Can forms submit data to external APIs?', answer: 'Yes. Form submissions can be configured to POST to any REST endpoint. Webhooks are also supported for real-time notifications.' },
        { question: 'What are the 3 built-in templates?', answer: 'Contact Form (basic name/email/message), Employee Onboarding (multi-step wizard with personal/professional/documents), and Feedback Survey (rating scales and text responses).' },
      ]}
      resources={[
        { label: 'Form Builder API (Swagger)', url: 'https://scalatics.com:3114/api', icon: FileText },
        { label: 'formio.js Documentation', url: 'https://help.form.io/developers', icon: Code },
        { label: 'Form Templates Gallery', url: '/form-builder/templates', icon: Layers },
      ]}
    />
  );
};

export default FormBuilderHubPage;

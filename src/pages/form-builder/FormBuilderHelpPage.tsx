import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DemoTourPlayer } from '../../components/shared/DemoTourPlayer';
import type { ManifestEntry } from '../../components/shared/DemoTourPlayer';

// ---------------------------------------------------------------------------
// Demo recordings manifest — Form Builder specific
// ---------------------------------------------------------------------------

const FORM_BUILDER_RECORDINGS: ManifestEntry[] = [
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
  {
    file: 'form-builder/form-creation-tutorial.mp4',
    title: 'Tutorial: Creating Insurance Application Forms',
    timestamp: '2026-03-25T10:00:00.000Z',
    duration: 120,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Step 1: Choose Form Type', startMs: 22000 },
      { title: 'Step 2: Define Steps', startMs: 38000 },
      { title: 'Step 3: Add Fields', startMs: 56000 },
      { title: 'Step 4: Conditional Rendering', startMs: 74000 },
      { title: 'Step 5: PII Protection', startMs: 94000 },
      { title: 'Step 6: Publish & Deploy', startMs: 108000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// FAQ items
// ---------------------------------------------------------------------------

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What form types does the Form Builder support?',
    answer:
      'The Form Builder supports multi-step wizards, single-page forms, and tabbed layouts. Each form type can include conditional fields, validation rules, auto-save, and PII protection. Templates are available for common insurance application scenarios.',
  },
  {
    question: 'How does PII protection work in forms?',
    answer:
      'Sensitive fields (email, phone, national ID, etc.) are automatically tokenized via the PII Vault before storage. The form schema marks fields with a piiType attribute, and the Form Builder SDK handles tokenization transparently. Operational databases never store raw PII.',
  },
  {
    question: 'Can I create region-specific forms?',
    answer:
      'Yes. The Form Builder supports multi-region form definitions. You can create a base template and then clone it for different regions (India, UAE, US, etc.) with region-specific fields, validation rules, and regulatory requirements.',
  },
  {
    question: 'How do I publish a form?',
    answer:
      'Forms follow a Draft -> Published -> Active -> Archived lifecycle. Draft forms can be edited freely. Publishing locks the schema version and makes it available for use. Active forms are currently in use by applications. Archived forms are retired but preserved for audit.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormBuilderHelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Form Builder Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for the Form Builder platform service
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        <DemoTourPlayer
          recordings={FORM_BUILDER_RECORDINGS}
          baseUrl="/demos/"
          title="Form Builder Recordings"
          defaultLayout="podcast"
        />
      </section>

      {/* Section separator */}
      <div className="flex justify-center">
        <div className="w-16 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>

      {/* FAQ */}
      <section className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6 -mx-2">
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Frequently Asked Questions
        </h2>
        <div className="card divide-y divide-gray-200 dark:divide-gray-700">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFAQ === idx;
            return (
              <div key={idx}>
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-sm font-medium pr-4">{item.question}</span>
                  {isOpen ? (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section separator */}
      <div className="flex justify-center">
        <div className="w-16 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>

      {/* Contact support */}
      <div className="card p-6 border-t-4 border-primary-500">
        <div className="flex items-start space-x-3">
          <HelpCircle size={20} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">Need More Help?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              If you can't find what you're looking for, reach out to the platform support team or
              check the full documentation in the Zorbit Knowledge Base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderHelpPage;

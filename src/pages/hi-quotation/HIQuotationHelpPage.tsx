import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DemoTourPlayer } from '../../components/shared/DemoTourPlayer';
import type { ManifestEntry } from '../../components/shared/DemoTourPlayer';

// ---------------------------------------------------------------------------
// Demo recordings manifest
// ---------------------------------------------------------------------------

const HI_QUOTATION_RECORDINGS: ManifestEntry[] = [
  {
    file: 'hi-quotation/hi-quotation-overview.mp4',
    title: 'HI Quotation — End-to-End Overview',
    thumbnail: 'hi-quotation/hi-quotation-overview-thumb.jpg',
    timestamp: '2026-03-21T10:00:00.000Z',
    duration: 75,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Application Form', startMs: 12000 },
      { title: 'Member Details', startMs: 25000 },
      { title: 'Plan Selection', startMs: 37000 },
      { title: 'Premium Calculation', startMs: 50000 },
      { title: 'Summary & Submit', startMs: 62000 },
    ],
  },
  {
    file: 'smart-form/smart-form-overview.mp4',
    title: 'Smart Form — Conditional Rendering & Validation',
    thumbnail: 'smart-form/smart-form-overview-thumb.jpg',
    timestamp: '2026-03-21T10:01:00.000Z',
    duration: 107,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Form Schema', startMs: 18000 },
      { title: 'Conditional Fields', startMs: 35000 },
      { title: 'Validation Rules', startMs: 53000 },
      { title: 'Multi-Step Wizard', startMs: 72000 },
      { title: 'Auto-Save & Submit', startMs: 90000 },
    ],
  },
  {
    file: 'integrated-journey/integrated-journey-overview.mp4',
    title: 'Integrated Journey — Quote to Bind',
    thumbnail: 'integrated-journey/integrated-journey-overview-thumb.jpg',
    timestamp: '2026-03-21T10:02:00.000Z',
    duration: 127,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Quote Initiation', startMs: 18000 },
      { title: 'Risk Assessment', startMs: 36000 },
      { title: 'Underwriting Referral', startMs: 54000 },
      { title: 'Approval & Pricing', startMs: 72000 },
      { title: 'Document Generation', startMs: 90000 },
      { title: 'Bind & Issue', startMs: 108000 },
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
    question: 'How do I create a new health insurance quotation?',
    answer:
      'Navigate to the HI Quotation page and click "New Application". Fill in the applicant details, select a plan, add members, and submit the form. The system will calculate the premium and create a quotation ready for underwriting review.',
  },
  {
    question: 'What happens after I submit a quotation?',
    answer:
      'After submission, the quotation enters the underwriting workflow. Depending on the risk profile, it may be auto-approved or referred to an underwriter for manual review. You can track the status from the quotation list.',
  },
  {
    question: 'Can I modify a quotation after submission?',
    answer:
      'Quotations in "Draft" status can be freely edited. Once submitted, changes require an amendment request which goes through the approval workflow. Bound quotations cannot be modified.',
  },
  {
    question: 'How does the Smart Form work?',
    answer:
      'The Smart Form uses a schema-driven approach with conditional rendering. Fields appear or hide based on previous answers, validation runs in real-time, and multi-step wizards guide users through complex applications. All form data is auto-saved.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HIQuotationHelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">HI Quotation Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for Health Insurance Quotation
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        <DemoTourPlayer
          recordings={HI_QUOTATION_RECORDINGS}
          baseUrl="/demos/"
          title="Demo Recordings"
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

export default HIQuotationHelpPage;

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

const UW_WORKFLOW_RECORDINGS: ManifestEntry[] = [
  {
    file: 'uw-workflow/uw-workflow-overview.mp4',
    title: 'UW Workflow — Underwriting Queue & Decisioning',
    thumbnail: 'uw-workflow/uw-workflow-overview-thumb.jpg',
    timestamp: '2026-03-21T10:00:00.000Z',
    duration: 77,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Queue Management', startMs: 15000 },
      { title: 'Case Review', startMs: 30000 },
      { title: 'Decision Actions', startMs: 46000 },
      { title: 'Audit Trail', startMs: 62000 },
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
    question: 'What is the UW Workflow module?',
    answer:
      'The UW Workflow module manages the underwriting queue. Cases referred from quotation flow into this queue where underwriters can review risk details, request additional information, and make approval or decline decisions.',
  },
  {
    question: 'How are cases assigned to underwriters?',
    answer:
      'Cases can be auto-assigned based on configured rules (product type, sum insured thresholds, geography) or manually picked from the queue by an available underwriter. The system tracks assignment history and SLA timers.',
  },
  {
    question: 'What decision options are available?',
    answer:
      'Underwriters can Approve, Decline, Refer to Senior UW, or Request More Information. Each decision is logged in the audit trail with the underwriter ID, timestamp, and rationale.',
  },
  {
    question: 'Can I configure the underwriting rules?',
    answer:
      'Yes. Underwriting rules are configured through the HI Decisioning module. Rules define auto-approval thresholds, mandatory referral triggers, and exclusion criteria. Changes follow the maker-checker workflow.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UWWorkflowHelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">UW Workflow Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for Underwriting Workflow
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        <DemoTourPlayer
          recordings={UW_WORKFLOW_RECORDINGS}
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

export default UWWorkflowHelpPage;

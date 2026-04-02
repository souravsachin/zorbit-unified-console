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

const HI_DECISIONING_RECORDINGS: ManifestEntry[] = [
  {
    file: 'hi-decisioning/hi-decisioning-overview.mp4',
    title: 'HI Decisioning — Rules Engine & Auto-Approval',
    thumbnail: 'hi-decisioning/hi-decisioning-overview-thumb.jpg',
    timestamp: '2026-03-21T10:00:00.000Z',
    duration: 91,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Rule Categories', startMs: 13000 },
      { title: 'Threshold Configuration', startMs: 26000 },
      { title: 'Auto-Approval Logic', startMs: 39000 },
      { title: 'Referral Triggers', startMs: 52000 },
      { title: 'Exclusion Criteria', startMs: 65000 },
      { title: 'Testing & Simulation', startMs: 78000 },
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
    question: 'What is the HI Decisioning module?',
    answer:
      'HI Decisioning is the rules engine that powers automated underwriting decisions for health insurance. It evaluates quotation data against configured rules to determine whether a case should be auto-approved, referred, or declined.',
  },
  {
    question: 'How do I create a new decisioning rule?',
    answer:
      'Navigate to the rule editor, select a category (e.g., Age Limits, Sum Insured Thresholds, Medical History), define the conditions and outcome action. Rules follow the maker-checker workflow and must be approved before going live.',
  },
  {
    question: 'Can I test rules before deploying them?',
    answer:
      'Yes. The simulation mode lets you run test cases against draft rules. You can input sample quotation data and see which rules fire, what decision is reached, and the full execution trace for debugging.',
  },
  {
    question: 'How does the auto-approval threshold work?',
    answer:
      'Auto-approval thresholds define the boundaries within which a quotation is automatically approved without underwriter intervention. If the sum insured, age, and medical history all fall within configured limits, the system approves the case instantly.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HIDecisioningHelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">HI Decisioning Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for Health Insurance Decisioning Rules Engine
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        <DemoTourPlayer
          recordings={HI_DECISIONING_RECORDINGS}
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

export default HIDecisioningHelpPage;

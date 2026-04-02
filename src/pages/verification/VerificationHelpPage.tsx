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

const VERIFICATION_RECORDINGS: ManifestEntry[] = [
  {
    file: 'verification/verification-overview.mp4',
    title: 'Verification — Document & Identity Verification',
    thumbnail: 'verification/verification-overview-thumb.jpg',
    timestamp: '2026-03-21T10:00:00.000Z',
    duration: 93,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Document Upload', startMs: 18000 },
      { title: 'OCR & Extraction', startMs: 37000 },
      { title: 'Verification Rules', startMs: 56000 },
      { title: 'Results & Audit', startMs: 74000 },
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
    question: 'What documents can be verified?',
    answer:
      'The Verification module supports identity documents (passport, national ID, driving license), proof of address (utility bills, bank statements), medical reports, and income documents. Each document type has its own extraction and validation rules.',
  },
  {
    question: 'How does automated verification work?',
    answer:
      'Documents are uploaded and processed through OCR to extract key fields. The extracted data is then matched against the application data and verified against configured rules. Results are classified as Verified, Failed, or Needs Manual Review.',
  },
  {
    question: 'What happens when automated verification fails?',
    answer:
      'Failed verifications are routed to a manual review queue. A verification officer can view the uploaded document, the extracted data, and the reason for failure, then make a manual accept or reject decision.',
  },
  {
    question: 'Is PII in documents protected?',
    answer:
      'Yes. All personally identifiable information extracted from documents is tokenized through the PII Vault before storage. The original document images are encrypted at rest. Access is controlled by role-based policies and fully audited.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VerificationHelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Verification Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for Document & Identity Verification
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        <DemoTourPlayer
          recordings={VERIFICATION_RECORDINGS}
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

export default VerificationHelpPage;

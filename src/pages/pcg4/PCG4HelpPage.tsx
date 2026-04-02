import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DemoTourPlayer } from '../../components/shared/DemoTourPlayer';
import type { ManifestEntry } from '../../components/shared/DemoTourPlayer';

// ---------------------------------------------------------------------------
// Demo recordings manifest (will be loaded from /demos/v1/MANIFEST.json later)
// ---------------------------------------------------------------------------

const PCG4_RECORDINGS: ManifestEntry[] = [
  {
    file: 'form-builder/form-builder-screencast.mp4',
    title: 'PCG4 — Product Configuration & Form Builder Screencast',
    thumbnail: 'form-builder/form-builder-screencast-thumb.jpg',
    timestamp: '2026-03-20T12:00:00.000Z',
    duration: 142,
    chapters: [
      { title: 'Login & Navigation', startMs: 0 },
      { title: 'Form Templates', startMs: 15000 },
      { title: 'India Application Form', startMs: 35000 },
      { title: 'Creating New Forms', startMs: 60000 },
      { title: 'UAE Application', startMs: 80000 },
      { title: 'US Application', startMs: 100000 },
      { title: 'Regional Comparison', startMs: 120000 },
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
    question: 'What is PCG4 and how does it fit into the Zorbit platform?',
    answer:
      'PCG4 (Product Configurator Generation 4) is a module within the Zorbit platform that lets you design, review, and deploy insurance product configurations. It integrates with Zorbit Identity for authentication, Authorization for role-based access, and the Messaging service for event-driven notifications.',
  },
  {
    question: 'Who can create and edit configurations?',
    answer:
      'Users with the Drafter (Maker) role can create and edit configurations. The configuration then moves through the Checker (Reviewer/Approver) and Publisher workflow stages before it can be deployed to production.',
  },
  {
    question: 'Can I use existing configurations as templates?',
    answer:
      'Yes. The configuration designer includes a Template Picker that offers curated templates (HMO, PPO, HDHP) as well as the ability to clone any existing configuration. This lets you start from a known-good baseline and customize from there.',
  },
  {
    question: 'How do I deploy a configuration to production?',
    answer:
      'Once a configuration has been approved, a user with the Publisher role can deploy it to a target environment from the Deployments page. Each deployment creates an immutable snapshot that can be rolled back if needed.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4HelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">PCG4 Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for Product Configurator (PCG4)
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        {PCG4_RECORDINGS.length > 0 ? (
          <DemoTourPlayer
            recordings={PCG4_RECORDINGS}
            baseUrl="/demos/"
            title="Demo Recordings"
            defaultLayout="podcast"
          />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Demo recordings coming soon.
            </p>
          </div>
        )}
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

export default PCG4HelpPage;

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

const MI_QUOTATION_RECORDINGS: ManifestEntry[] = [
  {
    file: 'mi-quotation/mi-quotation-overview.mp4',
    title: 'MI Quotation — Motor Insurance Quote Flow',
    thumbnail: 'mi-quotation/mi-quotation-overview-thumb.jpg',
    timestamp: '2026-03-21T10:00:00.000Z',
    duration: 74,
    chapters: [
      { title: 'Introduction', startMs: 0 },
      { title: 'Vehicle Details', startMs: 12000 },
      { title: 'Driver Profile', startMs: 24000 },
      { title: 'Coverage Selection', startMs: 37000 },
      { title: 'Premium Breakdown', startMs: 50000 },
      { title: 'Quote Summary', startMs: 62000 },
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
    question: 'What types of motor insurance are supported?',
    answer:
      'The MI Quotation module supports Comprehensive, Third-Party Only, and Third-Party Fire & Theft policies. Each type has its own coverage options and pricing rules configured through the product configurator.',
  },
  {
    question: 'How is the premium calculated?',
    answer:
      'Premiums are calculated based on vehicle details (make, model, year, value), driver profile (age, experience, claims history), selected coverage type, and applicable add-ons. The rating engine applies configured tariffs and loading/discount factors.',
  },
  {
    question: 'Can I add optional coverages to a motor policy?',
    answer:
      'Yes. Optional add-ons include Roadside Assistance, Windscreen Cover, Personal Accident for Driver, and Loss of Use. Each add-on has its own pricing and can be toggled during the quotation process.',
  },
  {
    question: 'How do I handle fleet quotations?',
    answer:
      'Fleet quotations can be created by adding multiple vehicles to a single application. The system applies fleet discount rules based on the number of vehicles and overall risk profile. Each vehicle maintains its own coverage details.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MIQuotationHelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">MI Quotation Help</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Videos, guides, and FAQ for Motor Insurance Quotation
        </p>
      </div>

      {/* Demo Tour Player */}
      <section>
        <h2 className="text-lg font-semibold mb-5 border-l-4 border-primary-500 pl-4">
          Demo Recordings
        </h2>
        <DemoTourPlayer
          recordings={MI_QUOTATION_RECORDINGS}
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

export default MIQuotationHelpPage;

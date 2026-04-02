import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';

interface RegionCard {
  flag: string;
  name: string;
  label: string;
  description: string;
  route: string;
  color: string;
  bg: string;
  features: string[];
}

const REGIONS: RegionCard[] = [
  {
    flag: '\u{1F1EE}\u{1F1F3}',
    name: 'India',
    label: 'India Market',
    description: 'IRDAI-compliant health insurance application with PAN/Aadhaar KYC, floater plans, and GST 18% tax calculation.',
    route: 'india',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    features: ['Floater / Multi-Individual plans', 'PAN & Aadhaar KYC', 'IRDAI medical questions', 'GST 18%', 'ABHA ID', 'Portability support'],
  },
  {
    flag: '\u{1F1E6}\u{1F1EA}',
    name: 'UAE',
    label: 'UAE Market',
    description: 'DHA/DOH-compliant health insurance application with Emirates ID, network tier selection, and VAT 5%.',
    route: 'uae',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    features: ['Individual plans only', 'Emirates ID mandatory', 'DHA/DOH compliance', 'VAT 5%', 'Network tiers (Platinum-Bronze)', 'Certificate of Continuity'],
  },
  {
    flag: '\u{1F1FA}\u{1F1F8}',
    name: 'United States',
    label: 'US Market',
    description: 'ACA-compliant health insurance application with metal tier plans, SSN, subsidies, and HIPAA compliance.',
    route: 'us',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    features: ['Metal tiers (Bronze-Platinum)', 'SSN required', 'ACA mandate', 'Premium tax credits', 'No pre-existing exclusions', 'HIPAA compliant'],
  },
];

const RegionSelectorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/40">
          <Globe className="w-7 h-7 text-fuchsia-600 dark:text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Health Insurance Application</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a region to begin the application process. Each region has localized fields, currencies, and compliance requirements.
          </p>
        </div>
      </div>

      {/* Region Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REGIONS.map((region) => (
          <button
            key={region.route}
            onClick={() => navigate(region.route)}
            className="group text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-600 transition-all hover:shadow-lg p-6 flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{region.flag}</span>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-fuchsia-500 transition-colors" />
            </div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {region.name}
            </h2>
            <p className={`text-xs font-semibold uppercase tracking-wider ${region.color} mb-3`}>
              {region.label}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
              {region.description}
            </p>

            <div className={`rounded-lg ${region.bg} p-3`}>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Features:</p>
              <ul className="space-y-1">
                {region.features.map((f, idx) => (
                  <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="text-fuchsia-500 mt-0.5">-</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      {/* Info note */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-700 dark:text-gray-300">How it works:</strong>{' '}
        Each regional form is defined in the Zorbit Form Builder and rendered dynamically.
        Fields, validations, and conditional logic are all driven by the form schema &mdash; no custom code per region.
        PII fields are automatically tokenized through the PII Vault on submission.
      </div>
    </div>
  );
};

export default RegionSelectorPage;

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Lock,
  Globe,
  Building2,
  UserCheck,
  Hash,
  RefreshCw,
  Info,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Static config data                                                 */
/* ------------------------------------------------------------------ */

interface PIIAttribute {
  attribute: string;
  category: string;
  detectionPattern: string;
  tokenization: string;
  nicknameStrategy: string;
  active: boolean;
}

const INITIAL_ATTRIBUTES: PIIAttribute[] = [
  { attribute: 'Full Name', category: 'Identity', detectionPattern: 'ML + Dictionary', tokenization: '4-char token', nicknameStrategy: 'Faker name', active: true },
  { attribute: 'Email', category: 'Contact', detectionPattern: 'RFC 5322 regex', tokenization: '4-char token', nicknameStrategy: 'Faker email', active: true },
  { attribute: 'Phone', category: 'Contact', detectionPattern: 'E.164 regex', tokenization: '4-char token', nicknameStrategy: 'Random digits', active: true },
  { attribute: 'Address', category: 'Location', detectionPattern: 'NER model', tokenization: '4-char token', nicknameStrategy: 'Faker address', active: true },
  { attribute: 'Bank Account', category: 'Financial', detectionPattern: 'Pattern + checksum', tokenization: '4-char token', nicknameStrategy: 'Masked (****1234)', active: true },
  { attribute: 'SSN', category: 'Government ID', detectionPattern: '\\d{3}-\\d{2}-\\d{4}', tokenization: '4-char token', nicknameStrategy: 'Random format', active: true },
  { attribute: 'Date of Birth', category: 'Identity', detectionPattern: 'Date in context', tokenization: '4-char token', nicknameStrategy: 'Random date', active: true },
  { attribute: 'Medical ID', category: 'Health', detectionPattern: 'Prefix + digits', tokenization: '4-char token', nicknameStrategy: 'Random format', active: true },
  { attribute: 'Passport', category: 'Government ID', detectionPattern: 'Country + pattern', tokenization: '4-char token', nicknameStrategy: 'Random format', active: false },
  { attribute: 'Driver License', category: 'Government ID', detectionPattern: 'State + pattern', tokenization: '4-char token', nicknameStrategy: 'Random format', active: false },
];

const ACCESS_POLICIES = [
  { name: 'Full Access', roles: 'PII Admin', orgScope: 'Any', network: 'Internal', viewLevel: 'Full PII', priority: 1 },
  { name: 'Analyst Access', roles: 'Data Analyst', orgScope: 'Same Org', network: 'Internal', viewLevel: 'Nicknamed', priority: 2 },
  { name: 'Auditor Access', roles: 'External Auditor', orgScope: 'Partner', network: 'Any', viewLevel: 'Tokenized', priority: 3 },
  { name: 'Support Access', roles: 'Customer Support', orgScope: 'Same Org', network: 'Any', viewLevel: 'Nicknamed', priority: 4 },
  { name: 'API Access', roles: 'Service Account', orgScope: 'Any', network: 'Any', viewLevel: 'Tokenized', priority: 5 },
  { name: 'Default', roles: '*', orgScope: '*', network: '*', viewLevel: 'Tokenized', priority: 99 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Identity: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Contact: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Location: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Financial: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Government ID': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  Health: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function viewLevelColor(level: string): string {
  if (level === 'Full PII') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (level === 'Nicknamed') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
}

function policyIcon(name: string) {
  if (name === 'Full Access') return Shield;
  if (name === 'Analyst Access') return Database;
  if (name === 'Auditor Access') return Globe;
  if (name === 'Support Access') return UserCheck;
  if (name === 'API Access') return Key;
  return Lock;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-l-4 border-indigo-500 pl-4 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const PIIConfigPage: React.FC = () => {
  const [attributes, setAttributes] = useState<PIIAttribute[]>(INITIAL_ATTRIBUTES);

  const toggleAttribute = (idx: number) => {
    setAttributes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], active: !next[idx].active };
      return next;
    });
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PII Configuration</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              Platform Service
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            System-level configuration for PII attribute detection, tokenization, and access policies
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Section A — PII Attribute Registry                           */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <SectionHeader title="PII Attribute Registry" subtitle="Registered PII attribute types with detection patterns and tokenization strategies" />
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add Attribute
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Attribute</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Detection Pattern</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Tokenization</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Nickname Strategy</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, idx) => (
                <tr
                  key={attr.attribute}
                  className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                    !attr.active ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{attr.attribute}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${CATEGORY_COLORS[attr.category] || 'bg-gray-100 text-gray-600'}`}>
                      {attr.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{attr.detectionPattern}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{attr.tokenization}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{attr.nicknameStrategy}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      attr.active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {attr.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        title="Edit attribute"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleAttribute(idx)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={attr.active ? 'Deactivate' : 'Activate'}
                      >
                        {attr.active ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Section B — Access Policies                                  */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-gray-50 dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Access Policies" subtitle="Role-based PII visibility rules determining who can see what level of data" />

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Policy Name</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Roles</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Org Scope</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Network</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">View Level</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Priority</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_POLICIES.map((p) => {
                const Icon = policyIcon(p.name);
                return (
                  <tr
                    key={p.name}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" /> {p.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.roles}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {p.orgScope}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.network}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${viewLevelColor(p.viewLevel)}`}>
                        {p.viewLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-mono">{p.priority}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Section C — Token Configuration                              */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Token Configuration" subtitle="System-wide tokenization parameters and collision handling" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config params */}
          <div className="space-y-4">
            {[
              { label: 'Token Format', value: '4-character alphanumeric (A-Z, 0-9, excluding confusables: 0/O, 1/I/L)', icon: Hash },
              { label: 'Character Set', value: 'A-H, J-N, P-Z, 2-9 (30 chars)', icon: Key },
              { label: 'Total Combinations', value: '30\u2074 = 810,000', icon: Database },
              { label: 'Token Prefix', value: 'PII-', icon: Shield },
              { label: 'Collision Strategy', value: 'Retry with new random', icon: RefreshCw },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700/50">
                  <Icon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual example */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800">
            <Info className="w-5 h-5 text-indigo-400 mb-3" />
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">Tokenization Example</p>

            {/* Original */}
            <div className="w-full max-w-xs mb-4">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Original PII</p>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-center">
                <span className="text-base font-semibold text-red-700 dark:text-red-300">Saurab Mehta</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-gray-400 dark:text-gray-500 mb-4 text-lg">&darr;</div>

            {/* Token + Nickname */}
            <div className="w-full max-w-xs grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Token</p>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5 text-center">
                  <span className="text-base font-bold font-mono text-blue-700 dark:text-blue-300">LJQ9</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nickname</p>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-center">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">Rahul Tripathi</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4">
              Token stored in operational DB &middot; Original stored in PII Vault
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PIIConfigPage;

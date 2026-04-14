import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface PiiDataType {
  type: string;
  description: string;
  exampleToken: string;
  protectionLevel: 'High' | 'Critical';
}

const PII_DATA_TYPES: PiiDataType[] = [
  {
    type: 'email',
    description: 'Electronic mail address of a person or organisation',
    exampleToken: 'PII-A3F1',
    protectionLevel: 'High',
  },
  {
    type: 'phone',
    description: 'Mobile or landline telephone number including country code',
    exampleToken: 'PII-B82C',
    protectionLevel: 'High',
  },
  {
    type: 'national_id',
    description: 'Government-issued national identity number (e.g. Aadhaar, SSN, Emirates ID)',
    exampleToken: 'PII-C14D',
    protectionLevel: 'Critical',
  },
  {
    type: 'passport_number',
    description: 'Passport document number issued by a government authority',
    exampleToken: 'PII-D57E',
    protectionLevel: 'Critical',
  },
  {
    type: 'full_name',
    description: 'Legal full name of a natural person',
    exampleToken: 'PII-E29F',
    protectionLevel: 'High',
  },
  {
    type: 'date_of_birth',
    description: 'Date of birth of a natural person (ISO 8601 format)',
    exampleToken: 'PII-F66A',
    protectionLevel: 'High',
  },
  {
    type: 'bank_account',
    description: 'Bank account number or IBAN used for financial transactions',
    exampleToken: 'PII-G90B',
    protectionLevel: 'Critical',
  },
  {
    type: 'credit_card',
    description: 'Credit or debit card number (PAN)',
    exampleToken: 'PII-H31C',
    protectionLevel: 'Critical',
  },
  {
    type: 'address',
    description: 'Physical residential or mailing address of a person',
    exampleToken: 'PII-I77D',
    protectionLevel: 'High',
  },
];

const ProtectionBadge: React.FC<{ level: 'High' | 'Critical' }> = ({ level }) => {
  const isCritical = level === 'Critical';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isCritical
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      }`}
    >
      <AlertTriangle size={10} />
      {level}
    </span>
  );
};

const PiiDataTypesPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">PII Data Types</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sensitive data types that Zorbit recognises and tokenises via the PII Vault.
          Raw values are never stored in operational databases — only tokens.
        </p>
      </div>

      {/* Info banner */}
      <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-3">
          <Shield size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">How PII tokenisation works</p>
            <p>
              When a service receives a sensitive value it calls the PII Vault, which stores the raw
              data in an isolated, encrypted database and returns a short token (e.g.{' '}
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">PII-92AF</code>).
              The operational service stores only the token. All access is logged in the audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Data types table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Recognised PII Types ({PII_DATA_TYPES.length})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-40">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Description
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-36">
                  Example Token
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-32">
                  Protection
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {PII_DATA_TYPES.map((dt) => (
                <tr
                  key={dt.type}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">
                      {dt.type}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{dt.description}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono">
                      {dt.exampleToken}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <ProtectionBadge level={dt.protectionLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 dark:text-gray-600">
        Additional PII types can be registered via the PII Vault service configuration. Contact your
        platform administrator to extend this list.
      </p>
    </div>
  );
};

export default PiiDataTypesPage;

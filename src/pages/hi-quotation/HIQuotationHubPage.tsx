import React, { useState, useCallback } from 'react';
import {
  FileText,
  Shield,
  Globe,
  Users,
  Lock,
  Heart,
  ClipboardList,
  MapPin,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import api from '../../services/api';
import { API_CONFIG } from '../../config';

// ---------------------------------------------------------------------------
// Seed Data — 10 diverse quotations
// ---------------------------------------------------------------------------

interface SeedQuotation {
  region: string;
  sumInsured: number;
  currency: string;
  planType: string;
  proposer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  members: Array<{
    firstName: string;
    lastName: string;
    relationship: string;
    dateOfBirth: string;
    gender: string;
    heightCm: number;
    weightKg: number;
  }>;
  mafAnswers: Record<string, { answer: boolean; details?: string }>;
}

const SEED_QUOTATIONS: SeedQuotation[] = [
  // --- 3 UAE Quotations ---
  {
    region: 'UAE',
    sumInsured: 500000,
    currency: 'AED',
    planType: 'family',
    proposer: {
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      email: 'ahmed.alrashid@example.ae',
      phone: '+971501234567',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      nationality: 'UAE',
      address: { line1: 'Villa 42, Al Barsha', city: 'Dubai', state: 'Dubai', postalCode: '12345', country: 'AE' },
    },
    members: [
      { firstName: 'Ahmed', lastName: 'Al-Rashid', relationship: 'self', dateOfBirth: '1985-03-15', gender: 'male', heightCm: 178, weightKg: 82 },
      { firstName: 'Fatima', lastName: 'Al-Rashid', relationship: 'spouse', dateOfBirth: '1988-07-22', gender: 'female', heightCm: 165, weightKg: 62 },
      { firstName: 'Omar', lastName: 'Al-Rashid', relationship: 'child', dateOfBirth: '2015-11-03', gender: 'male', heightCm: 125, weightKg: 28 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: false }, smoking: { answer: false } },
  },
  {
    region: 'UAE',
    sumInsured: 1000000,
    currency: 'AED',
    planType: 'individual',
    proposer: {
      firstName: 'Mariam',
      lastName: 'Khaled',
      email: 'mariam.khaled@example.ae',
      phone: '+971559876543',
      dateOfBirth: '1992-01-10',
      gender: 'female',
      nationality: 'UAE',
      address: { line1: 'Apt 1501, Marina Walk', city: 'Abu Dhabi', state: 'Abu Dhabi', postalCode: '23456', country: 'AE' },
    },
    members: [
      { firstName: 'Mariam', lastName: 'Khaled', relationship: 'self', dateOfBirth: '1992-01-10', gender: 'female', heightCm: 160, weightKg: 55 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: false }, smoking: { answer: false } },
  },
  {
    region: 'UAE',
    sumInsured: 750000,
    currency: 'AED',
    planType: 'family',
    proposer: {
      firstName: 'Saeed',
      lastName: 'Al-Mansoori',
      email: 'saeed.mansoori@example.ae',
      phone: '+971521112233',
      dateOfBirth: '1978-06-20',
      gender: 'male',
      nationality: 'UAE',
      address: { line1: '10 Jumeirah Beach Rd', city: 'Sharjah', state: 'Sharjah', postalCode: '34567', country: 'AE' },
    },
    members: [
      { firstName: 'Saeed', lastName: 'Al-Mansoori', relationship: 'self', dateOfBirth: '1978-06-20', gender: 'male', heightCm: 175, weightKg: 90 },
      { firstName: 'Noura', lastName: 'Al-Mansoori', relationship: 'spouse', dateOfBirth: '1982-09-14', gender: 'female', heightCm: 162, weightKg: 68 },
      { firstName: 'Khalid', lastName: 'Al-Mansoori', relationship: 'child', dateOfBirth: '2010-04-25', gender: 'male', heightCm: 148, weightKg: 42 },
      { firstName: 'Aisha', lastName: 'Al-Mansoori', relationship: 'child', dateOfBirth: '2013-12-01', gender: 'female', heightCm: 130, weightKg: 30 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: true, details: 'Controlled with medication since 2020' }, smoking: { answer: false } },
  },

  // --- 3 India Quotations ---
  {
    region: 'IN',
    sumInsured: 1000000,
    currency: 'INR',
    planType: 'individual',
    proposer: {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@example.in',
      phone: '+919876543210',
      dateOfBirth: '1990-05-12',
      gender: 'female',
      nationality: 'IN',
      address: { line1: '45 MG Road, Indiranagar', city: 'Bangalore', state: 'Karnataka', postalCode: '560038', country: 'IN' },
    },
    members: [
      { firstName: 'Priya', lastName: 'Sharma', relationship: 'self', dateOfBirth: '1990-05-12', gender: 'female', heightCm: 163, weightKg: 58 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: false }, smoking: { answer: false }, thyroid: { answer: false } },
  },
  {
    region: 'IN',
    sumInsured: 2500000,
    currency: 'INR',
    planType: 'floater',
    proposer: {
      firstName: 'Rajesh',
      lastName: 'Patel',
      email: 'rajesh.patel@example.in',
      phone: '+919812345678',
      dateOfBirth: '1975-08-30',
      gender: 'male',
      nationality: 'IN',
      address: { line1: '12 Satellite Road', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380015', country: 'IN' },
    },
    members: [
      { firstName: 'Rajesh', lastName: 'Patel', relationship: 'self', dateOfBirth: '1975-08-30', gender: 'male', heightCm: 172, weightKg: 78 },
      { firstName: 'Meena', lastName: 'Patel', relationship: 'spouse', dateOfBirth: '1979-02-18', gender: 'female', heightCm: 158, weightKg: 65 },
      { firstName: 'Arjun', lastName: 'Patel', relationship: 'child', dateOfBirth: '2005-06-15', gender: 'male', heightCm: 170, weightKg: 62 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: false }, smoking: { answer: false }, thyroid: { answer: true, details: 'Hypothyroidism, on Eltroxin 50mcg daily since 2018' } },
  },
  {
    region: 'IN',
    sumInsured: 500000,
    currency: 'INR',
    planType: 'individual',
    proposer: {
      firstName: 'Ananya',
      lastName: 'Reddy',
      email: 'ananya.reddy@example.in',
      phone: '+919900112233',
      dateOfBirth: '1998-11-25',
      gender: 'female',
      nationality: 'IN',
      address: { line1: '78 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500033', country: 'IN' },
    },
    members: [
      { firstName: 'Ananya', lastName: 'Reddy', relationship: 'self', dateOfBirth: '1998-11-25', gender: 'female', heightCm: 155, weightKg: 50 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: false }, smoking: { answer: false }, thyroid: { answer: false } },
  },

  // --- 2 US Quotations ---
  {
    region: 'US',
    sumInsured: 250000,
    currency: 'USD',
    planType: 'silver',
    proposer: {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@example.com',
      phone: '+12125551234',
      dateOfBirth: '1982-04-08',
      gender: 'male',
      nationality: 'US',
      address: { line1: '350 W 42nd St, Apt 12B', city: 'New York', state: 'NY', postalCode: '10036', country: 'US' },
    },
    members: [
      { firstName: 'Michael', lastName: 'Johnson', relationship: 'self', dateOfBirth: '1982-04-08', gender: 'male', heightCm: 183, weightKg: 88 },
      { firstName: 'Sarah', lastName: 'Johnson', relationship: 'spouse', dateOfBirth: '1984-09-19', gender: 'female', heightCm: 168, weightKg: 65 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: false }, smoking: { answer: false }, mentalHealth: { answer: false } },
  },
  {
    region: 'US',
    sumInsured: 500000,
    currency: 'USD',
    planType: 'gold',
    proposer: {
      firstName: 'Emily',
      lastName: 'Chen',
      email: 'emily.chen@example.com',
      phone: '+14155559876',
      dateOfBirth: '1970-12-03',
      gender: 'female',
      nationality: 'US',
      address: { line1: '1200 California St', city: 'San Francisco', state: 'CA', postalCode: '94109', country: 'US' },
    },
    members: [
      { firstName: 'Emily', lastName: 'Chen', relationship: 'self', dateOfBirth: '1970-12-03', gender: 'female', heightCm: 160, weightKg: 72 },
    ],
    mafAnswers: { diabetes: { answer: false }, heartDisease: { answer: false }, hypertension: { answer: true, details: 'Managed with Lisinopril 10mg since 2019' }, smoking: { answer: false }, mentalHealth: { answer: false } },
  },

  // --- 1 with Pre-existing Conditions ---
  {
    region: 'IN',
    sumInsured: 1500000,
    currency: 'INR',
    planType: 'individual',
    proposer: {
      firstName: 'Vikram',
      lastName: 'Desai',
      email: 'vikram.desai@example.in',
      phone: '+919845001122',
      dateOfBirth: '1965-03-22',
      gender: 'male',
      nationality: 'IN',
      address: { line1: '5 Bandra Reclamation', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050', country: 'IN' },
    },
    members: [
      { firstName: 'Vikram', lastName: 'Desai', relationship: 'self', dateOfBirth: '1965-03-22', gender: 'male', heightCm: 170, weightKg: 85 },
    ],
    mafAnswers: {
      diabetes: { answer: true, details: 'Type 2 diabetes diagnosed 2015, on Metformin 1000mg + Glimepiride 2mg' },
      heartDisease: { answer: false },
      hypertension: { answer: true, details: 'On Amlodipine 5mg since 2017' },
      smoking: { answer: false },
      thyroid: { answer: false },
    },
  },

  // --- 1 with High BMI (triggers loading in UW) ---
  {
    region: 'UAE',
    sumInsured: 500000,
    currency: 'AED',
    planType: 'individual',
    proposer: {
      firstName: 'Hassan',
      lastName: 'El-Tayeb',
      email: 'hassan.eltayeb@example.ae',
      phone: '+971507778899',
      dateOfBirth: '1988-10-15',
      gender: 'male',
      nationality: 'EG',
      address: { line1: '22 Al Nahda, Building 7', city: 'Dubai', state: 'Dubai', postalCode: '45678', country: 'AE' },
    },
    members: [
      { firstName: 'Hassan', lastName: 'El-Tayeb', relationship: 'self', dateOfBirth: '1988-10-15', gender: 'male', heightCm: 170, weightKg: 120 },
    ],
    mafAnswers: {
      diabetes: { answer: false },
      heartDisease: { answer: false },
      hypertension: { answer: false },
      smoking: { answer: true, details: '10 cigarettes/day for 8 years' },
    },
  },
];

// ---------------------------------------------------------------------------
// SeedDemoData Component
// ---------------------------------------------------------------------------

function SeedDemoData() {
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ idx: number; ok: boolean; msg: string }>>([]);
  const [done, setDone] = useState(false);

  const orgId = 'O-OZPY'; // default org

  const seedQuotations = useCallback(async () => {
    setSeeding(true);
    setProgress(0);
    setResults([]);
    setDone(false);

    const base = API_CONFIG.HI_QUOTATION_URL;
    const newResults: Array<{ idx: number; ok: boolean; msg: string }> = [];

    for (let i = 0; i < SEED_QUOTATIONS.length; i++) {
      const q = SEED_QUOTATIONS[i];
      try {
        await api.post(`${base}/api/v1/O/${orgId}/hi-quotation/quotations`, {
          region: q.region,
          sumInsured: q.sumInsured,
          currency: q.currency,
          planType: q.planType,
          proposer: q.proposer,
          members: q.members,
          mafAnswers: q.mafAnswers,
          status: 'submitted',
          source: 'seed',
        });
        newResults.push({ idx: i, ok: true, msg: `${q.proposer.firstName} ${q.proposer.lastName} (${q.region})` });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        newResults.push({ idx: i, ok: false, msg: `${q.proposer.firstName} ${q.proposer.lastName}: ${msg}` });
      }
      setProgress(i + 1);
      setResults([...newResults]);
    }

    setSeeding(false);
    setDone(true);
  }, []);

  const successCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Database size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Seed Demo Data</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create 10 sample quotations with diverse profiles across UAE, India, and US regions
          </p>
        </div>
      </div>

      {/* Summary of what will be seeded */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {[
          { label: 'UAE', count: 4, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'India', count: 4, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'US', count: 2, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
          { label: 'Pre-existing', count: 1, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
          { label: 'High BMI', count: 1, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
        ].map((item) => (
          <div key={item.label} className={`rounded-lg p-2 text-center text-xs ${item.color}`}>
            <p className="font-bold text-lg">{item.count}</p>
            <p>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Seed button */}
      {!seeding && !done && (
        <button
          onClick={seedQuotations}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          <Database size={16} />
          <span>Seed 10 Quotations</span>
        </button>
      )}

      {/* Progress */}
      {seeding && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Seeding... {progress} / {SEED_QUOTATIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(progress / SEED_QUOTATIONS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {done && (
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            {successCount > 0 && (
              <span className="inline-flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 size={14} />
                <span>{successCount} created</span>
              </span>
            )}
            {failCount > 0 && (
              <span className="inline-flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle size={14} />
                <span>{failCount} failed</span>
              </span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
            {results.map((r) => (
              <div
                key={r.idx}
                className={`flex items-center space-x-2 py-1 ${r.ok ? 'text-gray-600 dark:text-gray-400' : 'text-red-500'}`}
              >
                {r.ok ? <CheckCircle2 size={12} className="text-green-500 shrink-0" /> : <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                <span>{r.msg}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setDone(false); setResults([]); setProgress(0); }}
            className="text-xs text-blue-500 hover:text-blue-400 underline"
          >
            Seed again
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const HIQuotationHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="hi-quotation"
      moduleName="HI Quotation"
      moduleDescription="Health Insurance Quotation &amp; Application Management"
      moduleIntro="HI Quotation is the health insurance application intake module. It provides region-aware smart application forms that capture applicant details, medical history, and coverage preferences while protecting personally identifiable information through PII tokenization. The module supports multiple regions (India, UAE, US) with region-specific regulatory requirements and medical assessment framework (MAF) questions."
      icon={Heart}
      capabilities={[
        {
          icon: FileText,
          title: 'Smart Application Forms',
          description: 'Region-aware application forms with conditional logic, validation, and auto-save that adapt to regulatory requirements.',
        },
        {
          icon: Globe,
          title: 'Multi-Region Support',
          description: 'Dedicated application flows for India, UAE, and US markets with region-specific fields, currencies, and compliance rules.',
        },
        {
          icon: Lock,
          title: 'PII Protection',
          description: 'All personally identifiable information is tokenized through the PII Vault. Operational systems never store raw personal data.',
        },
        {
          icon: ClipboardList,
          title: 'MAF Questions',
          description: 'Medical Assessment Framework questionnaires that capture health history, pre-existing conditions, and lifestyle factors.',
        },
        {
          icon: Shield,
          title: 'Underwriting Integration',
          description: 'Seamless handoff to UW Workflow and HI Decisioning for automated and manual underwriting evaluation.',
        },
        {
          icon: MapPin,
          title: 'Region-Specific Compliance',
          description: 'Built-in compliance rules for IRDAI (India), CBUAE (UAE), and state-level regulations (US).',
        },
      ]}
      targetUsers={[
        { role: 'Insurance Agents', desc: 'Submit new health insurance applications on behalf of customers.' },
        { role: 'Underwriters', desc: 'Review submitted applications and medical disclosures.' },
        { role: 'Compliance Officers', desc: 'Ensure applications meet regional regulatory requirements.' },
        { role: 'Customers', desc: 'Self-service application submission through the customer portal.' },
      ]}
      lifecycleStages={[
        { label: 'Draft', description: 'Application form is being filled out. Auto-save preserves progress.', color: '#f59e0b' },
        { label: 'Submitted', description: 'Application is submitted for review. PII is tokenized and stored in the vault.', color: '#3b82f6' },
        { label: 'Under Review', description: 'Underwriting team evaluates the application against rules and MAF responses.', color: '#8b5cf6' },
        { label: 'Approved', description: 'Application meets all criteria and is approved for policy issuance.', color: '#10b981' },
        { label: 'Declined', description: 'Application does not meet underwriting criteria. Reason codes provided.', color: '#ef4444' },
        { label: 'Policy Issued', description: 'Insurance policy is generated and delivered to the customer.', color: '#06b6d4' },
      ]}
      recordings={[
        {
          file: 'hi-quotation-overview.mp4',
          title: 'HI Quotation Overview',
          thumbnail: '',
          timestamp: '2026-03-18',
          duration: 120,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Application Form', startMs: 15000 },
            { title: 'Region Selection', startMs: 35000 },
            { title: 'PII Protection', startMs: 60000 },
            { title: 'Submission Flow', startMs: 85000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/hi-quotation/"
      swaggerUrl="/api/hi-quotation/api-docs"
      faqs={[
        { question: 'Which regions are supported?', answer: 'Currently India, UAE, and US. Each region has dedicated application forms with region-specific fields and compliance rules.' },
        { question: 'How is PII protected?', answer: 'All personally identifiable information (name, email, phone, address) is tokenized through the Zorbit PII Vault. Only PII tokens are stored in the quotation database.' },
        { question: 'What happens after submission?', answer: 'The application is routed to the UW Workflow module for underwriting evaluation. HI Decisioning rules are applied automatically.' },
        { question: 'Can applications be saved as drafts?', answer: 'Yes. The smart form auto-saves progress. Users can return to complete the application at any time.' },
      ]}
      resources={[
        { label: 'HI Quotation API (Swagger)', url: 'https://scalatics.com:3117/api', icon: FileText },
        { label: 'PII Vault Integration Guide', url: '/pii-vault', icon: Lock },
        { label: 'UW Workflow Handoff', url: '/uw-workflow', icon: Users },
      ]}
      extraResourceContent={<SeedDemoData />}
    />
  );
};

export default HIQuotationHubPage;

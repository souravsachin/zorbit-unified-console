import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Upload,
  Database,
  Server,
  ArrowRight,
  Lock,
  Unlock,
  UserCheck,
  Globe,
  Building2,
  Fingerprint,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DemoTourPlayer } from '../../components/shared/DemoTourPlayer';
import type { ManifestEntry } from '../../components/shared/DemoTourPlayer';

/* ------------------------------------------------------------------ */
/*  PII Showcase video recording                                       */
/* ------------------------------------------------------------------ */

const PII_RECORDINGS: ManifestEntry[] = [
  {
    file: 'pii-showcase-overview.mp4',
    title: 'PII Showcase — Platform Overview',
    timestamp: '2026-03-14T12:00:00.000Z',
    duration: 188,
    chapters: [
      { title: 'Welcome', startMs: 0 },
      { title: 'Data Upload Simulator', startMs: 12000 },
      { title: 'PII Classification Engine', startMs: 42000 },
      { title: 'Tokenization Demo', startMs: 68000 },
      { title: 'Access Control Matrix', startMs: 115000 },
      { title: 'Architecture Overview', startMs: 145000 },
      { title: 'Summary', startMs: 170000 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */

const SAMPLE_RECORDS = [
  { id: 1, fullName: 'Saurab Mehta', age: 42, gender: 'Male', email: 'saurab.mehta@gmail.com', phone: '+91-98765-43210', address: '12 MG Road, Bangalore 560001', bankAccount: 'HDFC-XXXX-XXXX-4521', ssn: '123-45-6789' },
  { id: 2, fullName: 'Priya Sharma', age: 35, gender: 'Female', email: 'priya.sharma@outlook.com', phone: '+91-87654-32100', address: '45 Park Street, Kolkata 700016', bankAccount: 'SBI-XXXX-XXXX-8832', ssn: '234-56-7890' },
  { id: 3, fullName: 'Rahul Tripathi', age: 29, gender: 'Male', email: 'rahul.t@yahoo.com', phone: '+91-76543-21000', address: '78 Anna Salai, Chennai 600002', bankAccount: 'ICICI-XXXX-XXXX-3345', ssn: '345-67-8901' },
  { id: 4, fullName: 'Anita Desai', age: 51, gender: 'Female', email: 'anita.desai@hotmail.com', phone: '+91-65432-10009', address: '23 Connaught Place, New Delhi 110001', bankAccount: 'AXIS-XXXX-XXXX-6678', ssn: '456-78-9012' },
  { id: 5, fullName: 'Vikram Patel', age: 38, gender: 'Male', email: 'vikram.patel@gmail.com', phone: '+91-54321-09876', address: '56 Marine Drive, Mumbai 400002', bankAccount: 'KOTAK-XXXX-XXXX-9901', ssn: '567-89-0123' },
];

const PII_FIELDS = ['fullName', 'email', 'phone', 'address', 'bankAccount', 'ssn'] as const;
const NON_PII_FIELDS = ['id', 'age', 'gender'] as const;
const ALL_FIELDS = ['id', 'fullName', 'age', 'gender', 'email', 'phone', 'address', 'bankAccount', 'ssn'] as const;

type FieldKey = (typeof ALL_FIELDS)[number];

/* Tokenized replacements */
const TOKENIZED: Record<number, Record<string, string>> = {
  1: { fullName: 'LJQ9', email: 'M2K7', phone: 'R4P1', address: 'W8X3', bankAccount: 'B5N2', ssn: 'H7T6' },
  2: { fullName: 'QA3F', email: 'V9C1', phone: 'K6D8', address: 'Y2E5', bankAccount: 'J4G7', ssn: 'P1S9' },
  3: { fullName: 'X5U2', email: 'N8W4', phone: 'F3Z6', address: 'C7A9', bankAccount: 'T1H3', ssn: 'D6L8' },
  4: { fullName: 'G9R5', email: 'S2M7', phone: 'E4Q1', address: 'U8B3', bankAccount: 'I6V2', ssn: 'O3K9' },
  5: { fullName: 'Z1F4', email: 'A7J6', phone: 'L5P8', address: 'H2W3', bankAccount: 'N9X1', ssn: 'T4C7' },
};

/* Nicknamed replacements */
const NICKNAMED: Record<number, Record<string, string>> = {
  1: { fullName: 'Arjun Nair', email: 'arjun.nair@example.com', phone: '+91-90000-00001', address: '1 Placeholder Rd, City 100001', bankAccount: 'BANK-XXXX-XXXX-0001', ssn: '***-**-0001' },
  2: { fullName: 'Meera Rao', email: 'meera.rao@example.com', phone: '+91-90000-00002', address: '2 Placeholder Rd, City 100002', bankAccount: 'BANK-XXXX-XXXX-0002', ssn: '***-**-0002' },
  3: { fullName: 'Karan Singh', email: 'karan.singh@example.com', phone: '+91-90000-00003', address: '3 Placeholder Rd, City 100003', bankAccount: 'BANK-XXXX-XXXX-0003', ssn: '***-**-0003' },
  4: { fullName: 'Deepa Joshi', email: 'deepa.joshi@example.com', phone: '+91-90000-00004', address: '4 Placeholder Rd, City 100004', bankAccount: 'BANK-XXXX-XXXX-0004', ssn: '***-**-0004' },
  5: { fullName: 'Ravi Kumar', email: 'ravi.kumar@example.com', phone: '+91-90000-00005', address: '5 Placeholder Rd, City 100005', bankAccount: 'BANK-XXXX-XXXX-0005', ssn: '***-**-0005' },
};

const FIELD_LABELS: Record<FieldKey, string> = {
  id: 'ID',
  fullName: 'Full Name',
  age: 'Age',
  gender: 'Gender',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  bankAccount: 'Bank Account',
  ssn: 'SSN',
};

/* Access control matrix */
const ACCESS_MATRIX = [
  { role: 'PII Admin', organization: 'Any', ipRange: 'Internal (10.x.x.x)', viewLevel: 'Full PII' },
  { role: 'Data Analyst', organization: 'Same Org', ipRange: 'Internal', viewLevel: 'Nicknamed' },
  { role: 'External Auditor', organization: 'Partner Org', ipRange: 'Any', viewLevel: 'Tokenized' },
  { role: 'Customer Support', organization: 'Same Org', ipRange: 'Any', viewLevel: 'Nicknamed' },
  { role: 'Public API', organization: 'Any', ipRange: 'External', viewLevel: 'Tokenized' },
];

type ViewMode = 'full' | 'tokenized' | 'nicknamed';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isPII(field: string): boolean {
  return (PII_FIELDS as readonly string[]).includes(field);
}

function getCellValue(record: (typeof SAMPLE_RECORDS)[number], field: FieldKey, mode: ViewMode): string {
  if (!isPII(field)) {
    return String((record as Record<string, unknown>)[field]);
  }
  if (mode === 'full') return String((record as Record<string, unknown>)[field]);
  if (mode === 'tokenized') return TOKENIZED[record.id]?.[field] ?? '----';
  return NICKNAMED[record.id]?.[field] ?? '****';
}

function cellBg(field: string, mode: ViewMode): string {
  if (!isPII(field)) return '';
  if (mode === 'full') return 'bg-red-50 dark:bg-red-950/30';
  if (mode === 'tokenized') return 'bg-blue-50 dark:bg-blue-950/30';
  return 'bg-green-50 dark:bg-green-950/30';
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-l-4 border-indigo-500 pl-4 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function FlowBox({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border-2 ${accent} px-4 py-3 min-w-[120px] bg-white dark:bg-gray-800`}>
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center px-1 text-gray-400 dark:text-gray-500">
      <ArrowRight className="w-5 h-5" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

const PIIShowcasePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('tokenized');
  const [showVideo, setShowVideo] = useState(false);

  const modeMeta: Record<ViewMode, { label: string; border: string; bg: string; icon: React.ElementType }> = {
    full: { label: 'Full PII', border: 'border-red-500', bg: 'bg-red-600 hover:bg-red-700', icon: Unlock },
    tokenized: { label: 'Tokenized', border: 'border-blue-500', bg: 'bg-blue-600 hover:bg-blue-700', icon: Lock },
    nicknamed: { label: 'Nicknamed', border: 'border-green-500', bg: 'bg-green-600 hover:bg-green-700', icon: EyeOff },
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <Fingerprint className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PII Showcase</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Demonstrating Zorbit's PII handling, tokenization, and access control capabilities
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play size={16} />
            {showVideo ? 'Hide' : 'Watch'} Video Tour
            {showVideo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Video Tour (collapsible) */}
      {showVideo && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <DemoTourPlayer
            recordings={PII_RECORDINGS}
            baseUrl="/demos/pii-showcase/"
            defaultLayout="podcast"
            title="PII Showcase — Video Tour"
          />
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Section A — Data Upload Simulator                            */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Data Upload Simulator" subtitle="Sample dataset representing incoming records with mixed PII and non-PII fields" />

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {ALL_FIELDS.map((f) => (
                  <th key={f} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {FIELD_LABELS[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_RECORDS.map((rec) => (
                <tr key={rec.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  {ALL_FIELDS.map((f) => (
                    <td key={f} className={`px-3 py-2 whitespace-nowrap ${isPII(f) ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {String((rec as Record<string, unknown>)[f])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" /> 5 records loaded &mdash; PII fields highlighted in red
        </p>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Section B — PII Classification Panel                         */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-gray-50 dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="PII Classification Engine" subtitle="Automatic detection and classification of personally identifiable information" />

        {/* Badges */}
        <div className="flex flex-wrap gap-3 mb-8">
          {PII_FIELDS.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <Shield className="w-3 h-3" /> {FIELD_LABELS[f]}
            </span>
          ))}
          {NON_PII_FIELDS.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <Eye className="w-3 h-3" /> {FIELD_LABELS[f]}
            </span>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="flex flex-wrap items-center gap-1 justify-center">
          <FlowBox icon={Upload} label="Upload" accent="border-gray-400 text-gray-600 dark:text-gray-300" />
          <FlowArrow />
          <FlowBox icon={Shield} label="Classification Engine" accent="border-indigo-500 text-indigo-600 dark:text-indigo-400" />
          <FlowArrow />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <FlowArrow />
              <FlowBox icon={Lock} label="PII Fields" accent="border-red-500 text-red-600 dark:text-red-400" />
              <FlowArrow />
              <FlowBox icon={Database} label="PII Vault DB (Separate Host)" accent="border-red-500 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-center gap-1">
              <FlowArrow />
              <FlowBox icon={Fingerprint} label="Non-PII + Tokens" accent="border-green-500 text-green-600 dark:text-green-400" />
              <FlowArrow />
              <FlowBox icon={Server} label="Operational DB" accent="border-green-500 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Section C — Tokenization Demo                                */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Tokenization Demo" subtitle="Toggle between view modes to see how PII is protected at different access levels" />

        {/* View mode toggle */}
        <div className="flex gap-2 mb-6">
          {(['full', 'tokenized', 'nicknamed'] as ViewMode[]).map((m) => {
            const meta = modeMeta[m];
            const ModeIcon = meta.icon;
            const active = viewMode === m;
            return (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active ? `${meta.bg} text-white shadow-md` : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <ModeIcon className="w-4 h-4" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Data table */}
        <div className={`overflow-x-auto rounded-lg border-2 ${modeMeta[viewMode].border}`}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {ALL_FIELDS.map((f) => (
                  <th key={f} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {FIELD_LABELS[f]}
                    {isPII(f) && <Lock className="inline w-3 h-3 ml-1 text-gray-400" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_RECORDS.map((rec) => (
                <tr key={rec.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  {ALL_FIELDS.map((f) => (
                    <td key={f} className={`px-3 py-2 whitespace-nowrap font-mono text-xs ${cellBg(f, viewMode)} ${isPII(f) ? '' : 'text-gray-900 dark:text-gray-100'}`}>
                      {getCellValue(rec, f, viewMode)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 inline-block" /> Full PII — raw sensitive data visible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/40 inline-block" /> Tokenized — opaque 4-char tokens</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40 inline-block" /> Nicknamed — realistic fake data</span>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Section D — Access Control Matrix                            */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-gray-50 dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Access Control Matrix" subtitle="Role-based PII visibility governed by organization scope, network location, and privilege level" />

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Role</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Organization</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">IP Range</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">View Level</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_MATRIX.map((row) => {
                const levelColor =
                  row.viewLevel === 'Full PII'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : row.viewLevel === 'Tokenized'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
                const RoleIcon =
                  row.role === 'PII Admin' ? Shield
                    : row.role === 'External Auditor' ? Globe
                    : row.role === 'Public API' ? Globe
                    : row.role === 'Data Analyst' ? Eye
                    : UserCheck;
                return (
                  <tr key={row.role} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <RoleIcon className="w-4 h-4 text-gray-400" /> {row.role}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {row.organization}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.ipRange}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${levelColor}`}>{row.viewLevel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Section E — Architecture Diagram                             */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Architecture Overview" subtitle="PII never touches the operational database — it is isolated in a dedicated vault on a separate host" />

        <div className="flex flex-col lg:flex-row items-stretch gap-6 justify-center">
          {/* Upload Server */}
          <div className="flex-1 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 p-5 flex flex-col items-center text-center">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Upload Server</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receives raw data, runs classification engine, splits PII from non-PII</p>
            <div className="mt-auto pt-4 w-full space-y-1">
              <div className="text-[10px] font-mono bg-white dark:bg-gray-800 rounded px-2 py-1 text-gray-500">POST /api/v1/O/&#123;org&#125;/upload</div>
            </div>
          </div>

          {/* Arrows */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-red-500">
              <span className="text-[10px] font-semibold">PII data</span>
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-green-500">
              <span className="text-[10px] font-semibold">Tokens + non-PII</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* PII Vault */}
          <div className="flex-1 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-5 flex flex-col items-center text-center">
            <Lock className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">PII Vault</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dedicated isolated host. Stores encrypted PII, returns opaque tokens. Access-controlled and audit-logged.</p>
            <div className="mt-auto pt-4 w-full space-y-1">
              <div className="text-[10px] font-mono bg-white dark:bg-gray-800 rounded px-2 py-1 text-red-400">Separate network zone</div>
              <div className="text-[10px] font-mono bg-white dark:bg-gray-800 rounded px-2 py-1 text-red-400">Encrypted at rest + in transit</div>
            </div>
          </div>

          {/* Operational DB */}
          <div className="flex-1 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-5 flex flex-col items-center text-center">
            <Database className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Operational DB</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Stores non-PII fields and PII tokens only. No raw sensitive data ever resides here.</p>
            <div className="mt-auto pt-4 w-full space-y-1">
              <div className="text-[10px] font-mono bg-white dark:bg-gray-800 rounded px-2 py-1 text-green-500">email_token: PII-92AF</div>
              <div className="text-[10px] font-mono bg-white dark:bg-gray-800 rounded px-2 py-1 text-green-500">ssn_token: PII-51AA</div>
            </div>
          </div>
        </div>

        {/* Key takeaway */}
        <div className="mt-6 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Key Principle</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              PII never touches the operational database. The PII Vault runs on a separate host with its own encryption keys,
              network isolation, and access audit trail. Operational systems only ever see opaque tokens (e.g. PII-92AF).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PIIShowcasePage;

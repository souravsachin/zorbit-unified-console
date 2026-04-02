import React from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Shield,
  Key,
  FileCheck,
  Upload,
  Settings,
  Eye,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Static dashboard data                                              */
/* ------------------------------------------------------------------ */

const STATS = [
  { label: 'Total Records Ingested', value: '1,247', icon: Database, accent: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
  { label: 'PII Fields Detected', value: '8,432', icon: Shield, accent: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
  { label: 'Tokens Generated', value: '8,432', icon: Key, accent: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' },
  { label: 'Active PII Policies', value: '12', icon: FileCheck, accent: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
];

const RECENT_UPLOADS = [
  { file: 'customers_q1_2026.csv', records: 342, piiFields: '2,394', status: 'Processed' as const, uploadedBy: 'Sourav Sachin', date: 'Mar 14, 2026' },
  { file: 'employees_march.xlsx', records: 156, piiFields: '780', status: 'Processed' as const, uploadedBy: 'Ruth Anderson', date: 'Mar 13, 2026' },
  { file: 'vendor_contacts.csv', records: 89, piiFields: '356', status: 'Processing' as const, uploadedBy: 'Priya Sharma', date: 'Mar 13, 2026' },
  { file: 'claims_batch_47.csv', records: 523, piiFields: '3,661', status: 'Processed' as const, uploadedBy: 'James Chen', date: 'Mar 12, 2026' },
  { file: 'patient_records.csv', records: 137, piiFields: '1,241', status: 'Failed' as const, uploadedBy: 'Anita Desai', date: 'Mar 11, 2026' },
];

const PII_DISTRIBUTION = [
  { field: 'Full Name', tokens: 1247, pct: 100 },
  { field: 'Email', tokens: 1198, pct: 96 },
  { field: 'Phone', tokens: 1102, pct: 88 },
  { field: 'Address', tokens: 987, pct: 79 },
  { field: 'Bank Account', tokens: 834, pct: 67 },
  { field: 'SSN', tokens: 523, pct: 42 },
  { field: 'Date of Birth', tokens: 412, pct: 33 },
  { field: 'Medical ID', tokens: 137, pct: 11 },
];

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

function StatusBadge({ status }: { status: 'Processed' | 'Processing' | 'Failed' }) {
  if (status === 'Processed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
        <CheckCircle2 className="w-3 h-3" /> {status}
      </span>
    );
  }
  if (status === 'Processing') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
        <Loader2 className="w-3 h-3 animate-spin" /> {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
      <XCircle className="w-3 h-3" /> {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const PIIDashboardPage: React.FC = () => {
  const { orgId } = useAuth();

  return (
    <div className="space-y-10 pb-12">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PII Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of PII ingestion, tokenization, and access policies
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Stats Cards                                                  */}
      {/* ------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4"
            >
              <div className={`p-2.5 rounded-lg ${s.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Recent Uploads Table                                         */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Recent Uploads" subtitle="Latest file ingestion jobs and their processing status" />

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">File</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Records</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">PII Fields</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Uploaded By</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_UPLOADS.map((row) => (
                <tr
                  key={row.file}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-gray-400 shrink-0" />
                    {row.file}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{row.records.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{row.piiFields}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.uploadedBy}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {row.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  PII Field Distribution                                       */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="PII Field Distribution" subtitle="Breakdown of tokenized fields across all ingested records" />

        <div className="space-y-3">
          {PII_DISTRIBUTION.map((d) => (
            <div key={d.field} className="flex items-center gap-4">
              <span className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{d.field}</span>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-32 text-xs text-gray-500 dark:text-gray-400 text-right shrink-0">
                {d.tokens.toLocaleString()} tokens ({d.pct}%)
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Quick Actions                                                */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-gray-50 dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader title="Quick Actions" subtitle="Navigate to common PII management tasks" />

        <div className="flex flex-wrap gap-4">
          <Link
            to={`/O/${orgId}/pii-showcase/upload`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload New File <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={`/O/${orgId}/pii-showcase/config`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" /> Configure PII Policies <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={`/O/${orgId}/pii-showcase`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" /> View Showcase <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PIIDashboardPage;

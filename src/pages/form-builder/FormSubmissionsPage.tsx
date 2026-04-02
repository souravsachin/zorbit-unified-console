import React, { useState, useEffect } from 'react';
import { Inbox, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE = '/api/form-builder';

interface Submission {
  hashId: string;
  formDefinitionId: string;
  formVersion: number;
  status: string;
  currentStep: number;
  totalSteps: number;
  submittedBy: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Clock,
  in_progress: AlertCircle,
  submitted: CheckCircle,
  validated: CheckCircle,
  rejected: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-yellow-500',
  in_progress: 'text-blue-500',
  submitted: 'text-green-500',
  validated: 'text-emerald-600',
  rejected: 'text-red-500',
};

const FormSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zorbit_token');
    fetch(`${API_BASE}/api/v1/O/O-OZPY/form-builder/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSubmissions(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
          <Inbox className="w-7 h-7 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Submissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and manage all form submissions across your organization
          </p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : submissions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Submitted By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {submissions.map(s => {
                const Icon = STATUS_ICONS[s.status] || Clock;
                const color = STATUS_COLORS[s.status] || 'text-gray-400';
                return (
                  <tr key={s.hashId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{s.hashId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="capitalize text-gray-700 dark:text-gray-300">{s.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full max-w-[100px]">
                          <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${(s.currentStep / s.totalSteps) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{s.currentStep}/{s.totalSteps}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.submittedBy}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No submissions yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Submissions will appear here when users fill out your forms</p>
        </div>
      )}
    </div>
  );
};

export default FormSubmissionsPage;

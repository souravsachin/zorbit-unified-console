import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Eye, Copy, Clock, CheckCircle, Archive, Pencil } from 'lucide-react';

const API_BASE = '/api/form-builder';

interface FormTemplate {
  hashId: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  isGlobal?: boolean;
  createdAt: string;
}

interface FormDefinition {
  hashId: string;
  name: string;
  slug: string;
  description?: string;
  version: number;
  status: string;
  formType: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const FormTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zorbit_token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/api/v1/G/form-builder/templates`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/v1/O/O-OZPY/form-builder/forms`, { headers }).then(r => r.ok ? r.json() : { forms: [] }),
    ])
      .then(([tpls, frms]) => {
        // Templates API returns a plain array
        setTemplates(Array.isArray(tpls) ? tpls : tpls.data || []);
        // Forms API returns { forms: [...], total: N }
        if (frms && frms.forms && Array.isArray(frms.forms)) {
          setForms(frms.forms);
        } else if (Array.isArray(frms)) {
          setForms(frms);
        } else {
          setForms(frms.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pre-built form templates and your organization's custom forms
          </p>
        </div>
        <div className="ml-auto">
          <a href={window.location.pathname.replace('templates', 'create')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Create Form
          </a>
        </div>
      </div>

      {/* Global Templates */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))
          ) : templates.length > 0 ? templates.map(t => (
            <div key={t.hashId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Global</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.description || 'No description'}</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                  <Eye size={12} /> Preview
                </button>
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  <Copy size={12} /> Use Template
                </button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-400 col-span-3">No templates available. Connect to the Form Builder service.</p>
          )}
        </div>
      </section>

      {/* Org Forms */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organization Forms</h2>
        {loading ? (
          <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ) : forms.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Form Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Version</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Updated</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {forms.map(f => (
                  <tr
                    key={f.hashId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/form-builder/edit/${f.slug}`)}
                  >
                    <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{f.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{f.formType}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">v{f.version}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status] || STATUS_COLORS.draft}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{new Date(f.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/form-builder/edit/${f.slug}`); }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No forms created yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start from a template or create a new form</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default FormTemplatesPage;

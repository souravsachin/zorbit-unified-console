import React from 'react';
import { FilePlus, ArrowLeft } from 'lucide-react';

const FormCreatePage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <a href={window.location.pathname.replace('create', 'templates')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </a>
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
          <FilePlus className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Form</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design a new form with drag-and-drop builder powered by formio.js
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Form Name *</label>
            <input type="text" placeholder="e.g., Health Insurance Application Form" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={3} placeholder="Brief description of this form's purpose" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Form Type</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="wizard">Multi-Step Wizard</option>
                <option value="simple">Simple Form</option>
                <option value="survey">Survey</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start From</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="blank">Blank Form</option>
                <option value="hi-application-dubai">Template: HI Application (Dubai)</option>
                <option value="hi-application-india">Template: HI Application (India)</option>
                <option value="contact-form">Template: Contact Form</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 text-center">
              <FilePlus className="h-12 w-12 mx-auto mb-3 text-indigo-400" />
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Drag-and-Drop Form Builder</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">The visual form builder will load here once you create the form. Add fields, set conditions, configure validation — all without code.</p>
              <button className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                Create & Open Builder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormCreatePage;

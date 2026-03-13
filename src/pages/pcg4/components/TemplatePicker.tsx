import React, { useEffect, useState } from 'react';
import { X, FileText, Layers, Stethoscope } from 'lucide-react';
import type { PCG4Configuration } from '../../../api/pcg4Api';
import { getTemplates, cloneConfiguration } from '../../../api/pcg4Api';
import { useAuth } from '../../../hooks/useAuth';

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onCloned: (newId: string) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ open, onClose, onCloned }) => {
  const { orgId } = useAuth();
  const [templates, setTemplates] = useState<PCG4Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getTemplates(orgId)
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, [open, orgId]);

  const handleClone = async (template: PCG4Configuration) => {
    setCloning(template.id);
    try {
      const result = await cloneConfiguration(orgId, template.id);
      onCloned(result.id);
    } catch {
      // error handled silently — mock mode
    } finally {
      setCloning(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">Create from Template</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select an approved or published configuration to clone
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-4 text-gray-400" size={40} />
              <p className="text-gray-500 dark:text-gray-400">
                No approved or published templates available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  disabled={cloning !== null}
                  onClick={() => handleClone(tpl)}
                  className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-500 hover:shadow-md transition-all disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">
                      {tpl.insurerName} &mdash; {tpl.productName}
                    </h3>
                    {cloning === tpl.id && (
                      <span className="text-xs text-primary-600">Cloning...</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Layers size={14} />
                      <span>{tpl.planCount} plans</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Stethoscope size={14} />
                      <span>{tpl.encounterCount} encounters</span>
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tpl.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {tpl.status === 'published' ? 'Published' : 'Approved'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePicker;

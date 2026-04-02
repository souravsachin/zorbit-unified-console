import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Edit3,
  Copy,
  Trash2,
  LayoutGrid,
  FileUp,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Card from '../../components/shared/Card';
import { useAuth } from '../../hooks/useAuth';
import type { PCG4Configuration, PCG4Stats } from '../../api/pcg4Api';
import { getConfigurations, deleteConfiguration, computeStats } from '../../api/pcg4Api';
import TemplatePicker from './components/TemplatePicker';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

// ---------------------------------------------------------------------------
// Status badge styles
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  in_review: {
    label: 'In Review',
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  published: {
    label: 'Published',
    classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  archived: {
    label: 'Archived',
    classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.archived;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PCG4DashboardPage: React.FC = () => {
  const { orgId } = useAuth();
  const navigate = useNavigate();

  const [configs, setConfigs] = useState<PCG4Configuration[]>([]);
  const [stats, setStats] = useState<PCG4Stats>({ total: 0, draft: 0, inReview: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PCG4Configuration | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---------- Data loading ----------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConfigurations(orgId);
      const sorted = [...data].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setConfigs(sorted);
      setStats(computeStats(sorted));
    } catch {
      setError('Failed to load configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- Handlers ----------

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConfiguration(orgId, deleteTarget.hashId);
      setConfigs((prev) => {
        const next = prev.filter((c) => c.hashId !== deleteTarget.hashId);
        setStats(computeStats(next));
        return next;
      });
      setDeleteTarget(null);
    } catch {
      // keep dialog open on failure
    } finally {
      setDeleting(false);
    }
  };

  const handleCloned = (newId: string) => {
    setTemplatePickerOpen(false);
    navigate(`/O/${orgId}/app/pcg4/configurations/${newId}`);
  };

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Configurator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure healthcare insurance products for any market
          </p>
        </div>
        <button
          onClick={() => navigate(`/O/${orgId}/app/pcg4/configurations/new`)}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          New Configuration
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={FileText} label="Total Configurations" value={loading ? '...' : stats.total} />
        <Card
          icon={Edit3}
          label="Draft"
          value={loading ? '...' : stats.draft}
          color="text-amber-600"
        />
        <Card
          icon={RefreshCw}
          label="In Review"
          value={loading ? '...' : stats.inReview}
          color="text-blue-600"
        />
        <Card
          icon={FileText}
          label="Published"
          value={loading ? '...' : stats.published}
          color="text-emerald-600"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <AlertCircle size={20} />
          <span className="text-sm flex-1">{error}</span>
          <button
            onClick={loadData}
            className="text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content grid: Table + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Configurations Table */}
        <div className="xl:col-span-3 card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold">Configurations</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {configs.length} total
            </span>
          </div>

          {loading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-gray-400" size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2">No configurations yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Create your first product configuration to get started.
              </p>
              <button
                onClick={() => navigate(`/O/${orgId}/app/pcg4/configurations/new`)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Create First Configuration
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Plans</th>
                    <th className="px-4 py-3">Last Modified</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {configs.map((cfg) => (
                    <tr
                      key={cfg.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {cfg.insurerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {cfg.productName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={cfg.status} />
                      </td>
                      <td className="px-4 py-3 text-center">{cfg.planCount}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(cfg.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            title="Edit"
                            onClick={() => navigate(`/O/${orgId}/app/pcg4/configurations/${cfg.hashId}`)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-primary-600"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            title="Clone"
                            onClick={() => {
                              // Quick clone without template picker
                              navigate(`/O/${orgId}/app/pcg4/configurations/${cfg.hashId}?clone=true`);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-blue-600"
                          >
                            <Copy size={16} />
                          </button>
                          {cfg.status === 'draft' && (
                            <button
                              title="Delete"
                              onClick={() => setDeleteTarget(cfg)}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setTemplatePickerOpen(true)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <LayoutGrid size={18} className="text-primary-600 flex-shrink-0" />
                <div>
                  <div className="font-medium">Create from Template</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Clone an existing configuration
                  </div>
                </div>
              </button>

              <button
                disabled
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-left border border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed"
              >
                <FileUp size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium">Import Configuration</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Coming soon
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate(`/O/${orgId}/app/pcg4/encounters`)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <BookOpen size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-medium">View Taxonomy</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Manage taxonomy settings
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onCloned={handleCloned}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        configName={
          deleteTarget ? `${deleteTarget.insurerName} - ${deleteTarget.productName}` : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default PCG4DashboardPage;

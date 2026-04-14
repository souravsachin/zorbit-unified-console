import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, AlertCircle } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../hooks/useAuth';
import { piiVaultService, PiiAuditEntry } from '../../services/piiVault';

const columns: Column<PiiAuditEntry>[] = [
  {
    key: 'token',
    header: 'PII Token',
    render: (e) => (
      <code className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono">
        {e.token}
      </code>
    ),
  },
  {
    key: 'fieldType',
    header: 'Data Type',
    render: (e) => (
      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">
        {e.fieldType || '-'}
      </code>
    ),
  },
  { key: 'action', header: 'Last Action' },
  { key: 'accessedBy', header: 'Accessed By' },
  {
    key: 'accessedAt',
    header: 'Timestamp',
    render: (e) =>
      e.accessedAt ? new Date(e.accessedAt).toLocaleString() : '-',
  },
  {
    key: 'reason',
    header: 'Reason',
    render: (e) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{e.reason || '-'}</span>
    ),
  },
];

const PiiTokenRegistryPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<PiiAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await piiVaultService.getAuditLog(orgId, { limit: 100 });
      const data = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setEntries(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403 || status === 401) {
        setError('admin');
      } else {
        setError('unavailable');
        toast('Failed to load token registry', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  if (error === 'admin') {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Token Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all PII tokens registered in this organisation.
          </p>
        </div>
        <div className="card p-8 flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield size={28} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Admin Access Required
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Token Registry requires admin access. Contact your platform administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'unavailable') {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Token Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all PII tokens registered in this organisation.
          </p>
        </div>
        <div className="card p-8 flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
              Service Unavailable
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The PII Vault service could not be reached. Please try again later.
            </p>
          </div>
          <button onClick={fetchData} className="btn-primary flex items-center gap-2">
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Token Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            Recent PII token access events for your organisation. Raw PII values are never shown.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-3">
          <Shield size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This registry shows the most recent 100 token access events. Each row represents a
            tokenise, detokenise, or lookup operation. Token values shown here are opaque — they
            carry no PII themselves.
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No token access events recorded yet"
      />
    </div>
  );
};

export default PiiTokenRegistryPage;

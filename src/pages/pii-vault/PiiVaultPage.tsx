import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { piiVaultService, PiiAuditEntry } from '../../services/piiVault';

const PAGE_SIZE = 20;

const columns: Column<PiiAuditEntry>[] = [
  { key: 'token', header: 'PII Token', render: (e) => <code className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 px-2 py-0.5 rounded">{e.token}</code> },
  { key: 'fieldType', header: 'Field Type', render: (e) => <StatusBadge label={e.fieldType} variant="info" /> },
  { key: 'action', header: 'Action' },
  { key: 'accessedBy', header: 'Accessed By' },
  { key: 'reason', header: 'Reason' },
  { key: 'accessedAt', header: 'Accessed At', render: (e) => new Date(e.accessedAt).toLocaleString() },
];

const PiiVaultPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<PiiAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await piiVaultService.getAuditLog(orgId, { page, limit: PAGE_SIZE });
        const d = res.data;
        if (Array.isArray(d)) {
          setEntries(d);
          setTotal(d.length);
        } else {
          setEntries(d.data || []);
          setTotal(d.total || 0);
        }
      } catch {
        toast('Failed to load PII vault audit log', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">PII Vault</h1>
        <p className="text-sm text-gray-500 mt-1">Audit view only. Raw PII values are never displayed.</p>
      </div>

      <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This page shows PII token access audit logs. All sensitive data is tokenized and stored in the PII Vault.
          Operational systems only see tokens (e.g., PII-92AF).
        </p>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No PII audit entries found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default PiiVaultPage;

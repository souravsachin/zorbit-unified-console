import React, { useState } from 'react';
import { Search, Shield } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { API_CONFIG } from '../../config';
import api from '../../services/api';

interface PiiAccessEntry {
  hashId: string;
  piiTokenId: string;
  accessedBy: string;
  action: string;
  ipAddress: string | null;
  createdAt: string;
}

const columns: Column<PiiAccessEntry>[] = [
  { key: 'hashId', header: 'Log ID', render: (e) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{e.hashId}</code> },
  { key: 'piiTokenId', header: 'PII Token', render: (e) => <code className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 px-2 py-0.5 rounded">{e.piiTokenId}</code> },
  { key: 'action', header: 'Action' },
  { key: 'accessedBy', header: 'Accessed By' },
  { key: 'ipAddress', header: 'IP Address', render: (e) => <span className="text-xs text-gray-500">{e.ipAddress || '-'}</span> },
  { key: 'createdAt', header: 'Timestamp', render: (e) => new Date(e.createdAt).toLocaleString() },
];

const PiiVaultPage: React.FC = () => {
  const { toast } = useToast();
  const [tokenId, setTokenId] = useState('');
  const [entries, setEntries] = useState<PiiAccessEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!tokenId.trim()) {
      toast('Please enter a PII token ID', 'error');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get<PiiAccessEntry[]>(
        `${API_CONFIG.PII_VAULT_URL}/api/v1/G/pii/tokens/${tokenId.trim()}/audit`,
      );
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load audit log for this token', 'error');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">PII Vault - Token Registry</h1>
        <p className="text-sm text-gray-500 mt-1">Look up access audit logs for PII tokens. Raw PII values are never displayed.</p>
      </div>

      <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-3">
          <Shield size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            All sensitive data is tokenized and stored in the PII Vault.
            Operational systems only see tokens (e.g., PII-92AF).
            Enter a token ID below to view its access audit trail.
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center space-x-3">
          <input
            placeholder="Enter PII Token ID (e.g., PII-92AF)"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Search size={16} />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>

      {searched && (
        <DataTable
          columns={columns}
          data={entries}
          loading={loading}
          emptyMessage="No audit entries found for this token"
        />
      )}
    </div>
  );
};

export default PiiVaultPage;

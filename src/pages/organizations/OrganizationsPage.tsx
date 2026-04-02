import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { identityService, Organization } from '../../services/identity';

const ORG_TYPES = [
  'Insurance Company',
  'Cedent',
  'Broker',
  'Reinsurer',
  'Third Party Administrator (TPA)',
  'Regulator',
  'Healthcare Provider',
] as const;

const columns: Column<Organization>[] = [
  { key: 'id', header: 'Hash ID', render: (o) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{o.hashId || o.id}</code> },
  { key: 'name', header: 'Name' },
  { key: 'orgType', header: 'Type', render: (o) => o.orgType || <span className="text-gray-400">—</span> },
  { key: 'status', header: 'Status', render: (o) => <StatusBadge label={o.status || 'active'} /> },
  { key: 'createdAt', header: 'Created', render: (o) => new Date(o.createdAt).toLocaleDateString() },
];

const OrganizationsPage: React.FC = () => {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', orgType: '' });
  const [creating, setCreating] = useState(false);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const res = await identityService.getOrganizations();
      setOrgs(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load organizations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrgs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await identityService.createOrganization(form);
      toast('Organization created', 'success');
      setShowCreate(false);
      setForm({ name: '', orgType: '' });
      loadOrgs();
    } catch {
      toast('Failed to create organization', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Create Organization</span>
        </button>
      </div>

      <DataTable columns={columns} data={orgs} loading={loading} emptyMessage="No organizations found" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Organization">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization Type <span className="text-red-500">*</span></label>
            <select value={form.orgType} onChange={(e) => setForm({ ...form, orgType: e.target.value })} className="input-field" required>
              <option value="">Select type</option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationsPage;

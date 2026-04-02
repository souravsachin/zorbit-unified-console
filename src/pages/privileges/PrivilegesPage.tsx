import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { authorizationService, Privilege } from '../../services/authorization';

const columns: Column<Privilege>[] = [
  { key: 'id', header: 'Hash ID', render: (p) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{(p as unknown as { hashId?: string }).hashId || p.id}</code> },
  { key: 'name', header: 'Name' },
  { key: 'resource', header: 'Resource' },
  { key: 'action', header: 'Action' },
];

const PrivilegesPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', resource: '', action: '' });
  const [creating, setCreating] = useState(false);

  const loadPrivileges = async () => {
    setLoading(true);
    try {
      const res = await authorizationService.getPrivileges(orgId);
      setPrivileges(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load privileges', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPrivileges(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await authorizationService.createPrivilege(orgId, form);
      toast('Privilege created', 'success');
      setShowCreate(false);
      setForm({ name: '', resource: '', action: '' });
      loadPrivileges();
    } catch {
      toast('Failed to create privilege', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Privileges</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Create Privilege</span>
        </button>
      </div>

      <DataTable columns={columns} data={privileges} loading={loading} emptyMessage="No privileges found" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Privilege">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="users.view" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resource</label>
            <input value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })} className="input-field" placeholder="users" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="input-field" placeholder="view" required />
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

export default PrivilegesPage;

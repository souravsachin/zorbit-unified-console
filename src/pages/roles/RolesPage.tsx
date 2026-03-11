import React, { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { authorizationService, Role } from '../../services/authorization';

const RolesPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await authorizationService.getRoles(orgId);
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await authorizationService.createRole(orgId, form);
      toast('Role created', 'success');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      loadRoles();
    } catch {
      toast('Failed to create role', 'error');
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Role>[] = [
    { key: 'id', header: 'Hash ID', render: (r) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.id}</code> },
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description' },
    {
      key: 'privileges',
      header: 'Privileges',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setExpandedRole(expandedRole === r.id ? null : r.id); }}
          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
        >
          {expandedRole === r.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>{r.privileges?.length || 0} privileges</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Privileges</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Create Role</span>
        </button>
      </div>

      <DataTable columns={columns} data={roles} loading={loading} emptyMessage="No roles found" />

      {expandedRole && (
        <div className="card p-4">
          <h3 className="font-medium mb-2">Privileges for role: {roles.find((r) => r.id === expandedRole)?.name}</h3>
          <div className="flex flex-wrap gap-2">
            {roles
              .find((r) => r.id === expandedRole)
              ?.privileges?.map((p, i) => (
                <span key={i} className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs">
                  {p}
                </span>
              )) || <span className="text-gray-500 text-sm">No privileges assigned</span>}
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Role">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
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

export default RolesPage;

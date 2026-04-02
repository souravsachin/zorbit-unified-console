import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { identityService, User } from '../../services/identity';

const UsersPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', displayName: '', password: '' });
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await identityService.getUsers(orgId);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await identityService.createUser(orgId, form);
      toast('User created', 'success');
      setShowCreate(false);
      setForm({ email: '', displayName: '', password: '' });
      loadUsers();
    } catch {
      toast('Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user: User) => {
    const userId = user.hashId || user.id;
    if (!confirm(`Delete user "${user.displayName}" (${userId})?`)) return;
    try {
      await identityService.deleteUser(orgId, userId);
      toast('User deleted', 'success');
      loadUsers();
    } catch {
      toast('Failed to delete user', 'error');
    }
  };

  const columns: Column<User>[] = [
    { key: 'hashId', header: 'Hash ID', render: (u) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{u.hashId || u.id}</code> },
    { key: 'displayName', header: 'Display Name' },
    { key: 'organizationHashId', header: 'Organization', render: (u) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{u.organizationHashId || u.organizationId || '-'}</code> },
    { key: 'role', header: 'Role', render: (u) => <span className="text-sm">{u.role || '-'}</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge label={u.status || 'active'} /> },
    { key: 'createdAt', header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'actions' as keyof User,
      header: 'Actions',
      render: (u) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="Delete user"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Create User</span>
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required />
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

export default UsersPage;

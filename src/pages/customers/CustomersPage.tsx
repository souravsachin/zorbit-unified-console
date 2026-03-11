import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { customerService, Customer } from '../../services/customer';

const columns: Column<Customer>[] = [
  { key: 'id', header: 'Hash ID', render: (c) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{c.id}</code> },
  { key: 'displayName', header: 'Display Name' },
  { key: 'emailToken', header: 'Email (PII Token)', render: (c) => <span className="text-xs font-mono text-amber-600">{c.emailToken || 'N/A'}</span> },
  { key: 'phoneToken', header: 'Phone (PII Token)', render: (c) => <span className="text-xs font-mono text-amber-600">{c.phoneToken || 'N/A'}</span> },
  { key: 'status', header: 'Status', render: (c) => <StatusBadge label={c.status || 'active'} /> },
  { key: 'createdAt', header: 'Created', render: (c) => new Date(c.createdAt).toLocaleDateString() },
];

const CustomersPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers(orgId);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await customerService.createCustomer(orgId, form);
      toast('Customer created', 'success');
      setShowCreate(false);
      setForm({ displayName: '', email: '', phone: '' });
      loadCustomers();
    } catch {
      toast('Failed to create customer', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Create Customer</span>
        </button>
      </div>

      <DataTable columns={columns} data={customers} loading={loading} emptyMessage="No customers found" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Customer">
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
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1234567890" />
          </div>
          <p className="text-xs text-gray-500">Email and phone will be tokenized via PII Vault. Only PII tokens will be stored.</p>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;

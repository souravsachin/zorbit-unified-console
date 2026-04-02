import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { navigationService, RouteRegistration } from '../../services/navigation';

const columns: Column<RouteRegistration>[] = [
  { key: 'id', header: 'Hash ID', render: (r) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{(r as unknown as { hashId?: string }).hashId || r.id}</code> },
  { key: 'path', header: 'Path' },
  { key: 'service', header: 'Service' },
  { key: 'method', header: 'Method' },
];

const RoutesPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ path: '', service: '', method: 'GET' });
  const [creating, setCreating] = useState(false);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const res = await navigationService.getRoutes(orgId);
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load routes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoutes(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await navigationService.registerRoute(orgId, form);
      toast('Route registered', 'success');
      setShowCreate(false);
      setForm({ path: '', service: '', method: 'GET' });
      loadRoutes();
    } catch {
      toast('Failed to register route', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Route Registration</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Register Route</span>
        </button>
      </div>

      <DataTable columns={columns} data={routes} loading={loading} emptyMessage="No routes registered" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Register Route">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Path</label>
            <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} className="input-field" placeholder="/api/v1/O/:orgId/customers" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="input-field" placeholder="sample-customer-service" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input-field">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Register'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoutesPage;

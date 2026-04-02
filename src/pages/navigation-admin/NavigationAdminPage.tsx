import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight, Trash2, Edit } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { navigationService, MenuItem } from '../../services/navigation';

const NavigationAdminPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ label: '', route: '', icon: '', sortOrder: 0, section: '', parentHashId: '', privilegeCode: '' });
  const [creating, setCreating] = useState(false);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await navigationService.getMenus(orgId);
      setMenus(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load navigation menus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMenus(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await navigationService.createMenuItem(orgId, {
        label: form.label,
        route: form.route || undefined,
        icon: form.icon || undefined,
        sortOrder: form.sortOrder,
        section: form.section || undefined,
        parentHashId: form.parentHashId || undefined,
        privilegeCode: form.privilegeCode || undefined,
      } as Partial<MenuItem>);
      toast('Menu item created', 'success');
      setShowCreate(false);
      setForm({ label: '', route: '', icon: '', sortOrder: 0, section: '', parentHashId: '', privilegeCode: '' });
      loadMenus();
    } catch {
      toast('Failed to create menu item', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await navigationService.deleteMenuItem(orgId, menuId);
      toast('Menu item deleted', 'success');
      loadMenus();
    } catch {
      toast('Failed to delete menu item', 'error');
    }
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => (
    <div key={item.id}>
      <div
        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center space-x-3">
          <ChevronRight size={16} className="text-gray-400" />
          <span className="font-medium text-sm">{item.label}</span>
          <span className="text-xs text-gray-400">{item.route}</span>
          {item.icon && <span className="text-xs text-gray-400">({item.icon})</span>}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Edit">
            <Edit size={14} className="text-gray-500" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" title="Delete">
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>
      {item.children?.map((child) => renderMenuItem(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Navigation Management</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Add Menu Item</span>
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : menus.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No menu items configured</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {menus.map((item) => renderMenuItem(item))}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Menu Item">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Route</label>
            <input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="input-field" placeholder="/customers" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icon (Lucide name)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input-field" placeholder="users" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input-field" placeholder="main" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Hash ID</label>
            <input value={form.parentHashId} onChange={(e) => setForm({ ...form, parentHashId: e.target.value })} className="input-field" placeholder="NAV-92AF (leave empty for top-level)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="input-field" />
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

export default NavigationAdminPage;

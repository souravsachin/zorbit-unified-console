import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2 } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import {
  dashboardService,
  Widget,
  WidgetType,
  CreateWidgetPayload,
  UpdateWidgetPayload,
} from '../../services/dashboard';
import WidgetCard from '../../components/widgets/WidgetCard';

const WIDGET_TYPES: WidgetType[] = ['count', 'chart', 'table', 'list', 'gauge'];
const GRID_COLS = 12;

interface WidgetFormState {
  title: string;
  type: WidgetType;
  metricQuery: string;
  roles: string;
  positionX: number;
  positionY: number;
  positionW: number;
  positionH: number;
  configJson: string;
}

const emptyForm: WidgetFormState = {
  title: '',
  type: 'count',
  metricQuery: '',
  roles: '',
  positionX: 0,
  positionY: 0,
  positionW: 4,
  positionH: 3,
  configJson: '{}',
};

function formToPayload(form: WidgetFormState): CreateWidgetPayload {
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(form.configJson);
  } catch {
    // keep empty
  }
  const roles = form.roles
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  return {
    title: form.title,
    type: form.type,
    metricQuery: form.metricQuery || undefined,
    config,
    roles,
    positionX: form.positionX,
    positionY: form.positionY,
    positionW: form.positionW,
    positionH: form.positionH,
  };
}

function widgetToForm(w: Widget): WidgetFormState {
  return {
    title: w.title,
    type: w.type,
    metricQuery: w.metricQuery || '',
    roles: w.roles.join(', '),
    positionX: w.positionX,
    positionY: w.positionY,
    positionW: w.positionW,
    positionH: w.positionH,
    configJson: JSON.stringify(w.config || {}, null, 2),
  };
}

/** Build a fake Widget object from form state for live preview */
function formToPreviewWidget(form: WidgetFormState): Widget {
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(form.configJson);
  } catch {
    // keep empty
  }
  return {
    id: 'preview',
    title: form.title || 'Preview',
    type: form.type,
    metricQuery: form.metricQuery || null,
    config,
    roles: [],
    positionX: 0,
    positionY: 0,
    positionW: form.positionW,
    positionH: form.positionH,
    orgId: '',
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  };
}

const DashboardDesignerPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WidgetFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadWidgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getDesignerWidgets(orgId);
      setWidgets(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load widgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (w: Widget) => {
    setEditingId(w.id);
    setForm(widgetToForm(w));
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Title is required', 'warning');
      return;
    }
    // Validate JSON
    try {
      JSON.parse(form.configJson);
    } catch {
      toast('Config must be valid JSON', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editingId) {
        await dashboardService.updateWidget(orgId, editingId, payload as UpdateWidgetPayload);
        toast('Widget updated', 'success');
      } else {
        await dashboardService.createWidget(orgId, payload);
        toast('Widget created', 'success');
      }
      setShowForm(false);
      loadWidgets();
    } catch {
      toast(editingId ? 'Failed to update widget' : 'Failed to create widget', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await dashboardService.deleteWidget(orgId, deleteConfirmId);
      toast('Widget deleted', 'success');
      setDeleteConfirmId(null);
      loadWidgets();
    } catch {
      toast('Failed to delete widget', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof WidgetFormState>(key: K, value: WidgetFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const maxRow = widgets.reduce((max, w) => Math.max(max, w.positionY + w.positionH), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Designer</h1>
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/dashboard-view')} className="btn-secondary flex items-center space-x-2">
            <Eye size={18} />
            <span>Preview</span>
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
            <Plus size={18} />
            <span>Create Widget</span>
          </button>
        </div>
      </div>

      {/* Widget grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse">
              <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No widgets yet. Create your first dashboard widget.
          </p>
          <button onClick={openCreate} className="btn-primary">Create Widget</button>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${Math.max(maxRow, 1)}, 80px)`,
          }}
        >
          {widgets.map((w) => (
            <div
              key={w.id}
              className="relative group"
              style={{
                gridColumn: `${w.positionX + 1} / span ${w.positionW}`,
                gridRow: `${w.positionY + 1} / span ${w.positionH}`,
              }}
            >
              <WidgetCard widget={w} onClick={() => openEdit(w)} showEditOverlay />
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(w.id); }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                title="Delete widget"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Widget' : 'Create Widget'}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="input-field"
              placeholder="e.g. Total Customers"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value as WidgetType)}
              className="input-field"
            >
              {WIDGET_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Metric Query */}
          <div>
            <label className="block text-sm font-medium mb-1">Metric Query</label>
            <input
              value={form.metricQuery}
              onChange={(e) => updateField('metricQuery', e.target.value)}
              className="input-field"
              placeholder="/api/v1/O/{{org_id}}/customers/count"
            />
            <p className="text-xs text-gray-400 mt-1">Use {'{{org_id}}'} as org placeholder</p>
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium mb-1">Roles (comma separated)</label>
            <input
              value={form.roles}
              onChange={(e) => updateField('roles', e.target.value)}
              className="input-field"
              placeholder="super_admin, manager"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty for all roles</p>
          </div>

          {/* Position */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">X</label>
              <input
                type="number"
                min={0}
                max={GRID_COLS - 1}
                value={form.positionX}
                onChange={(e) => updateField('positionX', parseInt(e.target.value) || 0)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Y</label>
              <input
                type="number"
                min={0}
                value={form.positionY}
                onChange={(e) => updateField('positionY', parseInt(e.target.value) || 0)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Width</label>
              <input
                type="number"
                min={1}
                max={GRID_COLS}
                value={form.positionW}
                onChange={(e) => updateField('positionW', parseInt(e.target.value) || 1)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Height</label>
              <input
                type="number"
                min={1}
                value={form.positionH}
                onChange={(e) => updateField('positionH', parseInt(e.target.value) || 1)}
                className="input-field"
              />
            </div>
          </div>

          {/* Config JSON */}
          <div>
            <label className="block text-sm font-medium mb-1">Config (JSON)</label>
            <textarea
              value={form.configJson}
              onChange={(e) => updateField('configJson', e.target.value)}
              className="input-field font-mono text-xs"
              rows={5}
              placeholder='{ "value": 42, "trend": "+12%", "trendDirection": "up" }'
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.type === 'count' && 'Keys: value, trend, trendDirection (up/down), color'}
              {form.type === 'chart' && 'Keys: chartType (bar/line/pie)'}
              {form.type === 'table' && 'Keys: headers (string[]), rows (string[][])'}
              {form.type === 'list' && 'Keys: items (string[]), ordered (boolean)'}
              {form.type === 'gauge' && 'Keys: value (0-100), label, color'}
            </p>
          </div>

          {/* Live preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className="h-40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <WidgetCard widget={formToPreviewWidget(form)} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Widget">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to delete this widget? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardDesignerPage;

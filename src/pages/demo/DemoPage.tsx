import React, { useState } from 'react';
import { Play, Trash2, Database, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { API_CONFIG } from '../../config';
import api from '../../services/api';

interface SeedProgress {
  step: string;
  status: string;
}

const DEMO_VERSION = 'v1';

const demoRecordings = [
  { id: 'platform-overview', title: 'Platform Overview', description: 'Full walkthrough of Dashboard, Users, Orgs, Roles, Customers, Navigation, Messaging, Audit, PII Vault, API Docs, Settings', gif: `platform-overview-${DEMO_VERSION}.gif` },
  { id: 'identity-auth', title: 'Identity & Auth Flow', description: 'OAuth login flow: Settings → Logout → Login page (Google/GitHub/LinkedIn) → Google account chooser → Dashboard', gif: `identity-auth-flow-${DEMO_VERSION}.gif` },
  { id: 'api-docs', title: 'API Documentation', description: 'All 7 platform services with Swagger: Identity, Authorization, Navigation, Messaging, PII Vault, Audit, Customer', gif: `api-docs-services-${DEMO_VERSION}.gif` },
  { id: 'audit-trail', title: 'Audit & Compliance', description: 'Audit Logs with filters, PII Vault tokenization view, Demo seeding controls', gif: `audit-trail-demo-${DEMO_VERSION}.gif` },
];

const DemoPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState<SeedProgress[]>([]);
  const [deleting, setDeleting] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setProgress([]);

    try {
      // Try SSE first for real-time progress
      const eventSource = new EventSource(
        `${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/demo/seed?stream=true`,
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress((prev) => [...prev, { step: data.step, status: data.status }]);
          if (data.status === 'completed' || data.status === 'error') {
            eventSource.close();
            setSeeding(false);
            toast(data.status === 'completed' ? 'Demo data seeded successfully' : 'Seeding encountered errors', data.status === 'completed' ? 'success' : 'warning');
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = async () => {
        eventSource.close();
        // Fallback to regular POST
        try {
          const res = await api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/demo/seed`);
          setProgress(
            (res.data.steps || [{ step: 'seed', status: 'completed' }]).map((s: SeedProgress) => s),
          );
          toast('Demo data seeded', 'success');
        } catch {
          toast('Failed to seed demo data', 'error');
        } finally {
          setSeeding(false);
        }
      };
    } catch {
      toast('Failed to seed demo data', 'error');
      setSeeding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('This will archive all DEMO- prefixed entries across all services. Continue?')) return;
    setDeleting(true);
    try {
      await api.delete(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/demo/data`);
      toast('Demo data archived', 'success');
      setProgress([]);
    } catch {
      toast('Failed to delete demo data', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Demo</h1>

      {/* Seed Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg flex items-center space-x-2">
              <Database size={20} />
              <span>Demo Data</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Seed demo data with DEMO- prefixed entries across all services.
            </p>
          </div>
          <button onClick={handleSeed} disabled={seeding} className="btn-primary flex items-center space-x-2">
            {seeding ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            <span>{seeding ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>
        </div>

        {progress.length > 0 && (
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm">{p.step}</span>
                <StatusBadge label={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-300 dark:border-red-800 space-y-4">
        <h2 className="font-semibold text-lg text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-500">This will archive all DEMO- prefixed entries across all services. This action cannot be undone.</p>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center space-x-2">
          <Trash2 size={18} />
          <span>{deleting ? 'Deleting...' : 'Delete Demo Data'}</span>
        </button>
      </div>

      {/* Demo Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Demo Gallery</h2>
          <span className="text-xs text-gray-400 font-mono">{DEMO_VERSION} - 2026-03-12</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoRecordings.map((rec) => (
            <div key={rec.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                {rec.gif ? (
                  <img
                    src={`/demos/${DEMO_VERSION}/${rec.gif}`}
                    alt={rec.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold">{rec.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoPage;

import React from 'react';
import { Users, Building2, UserCircle, Activity } from 'lucide-react';
import Card from '../../components/shared/Card';
import StatusBadge from '../../components/shared/StatusBadge';
import { useChannel } from '../../hooks/useRealtime';

interface DashboardMetrics {
  users: number;
  orgs: number;
  customers: number;
  health: string;
  recentEvents?: AuditEventSummary[];
}

interface AuditEventSummary {
  action?: string;
  eventType?: string;
  actor?: string | { hashId?: string };
  timestamp?: string | number;
}

/** Safely format a date value — handles ISO strings, epoch numbers, and invalid values. */
function formatDate(d: unknown): string {
  if (!d) return 'N/A';
  const date = new Date(typeof d === 'number' ? d : String(d));
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

const DashboardPage: React.FC = () => {
  const { data: metrics } = useChannel<DashboardMetrics>('dashboard:metrics');

  const recentEvents = metrics?.recentEvents ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Users} label="Total Users" value={metrics?.users ?? '...'} />
        <Card icon={Building2} label="Organizations" value={metrics?.orgs ?? '...'} />
        <Card icon={UserCircle} label="Customers" value={metrics?.customers ?? '...'} />
        <Card icon={Activity} label="System Health" value={metrics?.health ?? '...'} />
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">Recent Audit Events</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentEvents.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {metrics ? 'No recent events' : 'Waiting for data...'}
            </div>
          )}
          {recentEvents.map((evt, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StatusBadge label={typeof (evt.action || evt.eventType) === 'string' ? (evt.action || evt.eventType)! : String(evt.action || evt.eventType || 'unknown')} />
                <span className="text-sm">{typeof evt.eventType === 'string' ? evt.eventType : JSON.stringify(evt.eventType)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {typeof evt.actor === 'string' ? evt.actor : (evt.actor as { hashId?: string })?.hashId || JSON.stringify(evt.actor)} &middot; {formatDate(evt.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

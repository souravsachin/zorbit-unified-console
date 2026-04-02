import React, { useEffect, useState } from 'react';
import { Users, Building2, UserCircle, Activity } from 'lucide-react';
import Card from '../../components/shared/Card';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { identityService } from '../../services/identity';
import { customerService } from '../../services/customer';
import { auditService, AuditEvent } from '../../services/audit';
import { messagingService } from '../../services/messaging';

/** Safely format a date value — handles ISO strings, epoch numbers, and invalid values. */
function formatDate(d: unknown): string {
  if (!d) return 'N/A';
  const date = new Date(typeof d === 'number' ? d : String(d));
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

const DashboardPage: React.FC = () => {
  const { orgId } = useAuth();
  const [stats, setStats] = useState({ users: 0, orgs: 0, customers: 0 });
  const [healthStatus, setHealthStatus] = useState('unknown');
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Use limit=1 to avoid fetching full lists just for counts.
        // Extract total from paginated response metadata when available,
        // otherwise fall back to array length.
        const [usersRes, orgsRes, custRes, auditRes, healthRes] = await Promise.allSettled([
          identityService.getUsers(orgId, { limit: 1 }),
          identityService.getOrganizations({ limit: 1 }),
          customerService.getCustomers(orgId, { limit: 1 }),
          auditService.getEvents(orgId, { limit: 5 }),
          messagingService.getHealth(),
        ]);

        const extractCount = (res: PromiseSettledResult<any>): number => {
          if (res.status !== 'fulfilled') return 0;
          const d = res.value.data;
          // Prefer total/count from paginated envelope
          if (d && typeof d === 'object' && !Array.isArray(d)) {
            if (typeof d.total === 'number') return d.total;
            if (typeof d.count === 'number') return d.count;
            if (Array.isArray(d.data)) return d.total ?? d.data.length;
          }
          if (Array.isArray(d)) return d.length;
          return 0;
        };

        setStats({
          users: extractCount(usersRes),
          orgs: extractCount(orgsRes),
          customers: extractCount(custRes),
        });

        if (auditRes.status === 'fulfilled') {
          const d = auditRes.value.data;
          setRecentEvents(Array.isArray(d) ? d : (d as { data: AuditEvent[] }).data || []);
        }

        if (healthRes.status === 'fulfilled') {
          setHealthStatus(healthRes.value.data.status || 'healthy');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Users} label="Total Users" value={loading ? '...' : stats.users} />
        <Card icon={Building2} label="Organizations" value={loading ? '...' : stats.orgs} />
        <Card icon={UserCircle} label="Customers" value={loading ? '...' : stats.customers} />
        <Card icon={Activity} label="System Health" value={healthStatus} />
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">Recent Audit Events</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentEvents.length === 0 && (
            <div className="p-4 text-center text-gray-500">No recent events</div>
          )}
          {recentEvents.map((evt, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StatusBadge label={typeof (evt.action || evt.eventType) === 'string' ? (evt.action || evt.eventType) : String(evt.action || evt.eventType || 'unknown')} />
                <span className="text-sm">{typeof evt.eventType === 'string' ? evt.eventType : JSON.stringify(evt.eventType)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {typeof evt.actor === 'string' ? evt.actor : (evt.actor as unknown as { hashId?: string })?.hashId || JSON.stringify(evt.actor)} &middot; {formatDate(evt.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

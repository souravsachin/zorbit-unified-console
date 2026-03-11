import React, { useEffect, useState } from 'react';
import { Users, Building2, UserCircle, Activity } from 'lucide-react';
import Card from '../../components/shared/Card';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { identityService } from '../../services/identity';
import { customerService } from '../../services/customer';
import { auditService, AuditEvent } from '../../services/audit';
import { messagingService } from '../../services/messaging';

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
        const [usersRes, orgsRes, custRes, auditRes, healthRes] = await Promise.allSettled([
          identityService.getUsers(orgId),
          identityService.getOrganizations(),
          customerService.getCustomers(orgId),
          auditService.getEvents(orgId, { limit: 5 }),
          messagingService.getHealth(),
        ]);

        setStats({
          users: usersRes.status === 'fulfilled' ? (Array.isArray(usersRes.value.data) ? usersRes.value.data.length : 0) : 0,
          orgs: orgsRes.status === 'fulfilled' ? (Array.isArray(orgsRes.value.data) ? orgsRes.value.data.length : 0) : 0,
          customers: custRes.status === 'fulfilled' ? (Array.isArray(custRes.value.data) ? custRes.value.data.length : 0) : 0,
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
                <StatusBadge label={evt.action || evt.eventType} />
                <span className="text-sm">{evt.eventType}</span>
              </div>
              <div className="text-xs text-gray-500">
                {evt.actor} &middot; {new Date(evt.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

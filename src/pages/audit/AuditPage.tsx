import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { auditService, AuditEvent } from '../../services/audit';

const PAGE_SIZE = 20;

const AuditPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filters, setFilters] = useState({ eventType: '', actor: '', resource: '', startDate: '', endDate: '' });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const query = {
        page,
        limit: PAGE_SIZE,
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.actor && { actor: filters.actor }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };
      const res = await auditService.getEvents(orgId, query);
      const d = res.data;
      if (Array.isArray(d)) {
        setEvents(d);
        setTotal(d.length);
      } else {
        setEvents(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {
      toast('Failed to load audit events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [orgId, page, filters]);

  const columns: Column<AuditEvent>[] = [
    { key: 'timestamp', header: 'Timestamp', render: (e) => new Date(e.timestamp).toLocaleString() },
    { key: 'eventType', header: 'Event Type', render: (e) => <StatusBadge label={e.eventType} variant="info" /> },
    { key: 'actor', header: 'Actor' },
    { key: 'resource', header: 'Resource' },
    { key: 'action', header: 'Action' },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            placeholder="Event type"
            value={filters.eventType}
            onChange={(e) => { setFilters({ ...filters, eventType: e.target.value }); setPage(1); }}
            className="input-field"
          />
          <input
            placeholder="Actor"
            value={filters.actor}
            onChange={(e) => { setFilters({ ...filters, actor: e.target.value }); setPage(1); }}
            className="input-field"
          />
          <input
            placeholder="Resource"
            value={filters.resource}
            onChange={(e) => { setFilters({ ...filters, resource: e.target.value }); setPage(1); }}
            className="input-field"
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
            className="input-field"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
            className="input-field"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        emptyMessage="No audit events found"
        onRowClick={(item) => setSelectedEvent(item)}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Audit Event Detail">
        {selectedEvent && (
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(selectedEvent, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
};

export default AuditPage;

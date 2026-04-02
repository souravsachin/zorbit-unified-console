import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { auditService, AuditEvent } from '../../services/audit';

const PAGE_SIZE = 20;

const EventLogPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await auditService.getEvents(orgId, { page, limit: PAGE_SIZE });
      const d = res.data;
      if (Array.isArray(d)) {
        setEvents(d);
        setTotal(d.length);
      } else {
        setEvents(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {
      toast('Failed to load event log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [orgId, page]);

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
      <h1 className="text-2xl font-bold">Event Log</h1>
      <p className="text-sm text-gray-500">Platform events captured by the audit service.</p>

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        emptyMessage="No events found"
        onRowClick={(item) => setSelectedEvent(item)}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Detail">
        {selectedEvent && (
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(selectedEvent, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
};

export default EventLogPage;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { auditService, AuditEvent } from '../../services/audit';

const PAGE_SIZE = 20;

/** Safely format a date value — handles ISO strings, epoch numbers, and invalid values. */
function formatDate(d: unknown): string {
  if (!d) return 'N/A';
  const date = new Date(typeof d === 'number' ? d : String(d));
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

const AuditPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filters, setFilters] = useState({ eventType: '', actor: '', resource: '', startDate: '', endDate: '' });
  const [appliedFilters, setAppliedFilters] = useState({ eventType: '', actor: '', resource: '', startDate: '', endDate: '' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEvents = useCallback(async (currentFilters: typeof filters, currentPage: number) => {
    setLoading(true);
    try {
      const query = {
        page: currentPage,
        limit: PAGE_SIZE,
        ...(currentFilters.eventType && { eventType: currentFilters.eventType }),
        ...(currentFilters.actor && { actor: currentFilters.actor }),
        ...(currentFilters.resource && { resource: currentFilters.resource }),
        ...(currentFilters.startDate && { startDate: currentFilters.startDate }),
        ...(currentFilters.endDate && { endDate: currentFilters.endDate }),
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
  }, [orgId, toast]);

  useEffect(() => { loadEvents(appliedFilters, page); }, [orgId, page, appliedFilters, loadEvents]);

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    // Date changes apply after a short debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setAppliedFilters({ ...newFilters });
    }, 500);
  };

  const columns: Column<AuditEvent>[] = [
    { key: 'timestamp', header: 'Timestamp', render: (e) => formatDate(e.timestamp) },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="Event type"
            value={filters.eventType}
            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            onKeyDown={handleKeyDown}
            className="input-field"
          />
          <input
            placeholder="Actor"
            value={filters.actor}
            onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
            onKeyDown={handleKeyDown}
            className="input-field"
          />
          <input
            placeholder="Resource"
            value={filters.resource}
            onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
            onKeyDown={handleKeyDown}
            className="input-field"
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="input-field"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="input-field"
          />
          <button
            onClick={handleSearch}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
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

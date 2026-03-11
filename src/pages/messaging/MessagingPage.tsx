import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { useToast } from '../../components/shared/Toast';
import { messagingService, Topic, DLQEntry, HealthStatus } from '../../services/messaging';

type Tab = 'topics' | 'dlq';

const topicColumns: Column<Topic>[] = [
  { key: 'name', header: 'Topic Name' },
  { key: 'partitions', header: 'Partitions' },
  { key: 'replicas', header: 'Replicas' },
  { key: 'messageCount', header: 'Messages' },
];

const dlqColumns: Column<DLQEntry>[] = [
  { key: 'id', header: 'ID', render: (d) => <code className="text-xs">{d.id}</code> },
  { key: 'topic', header: 'Original Topic' },
  { key: 'error', header: 'Error', render: (d) => <span className="text-red-600 text-xs">{d.error}</span> },
  { key: 'retryCount', header: 'Retries' },
  { key: 'timestamp', header: 'Timestamp', render: (d) => new Date(d.timestamp).toLocaleString() },
];

const MessagingPage: React.FC = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('topics');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [dlq, setDlq] = useState<DLQEntry[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [topicsRes, dlqRes, healthRes] = await Promise.allSettled([
          messagingService.getTopics(),
          messagingService.getDLQ(),
          messagingService.getHealth(),
        ]);
        if (topicsRes.status === 'fulfilled') setTopics(Array.isArray(topicsRes.value.data) ? topicsRes.value.data : []);
        if (dlqRes.status === 'fulfilled') setDlq(Array.isArray(dlqRes.value.data) ? dlqRes.value.data : []);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      } catch {
        toast('Failed to load messaging data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messaging</h1>
        {health && (
          <div className="flex items-center space-x-2">
            <Activity size={18} className={health.status === 'healthy' ? 'text-green-500' : 'text-red-500'} />
            <StatusBadge label={health.status || 'unknown'} />
          </div>
        )}
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('topics')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'topics' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Topics ({topics.length})
        </button>
        <button
          onClick={() => setTab('dlq')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'dlq' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dead Letter Queue ({dlq.length})
        </button>
      </div>

      {tab === 'topics' && (
        <DataTable columns={topicColumns} data={topics} loading={loading} emptyMessage="No topics found" />
      )}
      {tab === 'dlq' && (
        <DataTable columns={dlqColumns} data={dlq} loading={loading} emptyMessage="No dead letter entries" />
      )}
    </div>
  );
};

export default MessagingPage;

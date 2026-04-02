import React from 'react';
import {
  Radio,
  Mail,
  AlertTriangle,
  RefreshCw,
  FileText,
  BarChart3,
  Code,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Messaging Presentation Slides
// ---------------------------------------------------------------------------

const MESSAGING_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Messaging / Event Bus',
    subtitle: 'Kafka-Based Event-Driven Communication for Zorbit',
    icon: <Radio size={32} />,
    audioSrc: '/audio/messaging/slide_01.mp3',
    background: 'bg-gradient-to-br from-orange-700 via-red-700 to-rose-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Kafka Topics</p>
          <p className="text-white/60 text-xs mt-1">Partitioned event streams</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Event Envelope</p>
          <p className="text-white/60 text-xs mt-1">Canonical event format</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Dead Letter Queue</p>
          <p className="text-white/60 text-xs mt-1">Failed event recovery</p>
        </div>
      </div>
    ),
  },
  {
    id: 'event-flow',
    title: 'Event Flow',
    subtitle: 'Producer -> Kafka -> Consumer pipeline',
    icon: <Layers size={32} />,
    audioSrc: '/audio/messaging/slide_02.mp3',
    background: 'bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { step: 'Producer', desc: 'Emits event', color: 'bg-blue-500/30 border-blue-400' },
          { step: 'Kafka', desc: 'Routes to topic', color: 'bg-amber-500/30 border-amber-400' },
          { step: 'Consumer', desc: 'Processes event', color: 'bg-emerald-500/30 border-emerald-400' },
          { step: 'DLQ', desc: 'Catches failures', color: 'bg-red-500/30 border-red-400' },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${s.color} border backdrop-blur rounded-lg p-3 text-center min-w-[110px]`}>
              <p className="font-bold text-white text-xs">{s.step}</p>
              <p className="text-white/60 text-[10px] mt-1">{s.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
  {
    id: 'event-naming',
    title: 'Event Naming Convention',
    subtitle: 'domain.entity.action -- canonical event taxonomy',
    icon: <FileText size={32} />,
    audioSrc: '/audio/messaging/slide_03.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
        {[
          'identity.user.created',
          'identity.user.updated',
          'authorization.role.assigned',
          'audit.event.recorded',
          'pii.token.created',
          'customer.record.created',
        ].map((evt) => (
          <div key={evt} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <p className="font-mono text-white text-[11px]">{evt}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'dlq',
    title: 'Dead Letter Queue',
    subtitle: 'Automatic retry and manual recovery for failed events',
    icon: <AlertTriangle size={32} />,
    audioSrc: '/audio/messaging/slide_04.mp3',
    background: 'bg-gradient-to-br from-red-700 via-rose-700 to-pink-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-amber-300">Automatic Retry</p>
          <p className="text-white/60 text-xs mt-1">
            Failed events are retried with exponential backoff. After max retries,
            they are moved to the dead letter queue.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-red-300">Manual Recovery</p>
          <p className="text-white/60 text-xs mt-1">
            DLQ viewer lets admins inspect, replay, or discard failed events.
            Full event payload and error details are preserved.
          </p>
        </div>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MessagingHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="messaging"
      moduleName="Messaging / Event Bus"
      moduleDescription="Kafka-based event-driven communication backbone for the Zorbit platform"
      moduleIntro="The Messaging Service (Event Bus) provides the asynchronous communication backbone for the Zorbit platform. All inter-service events flow through Kafka topics following the canonical event envelope format (domain.entity.action). The service manages topic creation, event publishing, dead letter queues for failed events, and email template delivery."
      icon={Radio}
      slides={MESSAGING_SLIDES}
      capabilities={[
        {
          icon: Radio,
          title: 'Kafka Topics',
          description: 'Manage Kafka topics for event streams. Topics are partitioned and replicated for high availability.',
        },
        {
          icon: Layers,
          title: 'Event Publishing',
          description: 'Publish events following the canonical envelope format: domain.entity.action with metadata, payload, and correlation IDs.',
        },
        {
          icon: Mail,
          title: 'Email Templates',
          description: 'Manage email notification templates triggered by platform events (registration, password reset, alerts).',
        },
        {
          icon: AlertTriangle,
          title: 'Dead Letter Queues',
          description: 'Failed events are captured in DLQs with full payload and error context for inspection and replay.',
        },
        {
          icon: BarChart3,
          title: 'Event Log',
          description: 'Searchable log of all published events with timestamps, producers, consumers, and delivery status.',
        },
        {
          icon: RefreshCw,
          title: 'Retry Management',
          description: 'Configurable retry policies with exponential backoff. Manual replay from DLQ for persistent failures.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Administrators', desc: 'Monitor event flow, manage topics, and handle DLQ failures.' },
        { role: 'Module Developers', desc: 'Publish and consume events using the SDK Kafka client.' },
        { role: 'Operations Engineers', desc: 'Monitor Kafka health, throughput, and consumer lag.' },
      ]}
      lifecycleStages={[
        { label: 'Publish', description: 'Producer service emits an event with the canonical envelope to a Kafka topic.', color: '#3b82f6' },
        { label: 'Route', description: 'Kafka routes the event to the correct topic partition based on the event key.', color: '#f59e0b' },
        { label: 'Consume', description: 'Consumer services process the event and acknowledge successful handling.', color: '#10b981' },
        { label: 'Retry', description: 'If processing fails, the event is retried with exponential backoff.', color: '#ef4444' },
        { label: 'DLQ', description: 'After max retries, the event is moved to the dead letter queue for manual recovery.', color: '#64748b' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/messaging/"
      swaggerUrl="https://zorbit.scalatics.com/api/messaging/api-docs"
      faqs={[
        { question: 'What is the event envelope format?', answer: 'Every event follows: { eventType: "domain.entity.action", correlationId, timestamp, producer, namespace, payload }. This canonical format ensures consistent event processing across all services.' },
        { question: 'How do I publish an event from my service?', answer: 'Use the zorbit-sdk-node Kafka client: kafkaClient.publish("domain.entity.action", payload). The SDK handles serialization, envelope wrapping, and delivery confirmation.' },
        { question: 'What happens to failed events?', answer: 'Failed events are retried with exponential backoff (default: 3 retries). If all retries fail, the event is moved to the dead letter queue where admins can inspect, replay, or discard it.' },
        { question: 'Can I replay events from the DLQ?', answer: 'Yes. The DLQ viewer in the console lets you select failed events and replay them to the original topic. You can also discard events that are no longer relevant.' },
      ]}
      resources={[
        { label: 'Messaging API (Swagger)', url: 'https://zorbit.scalatics.com/api/messaging/api-docs', icon: FileText },
        { label: 'Topic Management', url: '/messaging/topics', icon: Radio },
        { label: 'Event Log', url: '/messaging/events', icon: BarChart3 },
        { label: 'Platform Documentation', url: '/api-docs', icon: Code },
      ]}
    />
  );
};

export default MessagingHubPage;

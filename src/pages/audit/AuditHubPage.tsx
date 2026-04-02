import React from 'react';
import {
  ClipboardList,
  Search,
  User,
  History,
  Download,
  FileText,
  Shield,
  Code,
  ArrowRight,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Audit Presentation Slides
// ---------------------------------------------------------------------------

const AUDIT_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Audit Service',
    subtitle: 'Immutable Event Trail for the Zorbit Platform',
    icon: <ClipboardList size={32} />,
    audioSrc: '/audio/audit/slide_01.mp3',
    background: 'bg-gradient-to-br from-slate-700 via-gray-700 to-zinc-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Immutable Trail</p>
          <p className="text-white/60 text-xs mt-1">Append-only audit log</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Actor Tracking</p>
          <p className="text-white/60 text-xs mt-1">Who did what, when</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Resource History</p>
          <p className="text-white/60 text-xs mt-1">Full change timeline</p>
        </div>
      </div>
    ),
  },
  {
    id: 'anatomy',
    title: 'Audit Event Anatomy',
    subtitle: 'Every action is captured with full context',
    icon: <FileText size={32} />,
    audioSrc: '/audio/audit/slide_02.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-left">
        {[
          { field: 'Actor', desc: 'User ID, org, IP address', color: 'text-blue-300' },
          { field: 'Action', desc: 'CREATE, UPDATE, DELETE, READ', color: 'text-amber-300' },
          { field: 'Resource', desc: 'Entity type and ID', color: 'text-emerald-300' },
          { field: 'Context', desc: 'Timestamp, correlation ID, metadata', color: 'text-purple-300' },
        ].map((f) => (
          <div key={f.field} className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className={`font-semibold ${f.color}`}>{f.field}</p>
            <p className="text-white/60 text-xs mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'search',
    title: 'Search & Filter',
    subtitle: 'Find any audit event across the platform',
    icon: <Search size={32} />,
    audioSrc: '/audio/audit/slide_03.mp3',
    background: 'bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { label: 'By Actor', desc: 'Filter by user who performed the action' },
          { label: 'By Resource', desc: 'Filter by entity type or specific ID' },
          { label: 'By Date Range', desc: 'Time-bounded queries with millisecond precision' },
        ].map((f) => (
          <div key={f.label} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <p className="font-semibold text-white text-xs">{f.label}</p>
            <p className="text-white/50 text-[10px] mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'compliance',
    title: 'Compliance & Export',
    subtitle: 'Meet regulatory requirements with exportable audit trails',
    icon: <Shield size={32} />,
    audioSrc: '/audio/audit/slide_04.mp3',
    background: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { step: 'Capture', desc: 'Every action logged', color: 'bg-blue-500/30 border-blue-400' },
          { step: 'Store', desc: 'Immutable append', color: 'bg-purple-500/30 border-purple-400' },
          { step: 'Export', desc: 'CSV / JSON download', color: 'bg-emerald-500/30 border-emerald-400' },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${s.color} border backdrop-blur rounded-lg p-4 text-center min-w-[130px]`}>
              <p className="font-bold text-white">{s.step}</p>
              <p className="text-white/60 text-xs mt-1">{s.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AuditHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="audit"
      moduleName="Audit Service"
      moduleDescription="Immutable audit trail and event logging for the Zorbit platform"
      moduleIntro="The Audit Service captures an immutable record of every significant action across the Zorbit platform. Every create, update, delete, and access event is logged with full context -- who performed the action, what was affected, when it happened, and the correlation ID linking related events. The audit trail is append-only and cannot be modified or deleted."
      icon={ClipboardList}
      slides={AUDIT_SLIDES}
      capabilities={[
        {
          icon: ClipboardList,
          title: 'Audit Trail',
          description: 'Immutable, append-only log of all platform actions. Every create, update, delete, and read is captured.',
        },
        {
          icon: FileText,
          title: 'Event Logging',
          description: 'Structured audit events with canonical format: actor, action, resource, timestamp, and metadata.',
        },
        {
          icon: User,
          title: 'Actor Tracking',
          description: 'Every audit event records the acting user, their organization, IP address, and authentication method.',
        },
        {
          icon: History,
          title: 'Resource History',
          description: 'View the complete change timeline for any resource -- who changed what, when, and what the previous value was.',
        },
        {
          icon: Search,
          title: 'Search & Filter',
          description: 'Full-text search across audit events. Filter by actor, resource type, action, date range, and organization.',
        },
        {
          icon: Download,
          title: 'Export',
          description: 'Export filtered audit trails as CSV or JSON for compliance reporting and external audit systems.',
        },
      ]}
      targetUsers={[
        { role: 'Compliance Officers', desc: 'Review audit trails for regulatory compliance and reporting.' },
        { role: 'Security Analysts', desc: 'Investigate incidents by tracing user actions across the platform.' },
        { role: 'Platform Administrators', desc: 'Monitor platform activity and track configuration changes.' },
        { role: 'External Auditors', desc: 'Export audit data for independent review and certification.' },
      ]}
      lifecycleStages={[
        { label: 'Capture', description: 'Service emits an audit event via Kafka when a significant action occurs.', color: '#3b82f6' },
        { label: 'Store', description: 'Audit service persists the event to the immutable audit database.', color: '#f59e0b' },
        { label: 'Index', description: 'Event is indexed for fast search by actor, resource, action, and time.', color: '#8b5cf6' },
        { label: 'Query', description: 'Users search and filter audit events through the console or API.', color: '#10b981' },
        { label: 'Export', description: 'Filtered results are exported as CSV or JSON for compliance and reporting.', color: '#64748b' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/audit/"
      swaggerUrl="https://zorbit.scalatics.com/api/audit/api-docs"
      faqs={[
        { question: 'Can audit records be deleted?', answer: 'No. The audit trail is immutable and append-only. Records cannot be modified or deleted. This is by design for compliance and security.' },
        { question: 'How long are audit records retained?', answer: 'By default, audit records are retained indefinitely. Retention policies can be configured per organization to meet specific regulatory requirements.' },
        { question: 'How do I find who changed a specific record?', answer: 'Use the Resource History view. Enter the resource type and ID to see the complete change timeline, including who made each change and what was modified.' },
        { question: 'Are read actions also audited?', answer: 'Sensitive read operations (e.g., PII vault lookups, customer data access) are audited. Standard navigation and list views are not audited to avoid excessive log volume.' },
      ]}
      resources={[
        { label: 'Audit API (Swagger)', url: 'https://zorbit.scalatics.com/api/audit/api-docs', icon: FileText },
        { label: 'Audit Log Viewer', url: '/audit/logs', icon: ClipboardList },
        { label: 'Platform Documentation', url: '/api-docs', icon: Code },
      ]}
    />
  );
};

export default AuditHubPage;

import React, { useState } from 'react';
import { Grid, Package, Server, Monitor, Layers, Database, ExternalLink, ChevronDown, ChevronRight, Circle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Module Registry Data                                               */
/* ------------------------------------------------------------------ */

interface ModuleEntry {
  name: string;
  displayName: string;
  layer: 'core' | 'pfs' | 'app' | 'sdk' | 'tpm';
  port?: number;
  serverPort?: number;
  status: 'deployed' | 'built' | 'planned';
  db?: string;
  dbType?: string;
  description: string;
  menuSections: { section: string; items: string[] }[];
  endpoints?: number;
  events?: string[];
}

const MODULES: ModuleEntry[] = [
  // Core Platform
  {
    name: 'zorbit-identity',
    displayName: 'Identity',
    layer: 'core',
    port: 3001,
    serverPort: 3099,
    status: 'deployed',
    db: 'zorbit_identity',
    dbType: 'PostgreSQL',
    description: 'Central authentication (8 protocols), users, organizations, org hierarchy, OAuth provider',
    menuSections: [
      { section: 'Identity', items: ['Users', 'Organizations'] },
      { section: 'Dashboard', items: ['View Dashboard'] },
    ],
    endpoints: 25,
    events: ['identity.user.created', 'identity.user.updated', 'identity.org.created'],
  },
  {
    name: 'zorbit-authorization',
    displayName: 'Authorization',
    layer: 'core',
    port: 3002,
    serverPort: 3102,
    status: 'deployed',
    db: 'zorbit_authorization',
    dbType: 'PostgreSQL',
    description: 'Roles, privileges, privilege sections, role-privilege assignment',
    menuSections: [
      { section: 'Authorization', items: ['Roles', 'Privileges'] },
    ],
    endpoints: 18,
    events: ['authorization.role.created', 'authorization.privilege.assigned'],
  },
  {
    name: 'zorbit-navigation',
    displayName: 'Navigation',
    layer: 'core',
    port: 3003,
    serverPort: 3103,
    status: 'deployed',
    db: 'zorbit_navigation',
    dbType: 'PostgreSQL',
    description: 'Dynamic menu generation, route registration, module manifest registry',
    menuSections: [
      { section: 'Navigation', items: ['Menu Items', 'Routes'] },
    ],
    endpoints: 12,
    events: ['navigation.menu.updated'],
  },
  {
    name: 'zorbit-event_bus',
    displayName: 'Event Bus',
    layer: 'core',
    port: 3004,
    serverPort: 3104,
    status: 'deployed',
    db: 'zorbit_messaging',
    dbType: 'PostgreSQL + Kafka',
    description: 'Event publishing, topic management, dead letter queues, email templates',
    menuSections: [
      { section: 'Messaging', items: ['Topics', 'Event Log'] },
    ],
    endpoints: 15,
    events: [],
  },
  {
    name: 'zorbit-pii_vault',
    displayName: 'PII Vault',
    layer: 'core',
    port: 3005,
    serverPort: 3105,
    status: 'deployed',
    db: 'zorbit_pii_vault',
    dbType: 'PostgreSQL (separate host)',
    description: 'PII tokenization, auto-detection, role-based resolution',
    menuSections: [
      { section: 'PII Vault', items: ['Token Registry'] },
      { section: 'PII Showcase', items: ['PII Showcase', 'Dashboard', 'Upload & Ingest', 'PII Configuration'] },
    ],
    endpoints: 10,
    events: ['pii.token.created', 'pii.access.logged'],
  },
  {
    name: 'zorbit-audit',
    displayName: 'Audit',
    layer: 'core',
    port: 3006,
    serverPort: 3106,
    status: 'deployed',
    db: 'zorbit_audit',
    dbType: 'PostgreSQL',
    description: 'Audit trail for every DB mutation across the platform',
    menuSections: [
      { section: 'Audit', items: ['Audit Logs'] },
    ],
    endpoints: 8,
    events: [],
  },

  // Platform Feature Services
  {
    name: 'zorbit-pfs-rtc',
    displayName: 'Real-Time Communication',
    layer: 'pfs',
    port: 3007,
    serverPort: 3107,
    status: 'deployed',
    db: 'zorbit_rtc',
    dbType: 'PostgreSQL',
    description: 'Voice/video calls via LiveKit, call signaling, WebSocket, TURN/STUN',
    menuSections: [
      { section: 'Directory', items: ['Team Directory (voice/video)'] },
    ],
    endpoints: 8,
    events: ['rtc.call.initiated', 'rtc.call.ended'],
  },
  {
    name: 'zorbit-pfs-chat',
    displayName: 'Chat (Legacy)',
    layer: 'pfs',
    port: 3008,
    serverPort: 3108,
    status: 'deployed',
    db: 'zorbit_chat',
    dbType: 'PostgreSQL',
    description: 'Real-time chat, presence, typing indicators. Being replaced by Rocket.Chat.',
    menuSections: [
      { section: 'Directory', items: ['Team Directory (chat)'] },
    ],
    endpoints: 15,
    events: ['chat.message.sent', 'chat.presence.changed'],
  },
  {
    name: 'zorbit-pfs-ai_gateway',
    displayName: 'AI Gateway',
    layer: 'pfs',
    port: 3009,
    serverPort: 3109,
    status: 'deployed',
    db: 'zorbit_ai_gateway',
    dbType: 'PostgreSQL',
    description: 'Unified AI interface — LLM chat, STT, TTS, embeddings, rate limiting',
    menuSections: [],
    endpoints: 12,
    events: ['ai.completion.completed', 'ai.transcription.completed'],
  },
  {
    name: 'zorbit-pfs-interaction_recorder',
    displayName: 'Interaction Recorder',
    layer: 'pfs',
    port: 3012,
    serverPort: 3112,
    status: 'deployed',
    db: 'zorbit_interaction_recorder',
    dbType: 'PostgreSQL',
    description: 'Macro recording — screen click/type/navigate capture and replay',
    menuSections: [],
    endpoints: 10,
    events: ['recorder.interaction.completed'],
  },
  {
    name: 'zorbit-pfs-datatable',
    displayName: 'Configurable Data Table',
    layer: 'pfs',
    port: 3013,
    serverPort: 3113,
    status: 'deployed',
    db: 'zorbit_datatable',
    dbType: 'MongoDB',
    description: 'Crown jewel — DB-driven configurable table engine. 13 page defs, smart filters, PII masking.',
    menuSections: [],
    endpoints: 8,
    events: [],
  },
  {
    name: 'zorbit-pfs-form_builder',
    displayName: 'Form Builder',
    layer: 'pfs',
    port: 3014,
    serverPort: 3114,
    status: 'deployed',
    db: 'zorbit_form_builder',
    dbType: 'MongoDB',
    description: 'Form definitions (formio.js), conditional rendering, multi-step wizard, auto-save',
    menuSections: [
      { section: 'Form Builder', items: ['Form Templates', 'Create Form', 'Submissions'] },
    ],
    endpoints: 12,
    events: ['form.submission.created', 'form.submission.submitted'],
  },

  // Third-Party Modules
  {
    name: 'zorbit-tpm-rocket_chat',
    displayName: 'Rocket.Chat',
    layer: 'tpm',
    serverPort: 3030,
    status: 'deployed',
    dbType: 'MongoDB (shared)',
    description: 'Team messaging, channels, DMs, file sharing, voice/video, bots, webhooks',
    menuSections: [
      { section: 'Directory', items: ['Group Spaces'] },
      { section: 'Support Center', items: ['Ask JAYNA', 'Agent Pool'] },
    ],
    endpoints: 0,
    events: [],
  },

  // Business Applications
  {
    name: 'zorbit-app-pcg4',
    displayName: 'Product Configurator (PCG4)',
    layer: 'app',
    port: 3011,
    serverPort: 3111,
    status: 'deployed',
    db: 'zorbit_pcg4',
    dbType: 'PostgreSQL',
    description: 'Product definition, variants, encounter types, Table of Benefits',
    menuSections: [
      { section: 'Products', items: ['Overview', 'Configurations', 'Reference Library', 'Coverage Mapper', 'Deployments', 'Setup'] },
    ],
    endpoints: 20,
    events: ['pcg4.product.created', 'pcg4.product.published'],
  },
  {
    name: 'zorbit-app-hi_decisioning',
    displayName: 'HI UW Decisioning',
    layer: 'app',
    port: 3016,
    serverPort: 3116,
    status: 'deployed',
    db: 'zorbit_hi_decisioning',
    dbType: 'MongoDB',
    description: 'Health insurance underwriting rules engine — 15 STP/NSTP rules, 11 action types, condition builder',
    menuSections: [
      { section: 'Retail Insurance', items: ['HI Decisioning'] },
    ],
    endpoints: 10,
    events: ['uw.evaluation.completed'],
  },
  {
    name: 'zorbit-app-uw_workflow',
    displayName: 'UW Workflow Engine',
    layer: 'app',
    port: 3015,
    serverPort: 3115,
    status: 'deployed',
    db: 'zorbit_uw_workflow',
    dbType: 'MongoDB',
    description: 'Generic underwriting workflow — 13 queues, 20 actions, status progression, audit trail',
    menuSections: [
      { section: 'Retail Insurance', items: ['UW Workflow'] },
    ],
    endpoints: 12,
    events: ['uw.workflow.action_executed', 'uw.workflow.status_changed'],
  },
  {
    name: 'zorbit-app-hi_quotation',
    displayName: 'HI Quotation System',
    layer: 'app',
    port: 3017,
    serverPort: 3117,
    status: 'deployed',
    db: 'zorbit_hi_quotation',
    dbType: 'MongoDB',
    description: 'Health insurance retail/individual quotation — MAF, members, deep nested documents',
    menuSections: [
      { section: 'Retail Insurance', items: ['HI Quotation'] },
    ],
    endpoints: 18,
    events: ['uw.quotation.created', 'uw.quotation.submitted'],
  },
  {
    name: 'zorbit-app-mi_quotation',
    displayName: 'MI Quotation System',
    layer: 'app',
    port: 3023,
    serverPort: 3123,
    status: 'deployed',
    db: 'zorbit_mi_quotation',
    dbType: 'MongoDB',
    description: 'Motor insurance quotation — vehicle makes/models, coverage types, add-ons, geographic areas',
    menuSections: [
      { section: 'Motor Insurance', items: ['MI Quotation'] },
    ],
    endpoints: 13,
    events: ['mi.quotation.created', 'mi.quotation.submitted'],
  },

  // SDKs
  {
    name: 'zorbit-sdk-node',
    displayName: 'Node.js SDK',
    layer: 'sdk',
    status: 'built',
    description: 'Backend SDK — auth middleware, DB interceptors (PII, audit, quota)',
    menuSections: [],
  },
  {
    name: 'zorbit-sdk-react',
    displayName: 'React SDK',
    layer: 'sdk',
    status: 'built',
    description: 'Frontend SDK — DataTable, FormRenderer, DashboardWidgets, DemoTourPlayer, hooks',
    menuSections: [],
  },

  // Planned
  {
    name: 'zorbit-pfs-voice',
    displayName: 'Voice Interface',
    layer: 'pfs',
    status: 'planned',
    description: 'Voice capability everywhere — STT→understand→stage→confirm→ingest',
    menuSections: [],
  },
  {
    name: 'zorbit-pfs-live_stream',
    displayName: 'Live Streaming',
    layer: 'pfs',
    status: 'planned',
    description: 'YouTube Live style — capture, encode, stream, notify, play. Auto-translation.',
    menuSections: [],
  },
  {
    name: 'zorbit-app-fee_management',
    displayName: 'Fee Management (Slice of Pie)',
    layer: 'app',
    status: 'planned',
    description: 'Fee configs, invoices, payments, statements',
    menuSections: [],
  },
  {
    name: 'zorbit-app-claims_core',
    displayName: 'Claims Core',
    layer: 'app',
    status: 'planned',
    description: 'Claims infrastructure — intimation, initiation, adjudication, payment reconciliation',
    menuSections: [],
  },
  {
    name: 'zorbit-app-data_harmonizer',
    displayName: 'Data Harmonizer',
    layer: 'app',
    status: 'planned',
    description: 'TPA data homogenization — collect, standardize, sanitize, stage, dedupe, ingest, analytics',
    menuSections: [],
  },
];

const LAYER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  core: { label: 'CORE', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  pfs: { label: 'PFS', color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  app: { label: 'APP', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  sdk: { label: 'SDK', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  tpm: { label: 'TPM', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const STATUS_DOT: Record<string, string> = {
  deployed: 'bg-green-500',
  built: 'bg-blue-500',
  planned: 'bg-gray-400',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ModuleRegistryPage: React.FC = () => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [filterLayer, setFilterLayer] = useState<string>('all');

  const filtered = filterLayer === 'all' ? MODULES : MODULES.filter(m => m.layer === filterLayer);

  const counts = {
    all: MODULES.length,
    core: MODULES.filter(m => m.layer === 'core').length,
    pfs: MODULES.filter(m => m.layer === 'pfs').length,
    app: MODULES.filter(m => m.layer === 'app').length,
    sdk: MODULES.filter(m => m.layer === 'sdk').length,
    tpm: MODULES.filter(m => m.layer === 'tpm').length,
  };

  const totalMenuSections = MODULES.reduce((acc, m) => acc + m.menuSections.length, 0);
  const totalMenuItems = MODULES.reduce((acc, m) => acc + m.menuSections.reduce((a, s) => a + s.items.length, 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <Grid className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Module Registry</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All platform modules, their menu contributions, and service details
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {(['all', 'core', 'pfs', 'app', 'sdk', 'tpm'] as const).map(layer => {
          const meta = layer === 'all'
            ? { label: 'All Modules', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' }
            : LAYER_LABELS[layer];
          return (
            <button
              key={layer}
              onClick={() => setFilterLayer(layer)}
              className={`px-4 py-3 rounded-xl border text-left transition-all ${
                filterLayer === layer
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}
            >
              <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts[layer]}</p>
            </button>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <span><strong className="text-gray-900 dark:text-white">{totalMenuSections}</strong> menu sections</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span><strong className="text-gray-900 dark:text-white">{totalMenuItems}</strong> menu items</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span><strong className="text-green-600">{MODULES.filter(m => m.status === 'deployed').length}</strong> deployed</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span><strong className="text-blue-600">{MODULES.filter(m => m.status === 'built').length}</strong> built</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span><strong className="text-gray-400">{MODULES.filter(m => m.status === 'planned').length}</strong> planned</span>
      </div>

      {/* Module List */}
      <div className="space-y-2">
        {filtered.map(mod => {
          const expanded = expandedModule === mod.name;
          const layerMeta = LAYER_LABELS[mod.layer];
          return (
            <div
              key={mod.name}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Module header row */}
              <button
                onClick={() => setExpandedModule(expanded ? null : mod.name)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                <Circle className={`h-2.5 w-2.5 shrink-0 ${STATUS_DOT[mod.status]}`} style={{ fill: 'currentColor' }} />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${layerMeta.bg} ${layerMeta.color}`}>{layerMeta.label}</span>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500 w-56 shrink-0 truncate">{mod.name}</span>
                <span className="font-medium text-gray-900 dark:text-white text-sm flex-1">{mod.displayName}</span>
                {mod.serverPort && <span className="text-xs text-gray-400 font-mono">:{mod.serverPort}</span>}
                {mod.menuSections.length > 0 && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                    {mod.menuSections.reduce((a, s) => a + s.items.length, 0)} menu items
                  </span>
                )}
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{mod.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {mod.dbType && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Database className="h-3.5 w-3.5" />
                        <span>{mod.dbType}{mod.db ? ` (${mod.db})` : ''}</span>
                      </div>
                    )}
                    {mod.port && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Server className="h-3.5 w-3.5" />
                        <span>Dev: {mod.port} | Prod: {mod.serverPort}</span>
                      </div>
                    )}
                    {mod.endpoints !== undefined && mod.endpoints > 0 && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>{mod.endpoints} endpoints</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Monitor className="h-3.5 w-3.5" />
                      <span className="capitalize">{mod.status}</span>
                    </div>
                  </div>

                  {/* Menu Contributions */}
                  {mod.menuSections.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" /> Menu Contributions
                      </p>
                      <div className="space-y-1.5">
                        {mod.menuSections.map(sec => (
                          <div key={sec.section} className="flex items-start gap-2 text-xs">
                            <span className="font-medium text-indigo-600 dark:text-indigo-400 w-32 shrink-0">{sec.section}</span>
                            <div className="flex flex-wrap gap-1">
                              {sec.items.map(item => (
                                <span key={item} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {mod.events && mod.events.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> Kafka Events
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {mod.events.map(ev => (
                          <span key={ev} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-mono rounded">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleRegistryPage;

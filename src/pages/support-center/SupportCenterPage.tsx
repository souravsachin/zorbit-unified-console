import React from 'react';
import {
  Headset,
  MessageSquare,
  Phone,
  Video,
  BookOpen,
  LifeBuoy,
  Sparkles,
  Shield,
  Zap,
  Globe,
  FileText,
  Users,
  Settings,
  Lock,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { ManifestEntry } from '../../components/shared/DemoTourPlayer';

/* ------------------------------------------------------------------ */
/*  Desktop Journey Playlist (v1 — 2026-04-02)                       */
/* ------------------------------------------------------------------ */

const DESKTOP_JOURNEY: ManifestEntry[] = [
  { file: 'segments/desktop/01-login-mfa.mp4', title: 'Login with MFA', thumbnail: '', timestamp: '2026-04-02T12:01:00Z', duration: 66, chapters: [{ title: 'Login + TOTP', startMs: 0 }] },
  { file: 'segments/desktop/02-create-org.mp4', title: 'Create Organization', thumbnail: '', timestamp: '2026-04-02T12:02:00Z', duration: 63, chapters: [{ title: 'Organizations', startMs: 0 }] },
  { file: 'segments/desktop/03-users-roles.mp4', title: 'Users & Roles Management', thumbnail: '', timestamp: '2026-04-02T12:03:00Z', duration: 64, chapters: [{ title: 'Roles', startMs: 0 }, { title: 'Users', startMs: 30000 }] },
  { file: 'segments/desktop/04-product-config.mp4', title: 'Product Configuration (PCG4)', thumbnail: '', timestamp: '2026-04-02T12:04:00Z', duration: 68, chapters: [{ title: 'Configurations', startMs: 0 }, { title: 'AWNIC Steps', startMs: 15000 }] },
  { file: 'segments/desktop/05-rate-tables.mp4', title: 'Product Pricing & Rate Tables', thumbnail: '', timestamp: '2026-04-02T12:05:00Z', duration: 63, chapters: [{ title: 'Rate Tables', startMs: 0 }, { title: 'Rate Grid', startMs: 15000 }] },
  { file: 'segments/desktop/06-hi-quotation.mp4', title: 'Health Insurance Quotation', thumbnail: '', timestamp: '2026-04-02T12:06:00Z', duration: 33, chapters: [{ title: 'Applications', startMs: 0 }, { title: 'New Application', startMs: 15000 }] },
  { file: 'segments/desktop/07-uw-workflow-dashboard.mp4', title: 'UW Workflow Dashboard', thumbnail: '', timestamp: '2026-04-02T12:07:00Z', duration: 60, chapters: [{ title: 'Queue Summary', startMs: 0 }] },
  { file: 'segments/desktop/08-uw-workflow-queues.mp4', title: 'UW Workflow Queues & Detail', thumbnail: '', timestamp: '2026-04-02T12:08:00Z', duration: 67, chapters: [{ title: 'New Quotations', startMs: 0 }, { title: 'STP Approved', startMs: 15000 }, { title: 'Detail Panel', startMs: 35000 }] },
  { file: 'segments/desktop/09-payment.mp4', title: 'Payment Collection', thumbnail: '', timestamp: '2026-04-02T12:09:00Z', duration: 59, chapters: [{ title: 'Approved Queue', startMs: 0 }, { title: 'Payment Link', startMs: 20000 }] },
  { file: 'segments/desktop/10-decisioning-rules.mp4', title: 'Decisioning Rules Engine', thumbnail: '', timestamp: '2026-04-02T12:10:00Z', duration: 67, chapters: [{ title: 'Rules List', startMs: 0 }, { title: 'Rule Details', startMs: 15000 }] },
  { file: 'segments/desktop/11-decisioning-stp.mp4', title: 'STP Criteria & Evaluations', thumbnail: '', timestamp: '2026-04-02T12:11:00Z', duration: 37, chapters: [{ title: 'STP Criteria', startMs: 0 }, { title: 'Evaluations', startMs: 18000 }] },
  { file: 'segments/desktop/12-notifications.mp4', title: 'Notifications', thumbnail: '', timestamp: '2026-04-02T12:12:00Z', duration: 61, chapters: [{ title: 'Bell & Dropdown', startMs: 0 }] },
  { file: 'segments/desktop/13-pii-visibility.mp4', title: 'PII Role-Based Visibility', thumbnail: '', timestamp: '2026-04-02T12:13:00Z', duration: 57, chapters: [{ title: 'Role Switching', startMs: 0 }] },
  { file: 'segments/desktop/14-demo-data-gen.mp4', title: 'AI Demo Data Generator', thumbnail: '', timestamp: '2026-04-02T12:14:00Z', duration: 62, chapters: [{ title: 'Setup Page', startMs: 0 }, { title: 'Generator UI', startMs: 20000 }] },
  { file: 'segments/desktop/15-guide-sections.mp4', title: 'Module Guide Pages', thumbnail: '', timestamp: '2026-04-02T12:15:00Z', duration: 67, chapters: [{ title: 'PCG4', startMs: 0 }, { title: 'Pricing', startMs: 15000 }, { title: 'UW Workflow', startMs: 30000 }, { title: 'Decisioning', startMs: 45000 }] },
  { file: 'segments/desktop/16-mfa-settings.mp4', title: 'MFA Security Settings', thumbnail: '', timestamp: '2026-04-02T12:16:00Z', duration: 32, chapters: [{ title: 'Security Page', startMs: 0 }] },
];

/* ------------------------------------------------------------------ */
/*  Mobile Journey Playlist (v1 — 2026-04-02)                        */
/* ------------------------------------------------------------------ */

const MOBILE_JOURNEY: ManifestEntry[] = DESKTOP_JOURNEY.map((entry) => ({
  ...entry,
  file: entry.file.replace('desktop/', 'mobile/'),
  title: `${entry.title} (Mobile)`,
  timestamp: entry.timestamp.replace('T12:', 'T13:'), // slightly later timestamp
}));

/* ------------------------------------------------------------------ */
/*  Previous recordings (preserved — never delete)                    */
/* ------------------------------------------------------------------ */

const FULL_WORKFLOW_DEMO: ManifestEntry[] = [
  {
    file: 'workflow-demo/zorbit-workflow-demo-narrated.mp4',
    title: 'Complete Insurance Workflow — End-to-End Demo (v1)',
    thumbnail: '',
    timestamp: '2026-04-02T06:00:00.000Z',
    duration: 155,
    chapters: [
      { title: 'Login & MFA Security', startMs: 0 },
      { title: 'Product Configuration (PCG4)', startMs: 25000 },
      { title: 'Product Pricing & Rate Tables', startMs: 85000 },
      { title: 'Health Insurance Quotation', startMs: 115000 },
      { title: 'UW Workflow — Queue Engine', startMs: 130000 },
      { title: 'Decisioning — Rules Engine', startMs: 145000 },
      { title: 'Closing', startMs: 150000 },
    ],
  },
];

/** Auto-generate thumbnail path from video file path: foo/bar.mp4 → foo/bar-thumb.jpg */
function withThumbnails(entries: ManifestEntry[]): ManifestEntry[] {
  return entries.map((e) => ({
    ...e,
    thumbnail: e.thumbnail || e.file.replace('.mp4', '-thumb.jpg'),
  }));
}

/* Combine all recordings — latest first by default (DemoTourPlayer sorts by timestamp desc) */
const ALL_RECORDINGS: ManifestEntry[] = withThumbnails([
  ...DESKTOP_JOURNEY,
  ...MOBILE_JOURNEY,
  ...FULL_WORKFLOW_DEMO,
]);

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const SupportCenterPage: React.FC = () => (
  <ModuleHubPage
    moduleId="support-center"
    moduleName="Support Center"
    moduleDescription="Platform tutorials, knowledge base, and support — spanning all Zorbit modules"
    moduleIntro="The Support Center is your central hub for learning the Zorbit platform. Browse step-by-step tutorials, watch narrated video walkthroughs, access the knowledge base, and get help from Jayna AI or human specialists. Each module also has its own Guide section with module-specific content — this page covers cross-module workflows and platform-wide resources."
    icon={Headset}
    capabilities={[
      {
        icon: Video,
        title: 'Video Tutorial Library',
        description: 'Step-by-step screencasts for every workflow — login, product config, quotation, underwriting, payments, and more. Desktop and mobile versions.',
      },
      {
        icon: Sparkles,
        title: 'Jayna AI Assistant',
        description: 'Get instant answers to platform questions. Jayna understands the Zorbit architecture and can guide you through any workflow.',
      },
      {
        icon: BookOpen,
        title: 'Knowledge Base',
        description: 'In-depth articles covering platform setup, API integration, security configuration, PII protection, and role-based access control.',
      },
      {
        icon: Shield,
        title: 'Security Guides',
        description: 'MFA setup, PII tokenization, role-based visibility, namespace isolation — everything you need to secure your organization.',
      },
      {
        icon: Phone,
        title: 'Human Support',
        description: 'Voice calls, chat, and video support with platform specialists. Average response time under 5 minutes during business hours.',
      },
      {
        icon: Globe,
        title: 'Cross-Module Workflows',
        description: 'End-to-end tutorials that span multiple modules — from product configuration through policy issuance.',
      },
    ]}
    lifecycleStages={[
      { label: 'Onboard', description: 'New user creates account, enables MFA, joins organization', color: '#3b82f6' },
      { label: 'Configure', description: 'Admin sets up roles, products, pricing, and automation rules', color: '#f59e0b' },
      { label: 'Operate', description: 'Users process quotations, underwriting, payments, and policies', color: '#10b981' },
      { label: 'Monitor', description: 'Review audit trails, notifications, PII access logs, and SLA metrics', color: '#8b5cf6' },
      { label: 'Optimize', description: 'Refine STP rules, adjust loading tables, and improve automation rates', color: '#ef4444' },
    ]}
    recordings={ALL_RECORDINGS}
    videosBaseUrl="/demos/"
    swaggerUrl="/api/identity/api-docs"
    faqs={[
      {
        question: 'How do I add users to my organization?',
        answer: 'Navigate to the Users page from the sidebar. Click "Add User" to create a new account. Assign roles during creation. Each user receives a unique short-hash identifier (e.g. U-81F3).',
      },
      {
        question: 'What authentication methods are supported?',
        answer: 'Zorbit supports 8 protocols: Email/Password, Google OAuth, GitHub OAuth, LinkedIn OAuth, Generic OIDC/SSO, SAML 2.0, RADIUS (RFC 2865), and Diameter (RFC 6733). Plus TOTP-based MFA.',
      },
      {
        question: 'How does PII protection work?',
        answer: 'All PII is stored in a separate PII Vault database. Operational databases only store tokens (e.g. PII-92AF). Role-based visibility controls who sees real data, nicknames, or restricted access.',
      },
      {
        question: 'How do I set up role-based access control?',
        answer: 'OrgAdmin creates roles on the Roles page, then assigns them to users. Six pre-built roles cover Product Designer, Actuary, Quotation Officer, Medical Underwriter, UW Rules Admin, and Broker.',
      },
      {
        question: 'Where can I view audit logs?',
        answer: 'The Audit page shows every significant event with actor, action, target, namespace, and timestamp. Filter by date range, event type, or module.',
      },
      {
        question: 'How does the underwriting workflow work?',
        answer: '13 specialized queues manage applications from submission to policy issuance. STP auto-approves clean cases. NSTP routes complex cases to manual review. Every action is audited.',
      },
    ]}
    resources={[
      { label: 'Platform API Documentation', url: '/api-docs', icon: FileText },
      { label: 'Identity Service API', url: '/api/identity/api-docs', icon: Lock },
      { label: 'User Management', url: '/users', icon: Users },
      { label: 'Security Settings (MFA)', url: '/settings/security', icon: Shield },
      { label: 'Audit Logs', url: '/audit', icon: BookOpen },
      { label: 'Module Registry', url: '/admin/modules', icon: Settings },
    ]}
  />
);

export default SupportCenterPage;

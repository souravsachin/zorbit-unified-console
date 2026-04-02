import React from 'react';
import {
  Vault,
  KeyRound,
  ScanSearch,
  Shield,
  Database,
  Lock,
  FileText,
  Code,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// PII Vault Presentation Slides
// ---------------------------------------------------------------------------

const PII_VAULT_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'PII Vault',
    subtitle: 'Sensitive Data Protection for the Zorbit Platform',
    icon: <Vault size={32} />,
    audioSrc: '/audio/pii-vault/slide_01.mp3',
    background: 'bg-gradient-to-br from-rose-700 via-red-700 to-orange-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Tokenization</p>
          <p className="text-white/60 text-xs mt-1">Replace PII with tokens</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Separate DB Host</p>
          <p className="text-white/60 text-xs mt-1">Isolated from operational data</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Role-Based Reveal</p>
          <p className="text-white/60 text-xs mt-1">Only authorized users see PII</p>
        </div>
      </div>
    ),
  },
  {
    id: 'tokenization-flow',
    title: 'Tokenization Flow',
    subtitle: 'Raw PII in, opaque token out',
    icon: <KeyRound size={32} />,
    audioSrc: '/audio/pii-vault/slide_02.mp3',
    background: 'bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { step: 'Raw PII', desc: 'john@example.com', color: 'bg-red-500/30 border-red-400' },
          { step: 'Vault', desc: 'Encrypt & store', color: 'bg-amber-500/30 border-amber-400' },
          { step: 'Token', desc: 'PII-92AF', color: 'bg-emerald-500/30 border-emerald-400' },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${s.color} border backdrop-blur rounded-lg p-4 text-center min-w-[130px]`}>
              <p className="font-bold text-white">{s.step}</p>
              <p className="text-white/60 text-xs mt-1 font-mono">{s.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
  {
    id: 'auto-detection',
    title: 'Auto-Detection',
    subtitle: 'Automatically identify PII fields in payloads',
    icon: <ScanSearch size={32} />,
    audioSrc: '/audio/pii-vault/slide_03.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
        {[
          'Email Addresses',
          'Phone Numbers',
          'Full Names',
          'Postal Addresses',
          'SSN / National ID',
          'Bank Accounts',
        ].map((field) => (
          <div key={field} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <p className="font-medium text-white text-[11px]">{field}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'role-based',
    title: 'Role-Based Resolution',
    subtitle: 'Only authorized users can de-tokenize PII',
    icon: <Shield size={32} />,
    audioSrc: '/audio/pii-vault/slide_04.mp3',
    background: 'bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-emerald-300">Authorized User</p>
          <p className="text-white/60 text-xs mt-1">
            Users with the pii.resolve privilege can call the de-tokenize API.
            The resolved value is shown inline and the access is audited.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-red-300">Unauthorized User</p>
          <p className="text-white/60 text-xs mt-1">
            Users without the privilege see only opaque tokens (PII-xxxx).
            No raw PII is ever exposed in operational databases or UIs.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'isolation',
    title: 'Database Isolation',
    subtitle: 'PII Vault runs on a separate database host',
    icon: <Database size={32} />,
    audioSrc: '/audio/pii-vault/slide_05.mp3',
    background: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-cyan-300">Operational DB</p>
          <p className="text-white/60 text-xs mt-1">
            Stores only PII tokens (PII-xxxx). Even if breached, no raw
            personal data is exposed.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-amber-300">Vault DB</p>
          <p className="text-white/60 text-xs mt-1">
            Separate host with encrypted storage. Access is logged, rate-limited,
            and requires explicit authorization.
          </p>
        </div>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PIIVaultHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="pii-vault"
      moduleName="PII Vault"
      moduleDescription="Sensitive data tokenization and protection for the Zorbit platform"
      moduleIntro="The PII Vault is a dedicated service for protecting personally identifiable information (PII). It replaces raw sensitive data (emails, phone numbers, names, addresses) with opaque tokens that are stored in operational databases. The actual PII is encrypted and stored on a separate database host, accessible only through the de-tokenization API with explicit authorization and full audit logging."
      icon={Vault}
      slides={PII_VAULT_SLIDES}
      capabilities={[
        {
          icon: KeyRound,
          title: 'Tokenization',
          description: 'Replace raw PII with opaque tokens (PII-xxxx). Tokens are stored in operational databases; raw PII stays in the vault.',
        },
        {
          icon: ScanSearch,
          title: 'Auto-Detection',
          description: 'Automatically detect PII fields (email, phone, name, address, SSN) in API payloads and tokenize them before storage.',
        },
        {
          icon: Eye,
          title: 'Role-Based Resolution',
          description: 'Only users with the pii.resolve privilege can de-tokenize. Every resolution is logged in the audit trail.',
        },
        {
          icon: FileText,
          title: 'Token Registry',
          description: 'Searchable registry of all PII tokens with metadata: data type, creation date, owning service, and access count.',
        },
        {
          icon: Database,
          title: 'Separate DB Host',
          description: 'PII vault runs on a dedicated database host, physically isolated from operational data for defense in depth.',
        },
        {
          icon: Lock,
          title: 'Field-Level Encryption',
          description: 'Each PII value is individually encrypted at rest with AES-256. Encryption keys are rotated on a configurable schedule.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Administrators', desc: 'Configure PII detection rules and manage the token registry.' },
        { role: 'Data Protection Officers', desc: 'Audit PII access logs and enforce data protection policies.' },
        { role: 'Module Developers', desc: 'Integrate PII tokenization into their services using the SDK.' },
        { role: 'Compliance Officers', desc: 'Verify PII handling meets GDPR, HIPAA, and industry regulations.' },
      ]}
      lifecycleStages={[
        { label: 'Detect', description: 'PII fields are identified in the incoming API payload (auto or explicit).', color: '#3b82f6' },
        { label: 'Tokenize', description: 'Raw PII is sent to the vault, encrypted, and an opaque token (PII-xxxx) is returned.', color: '#f59e0b' },
        { label: 'Store Token', description: 'Operational database stores only the token. Raw PII never touches the operational DB.', color: '#8b5cf6' },
        { label: 'Resolve', description: 'Authorized user requests de-tokenization. Vault returns the raw value and logs the access.', color: '#10b981' },
        { label: 'Audit', description: 'Every tokenization and resolution event is recorded in the immutable audit trail.', color: '#64748b' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/pii-vault/"
      swaggerUrl="https://zorbit.scalatics.com/api/pii-vault/api-docs"
      faqs={[
        { question: 'What data types does the vault support?', answer: 'Email addresses, phone numbers, full names, postal addresses, SSN/national IDs, bank account numbers, and custom PII types defined per organization.' },
        { question: 'Is PII ever exposed in logs or events?', answer: 'No. All logging, event publishing, and API responses use PII tokens. Raw PII values are never logged, cached, or included in Kafka events.' },
        { question: 'How do I tokenize from my service?', answer: 'Use the zorbit-sdk-node PII client: piiClient.tokenize({ email: "john@example.com", organizationHashId: "O-92AF" }). The SDK handles the vault API call and returns the token.' },
        { question: 'What happens if the vault database is breached?', answer: 'Each value is individually encrypted with AES-256. The encryption keys are stored in a separate secrets manager. Without both the vault DB and the key store, raw PII cannot be recovered.' },
      ]}
      resources={[
        { label: 'PII Vault API (Swagger)', url: 'https://zorbit.scalatics.com/api/pii-vault/api-docs', icon: FileText },
        { label: 'Token Registry', url: '/pii-vault/tokens', icon: KeyRound },
        { label: 'PII Showcase', url: '/pii-showcase', icon: Shield },
        { label: 'Platform Documentation', url: '/api-docs', icon: Code },
      ]}
    />
  );
};

export default PIIVaultHubPage;

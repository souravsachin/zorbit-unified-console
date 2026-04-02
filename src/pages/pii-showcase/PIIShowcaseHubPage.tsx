import React from 'react';
import { EyeOff, Shield, Lock, Key, Database, FileCheck } from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const PIIShowcaseHubPage: React.FC = () => (
  <ModuleHubPage
    moduleId="pii-showcase"
    moduleName="PII Showcase"
    moduleDescription="Demonstrates PII tokenization, fake data generation, and role-based visibility across the Zorbit platform"
    icon={EyeOff}
    capabilities={[
      {
        icon: Lock,
        title: 'PII Tokenization',
        description: 'Real PII data is replaced with tokens (e.g., PII-92AF). Original values stored in the PII Vault, never in operational databases.',
      },
      {
        icon: Shield,
        title: 'Role-Based Visibility',
        description: 'Different roles see different levels of PII — full, masked, or token-only — based on privilege configuration.',
      },
      {
        icon: Database,
        title: 'Fake Data Generation',
        description: 'Generate realistic synthetic data for testing and demos without exposing real customer information.',
      },
      {
        icon: Key,
        title: 'Token Resolution',
        description: 'Authorized users can resolve tokens back to original values via the PII Vault API with full audit logging.',
      },
      {
        icon: FileCheck,
        title: 'Compliance Dashboard',
        description: 'Monitor PII access patterns, token resolution frequency, and data handling compliance metrics.',
      },
      {
        icon: EyeOff,
        title: 'Data Masking',
        description: 'Partial masking for display (e.g., ***@email.com, +971-***-1234) without revealing full PII.',
      },
    ]}
    lifecycleStages={[
      { label: 'Collect', description: 'PII data collected from customer forms or API integrations', color: '#3b82f6' },
      { label: 'Tokenize', description: 'PII sent to vault, token returned and stored in operational DB', color: '#f59e0b' },
      { label: 'Access', description: 'Authorized users request token resolution with role-based visibility', color: '#8b5cf6' },
      { label: 'Audit', description: 'Every access logged — who, when, what token, resolution result', color: '#10b981' },
    ]}
    swaggerUrl="/api/pii-vault/api-docs"
    faqs={[
      { question: 'Where is real PII stored?', answer: 'Only in the PII Vault service, which runs on a separate database host. Operational databases only store tokens.' },
      { question: 'Can I see masked data without vault access?', answer: 'Yes — partial masking is applied at the API layer based on your role. No vault call needed for masked views.' },
      { question: 'How is PII access audited?', answer: 'Every token resolution is logged in the Audit service with the requesting user, timestamp, token, and result.' },
    ]}
    resources={[
      { label: 'PII Vault API (Swagger)', url: '/api/pii-vault/api-docs' },
      { label: 'PII Dashboard', url: '/pii-showcase/dashboard' },
    ]}
  />
);

export default PIIShowcaseHubPage;

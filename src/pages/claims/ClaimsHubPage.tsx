import React from 'react';
import {
  Briefcase,
  FileText,
  Shield,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Banknote,
  Stethoscope,
  Scale,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const ClaimsHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="claims"
      moduleName="Claims Core"
      moduleDescription="Full Claim Lifecycle Management &mdash; 10 Claim Types, 5 Providers"
      moduleIntro="Claims Core manages the complete insurance claims lifecycle from first notification of loss (FNOL) through settlement and closure. It supports 10 claim types across health, motor, and property lines, integrates with 5 provider types (hospitals, garages, loss assessors, TPAs, and reinsurers), and provides comprehensive dashboards for claims operations teams."
      icon={Briefcase}
      capabilities={[
        {
          icon: FileText,
          title: '10 Claim Types',
          description: 'Health (cashless, reimbursement, pre-auth), Motor (own damage, third party, theft), Property (fire, flood, theft, liability).',
        },
        {
          icon: Users,
          title: '5 Provider Types',
          description: 'Integrated workflows for hospitals, garages/repair shops, loss assessors, third-party administrators, and reinsurers.',
        },
        {
          icon: Search,
          title: 'Claims Assessment',
          description: 'Structured assessment forms with document collection, investigation triggers, and fraud scoring integration.',
        },
        {
          icon: Scale,
          title: 'Adjudication Engine',
          description: 'Rule-based adjudication with policy term verification, coverage validation, deductible calculation, and co-pay application.',
        },
        {
          icon: Banknote,
          title: 'Settlement Processing',
          description: 'Multiple settlement modes: direct to provider (cashless), reimbursement to insured, and partial settlements.',
        },
        {
          icon: BarChart3,
          title: 'Claims Dashboard',
          description: 'Real-time metrics: open claims, average cycle time, settlement ratio, reserve adequacy, and fraud detection alerts.',
        },
      ]}
      targetUsers={[
        { role: 'Claims Handlers', desc: 'Register claims, collect documents, and process through assessment stages.' },
        { role: 'Claims Adjusters', desc: 'Evaluate claim validity, determine liability, and calculate settlement amounts.' },
        { role: 'Claims Managers', desc: 'Monitor team performance, approve high-value settlements, and manage reserves.' },
        { role: 'Finance', desc: 'Process claim payments and reconcile with provider invoices.' },
      ]}
      lifecycleStages={[
        { label: 'Intimated', description: 'First notification of loss received. Claim reference number generated.', color: '#f59e0b' },
        { label: 'Initiated', description: 'Claim formally registered. Documents and details being collected.', color: '#3b82f6' },
        { label: 'Assessment', description: 'Claim under investigation. Medical/loss assessor reports being gathered.', color: '#8b5cf6' },
        { label: 'Adjudication', description: 'Policy terms verified, coverage confirmed, settlement amount calculated.', color: '#6366f1' },
        { label: 'Settlement', description: 'Payment approved and processed to the claimant or provider.', color: '#10b981' },
        { label: 'Closed', description: 'Claim fully settled and closed. All documents archived.', color: '#64748b' },
      ]}
      recordings={[
        {
          file: 'claims-overview.mp4',
          title: 'Claims Core Overview',
          thumbnail: '',
          timestamp: '2026-03-27',
          duration: 65,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Claim Types', startMs: 10000 },
            { title: 'Lifecycle Stages', startMs: 25000 },
            { title: 'Adjudication & Settlement', startMs: 40000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/claims/"
      swaggerUrl="/api/claims/api-docs"
      faqs={[
        { question: 'What are the 10 claim types?', answer: 'Health: cashless, reimbursement, pre-authorization. Motor: own damage, third-party, theft. Property: fire, flood, theft, general liability.' },
        { question: 'How does cashless claims work?', answer: 'Hospital sends pre-authorization request. System verifies policy terms, checks coverage, and sends approval/rejection to the hospital in real-time.' },
        { question: 'What triggers a fraud alert?', answer: 'Multiple claims in short period, claim amount near policy limit, mismatched hospital records, and pattern matching against known fraud indicators.' },
        { question: 'How are reserves managed?', answer: 'Initial reserve set at FNOL based on claim type averages. Adjusted during assessment based on actual investigation findings. Released on settlement.' },
      ]}
      resources={[
        { label: 'Claims Core API (Swagger)', url: 'https://scalatics.com:3119/api', icon: FileText },
        { label: 'Provider Network', url: '#', icon: Stethoscope },
        { label: 'Fraud Detection Guide', url: '#', icon: AlertTriangle },
      ]}
    />
  );
};

export default ClaimsHubPage;

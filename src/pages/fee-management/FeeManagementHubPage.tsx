import React from 'react';
import {
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  Calendar,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const FeeManagementHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="fee-management"
      moduleName="Fee Management"
      moduleDescription="Fee Configurations, Invoicing, Payments &amp; Statements"
      moduleIntro="Fee Management handles the complete fee lifecycle from configuration through collection. It supports multiple fee types (administration fees, policy fees, endorsement fees, cancellation fees), automated invoice generation on configurable schedules, payment tracking with multiple payment methods, and statement generation for reconciliation."
      icon={DollarSign}
      capabilities={[
        {
          icon: Settings,
          title: 'Fee Configurations',
          description: 'Define fee types, amounts, calculation methods (flat, percentage, tiered), and applicability rules per product and region.',
        },
        {
          icon: Receipt,
          title: 'Invoice Generation',
          description: 'Automated invoice creation based on policy events (issuance, renewal, endorsement) with configurable templates.',
        },
        {
          icon: CreditCard,
          title: 'Payment Tracking',
          description: 'Record and reconcile payments across multiple methods: bank transfer, credit card, direct debit, and cheque.',
        },
        {
          icon: FileText,
          title: 'Statement Generation',
          description: 'Periodic statements showing fee charges, payments received, outstanding balances, and aging analysis.',
        },
        {
          icon: Calendar,
          title: 'Scheduled Billing',
          description: 'Support for monthly, quarterly, and annual billing cycles with automatic reminder notifications.',
        },
        {
          icon: Bell,
          title: 'Overdue Alerts',
          description: 'Configurable overdue thresholds with automated email reminders and escalation to collections workflow.',
        },
      ]}
      targetUsers={[
        { role: 'Finance Team', desc: 'Configure fees, generate invoices, and reconcile payments.' },
        { role: 'Operations', desc: 'Monitor payment status and handle overdue accounts.' },
        { role: 'Management', desc: 'Review fee revenue reports and outstanding balances.' },
        { role: 'Brokers/Agents', desc: 'View commission statements and payment history.' },
      ]}
      lifecycleStages={[
        { label: 'Config', description: 'Fee type and calculation rules are configured for a product or service.', color: '#f59e0b' },
        { label: 'Invoice Generated', description: 'Invoice created based on a triggering event (policy issuance, renewal, etc).', color: '#3b82f6' },
        { label: 'Sent', description: 'Invoice delivered to the customer via email or portal notification.', color: '#8b5cf6' },
        { label: 'Paid', description: 'Payment received and matched to the invoice. Balance cleared.', color: '#10b981' },
        { label: 'Overdue', description: 'Payment not received by due date. Reminder and escalation triggered.', color: '#ef4444' },
      ]}
      recordings={[
        {
          file: 'fee-management-overview.mp4',
          title: 'Fee Management Overview',
          thumbnail: '',
          timestamp: '2026-03-27',
          duration: 60,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Fee Types', startMs: 10000 },
            { title: 'Invoicing', startMs: 25000 },
            { title: 'Payments & Statements', startMs: 40000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/fee-management/"
      swaggerUrl="/api/fee-management/api-docs"
      faqs={[
        { question: 'What fee calculation methods are supported?', answer: 'Flat amount, percentage of premium, tiered (slab-based), and formula-based. Each method can have minimum and maximum caps.' },
        { question: 'Can fees be waived?', answer: 'Yes. Authorized users can waive fees with a mandatory reason code. Waivers are recorded in the audit trail.' },
        { question: 'How are overdue invoices handled?', answer: 'Configurable reminder schedule (e.g., 7 days, 14 days, 30 days). After the final reminder, the account is flagged for collections.' },
      ]}
      resources={[
        { label: 'Fee Management API (Swagger)', url: 'https://scalatics.com:3118/api', icon: FileText },
        { label: 'Invoice Templates', url: '#', icon: Receipt },
      ]}
    />
  );
};

export default FeeManagementHubPage;

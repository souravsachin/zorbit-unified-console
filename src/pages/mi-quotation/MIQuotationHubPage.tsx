import React from 'react';
import {
  Car,
  FileText,
  Shield,
  Database,
  Calculator,
  Award,
  ClipboardCheck,
  Lock,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const MIQuotationHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="mi-quotation"
      moduleName="MI Quotation"
      moduleDescription="Motor Insurance Quotation &amp; Vehicle Assessment"
      moduleIntro="MI Quotation handles motor insurance applications including vehicle identification, coverage selection, and premium calculation. The module integrates with vehicle databases for make/model/variant lookups, supports multiple coverage types (comprehensive, third-party, own damage), and calculates no-claims discount (NCD) based on claims history."
      icon={Car}
      capabilities={[
        {
          icon: Database,
          title: 'Vehicle Database',
          description: 'Integrated make/model/variant lookup with year-wise vehicle valuation for accurate sum insured calculation.',
        },
        {
          icon: Shield,
          title: 'Coverage Types',
          description: 'Support for comprehensive, third-party liability, own damage, and add-on covers like roadside assistance and zero depreciation.',
        },
        {
          icon: Calculator,
          title: 'Premium Calculation',
          description: 'Real-time premium calculation based on vehicle type, age, location, coverage, and no-claims discount eligibility.',
        },
        {
          icon: Award,
          title: 'No-Claims Discount',
          description: 'Automatic NCD calculation based on claims history. Supports NCD transfer between insurers and NCD protection add-ons.',
        },
        {
          icon: ClipboardCheck,
          title: 'Document Collection',
          description: 'Structured document upload for RC book, driving license, previous policy, and vehicle inspection photos.',
        },
        {
          icon: Lock,
          title: 'PII Protection',
          description: 'Owner details and license numbers are tokenized through the PII Vault. Only tokens are stored in the quotation system.',
        },
      ]}
      targetUsers={[
        { role: 'Insurance Agents', desc: 'Create motor insurance quotations and submit applications.' },
        { role: 'Underwriters', desc: 'Review vehicle risk profiles and approve coverage terms.' },
        { role: 'Claims Analysts', desc: 'Reference policy details during claims assessment.' },
        { role: 'Customers', desc: 'Get instant motor insurance quotes through the self-service portal.' },
      ]}
      lifecycleStages={[
        { label: 'Draft', description: 'Vehicle and owner details are being captured.', color: '#f59e0b' },
        { label: 'Quoted', description: 'Premium calculated and quotation presented to the customer.', color: '#3b82f6' },
        { label: 'Submitted', description: 'Customer accepts the quote and submits for underwriting.', color: '#8b5cf6' },
        { label: 'Under Review', description: 'Underwriter evaluates vehicle risk and coverage terms.', color: '#6366f1' },
        { label: 'Approved', description: 'Application approved. Awaiting payment and document verification.', color: '#10b981' },
        { label: 'Declined', description: 'Application declined due to risk assessment or eligibility.', color: '#ef4444' },
        { label: 'Policy Issued', description: 'Motor insurance policy generated and certificate of insurance delivered.', color: '#06b6d4' },
      ]}
      recordings={[
        {
          file: 'mi-quotation-overview.mp4',
          title: 'MI Quotation Overview',
          thumbnail: '',
          timestamp: '2026-03-18',
          duration: 120,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Vehicle Details', startMs: 15000 },
            { title: 'Coverage Selection', startMs: 40000 },
            { title: 'Premium Calculation', startMs: 65000 },
            { title: 'Submission', startMs: 90000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/mi-quotation/"
      swaggerUrl="/api/mi-quotation/api-docs"
      faqs={[
        { question: 'What vehicle types are supported?', answer: 'Private cars, two-wheelers, commercial vehicles, and fleet vehicles. Each type has specific coverage options and rating factors.' },
        { question: 'How is NCD calculated?', answer: 'NCD is calculated based on the number of claim-free years. Standard slabs: 1yr=20%, 2yr=25%, 3yr=35%, 4yr=45%, 5+yr=50%.' },
        { question: 'Can I transfer NCD from another insurer?', answer: 'Yes. The system supports NCD transfer with verification against the previous insurer records.' },
      ]}
      resources={[
        { label: 'MI Quotation API (Swagger)', url: 'https://scalatics.com:3123/api', icon: FileText },
        { label: 'Vehicle Database Reference', url: '#', icon: Database },
      ]}
    />
  );
};

export default MIQuotationHubPage;

import React from 'react';
import { Contact, Building2, Users, Search, Phone, Globe } from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const DirectoryHubPage: React.FC = () => (
  <ModuleHubPage
    moduleId="directory"
    moduleName="Organization Directory"
    moduleDescription="Central directory of organizations, contacts, and relationships across the platform"
    icon={Contact}
    capabilities={[
      {
        icon: Building2,
        title: 'Organization Profiles',
        description: 'View and manage organization details — legal name, trade license, registration, and contact information.',
      },
      {
        icon: Users,
        title: 'Contact Management',
        description: 'Key contacts per organization with roles, email, phone, and communication preferences.',
      },
      {
        icon: Search,
        title: 'Directory Search',
        description: 'Search organizations by name, license number, type, or region with instant filtering.',
      },
      {
        icon: Phone,
        title: 'Communication Hub',
        description: 'Quick access to email, phone, and messaging channels for any organization contact.',
      },
      {
        icon: Globe,
        title: 'Multi-Region',
        description: 'Directory spans all regions — UAE, India, US — with region-specific fields and formats.',
      },
    ]}
    lifecycleStages={[
      { label: 'Registered', description: 'Organization created in the platform with basic details', color: '#3b82f6' },
      { label: 'Verified', description: 'Trade license and registration documents verified', color: '#f59e0b' },
      { label: 'Active', description: 'Organization is live and participating in platform operations', color: '#10b981' },
      { label: 'Suspended', description: 'Organization temporarily deactivated (license expired, etc)', color: '#ef4444' },
    ]}
    faqs={[
      { question: 'How are organizations added?', answer: 'Organizations are created through the Identity service during onboarding. The Directory provides a read-optimized view.' },
      { question: 'Can I export the directory?', answer: 'Yes — the directory supports CSV and PDF export with configurable columns and filters.' },
    ]}
    resources={[
      { label: 'Organization List', url: '/directory' },
      { label: 'Identity API (Swagger)', url: '/api/identity/api-docs' },
    ]}
  />
);

export default DirectoryHubPage;

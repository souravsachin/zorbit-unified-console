import React from 'react';
import { Calculator, DollarSign, Table2, TrendingUp, Settings, Shield } from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const ProductPricingHubPage: React.FC = () => (
  <ModuleHubPage
    moduleId="product-pricing"
    moduleName="Product Pricing"
    moduleDescription="Insurance premium rating engine — rate tables, age-band lookups, and batch premium calculation"
    icon={Calculator}
    capabilities={[
      {
        icon: Table2,
        title: 'Rate Tables',
        description:
          'Store and manage premium rate tables by insurer, product, variant, and region. Support for age-band, gender, network, plan, and member category dimensions.',
      },
      {
        icon: Calculator,
        title: 'Premium Lookup',
        description:
          'Calculate individual premiums instantly — provide age, gender, network, and copay to get the exact rate from the active rate table.',
      },
      {
        icon: TrendingUp,
        title: 'Batch Calculation',
        description:
          'Calculate premiums for entire families or groups in one API call. Returns per-member breakdown and total premium.',
      },
      {
        icon: DollarSign,
        title: 'Multi-Currency',
        description:
          'Rate tables support any currency — AED, INR, USD, GBP. Currency is stored per rate table, not globally.',
      },
      {
        icon: Settings,
        title: 'Loading & Discounts',
        description:
          'Apply percentage-based loading (UW risk) or discounts (loyalty, group) on top of base rates. Per-member or per-policy.',
      },
      {
        icon: Shield,
        title: 'Version Control',
        description:
          'Rate tables have lifecycle management — draft, active, expired. Only one active table per product variant at a time.',
      },
    ]}
    lifecycleStages={[
      { label: 'Import', description: 'Rate data imported from Excel/CSV or created via API', color: '#3b82f6' },
      { label: 'Draft', description: 'Rate table created but not yet active — available for review', color: '#f59e0b' },
      { label: 'Active', description: 'Rate table is live — used for all premium calculations', color: '#10b981' },
      { label: 'Expired', description: 'Rate table superseded by a newer version — kept for audit', color: '#6b7280' },
    ]}
    recordings={[
      {
        file: 'awnic-product-screencast.mp4',
        title: 'AWNIC Product Screencast',
        thumbnail: '',
        timestamp: '2026-03-31',
        duration: 180,
        chapters: [
          { title: 'Introduction', startMs: 0 },
          { title: 'Product Overview', startMs: 30000 },
          { title: 'Rate Table Walkthrough', startMs: 60000 },
          { title: 'Premium Calculation', startMs: 90000 },
          { title: 'Age Band Lookups', startMs: 120000 },
          { title: 'Summary', startMs: 150000 },
        ],
      },
    ]}
    videosBaseUrl="/demos/product-pricing/"
    swaggerUrl="/api/product-pricing/api-docs"
    faqs={[
      {
        question: 'How do I import a rate table from Excel?',
        answer:
          'Export your Excel rate sheet to JSON (age bands × rates), then POST to /rate-tables with the rate array. The API accepts any combination of age bands, genders, networks, plans, and member categories.',
      },
      {
        question: 'How does age band resolution work?',
        answer:
          'When you call /lookup with age=35, the service finds the matching age band (e.g., [31-35]) from the rate table parameters and returns the corresponding rate.',
      },
      {
        question: 'Can I have different rate structures for different regions?',
        answer:
          'Yes. Each rate table has a variant field (e.g., Dubai vs Abu Dhabi). Dubai uses network-based rates, Abu Dhabi uses plan-based rates with member categories. The same API handles both.',
      },
      {
        question: 'What about copay variants?',
        answer:
          'Copay options (0%, 10%, 20%) are stored as a dimension in the rate table. Each rate entry specifies its copay level, and lookup filters by the requested copay.',
      },
    ]}
    resources={[
      { label: 'Import Rate Card', url: '/product-pricing/import' },
      { label: 'AWNIC NAS Dubai Rate Table (RT-21CD)', url: '/product-pricing/rate-tables' },
      { label: 'AWNIC NAS Abu Dhabi Rate Table (RT-1D27)', url: '/product-pricing/rate-tables' },
    ]}
  />
);

export default ProductPricingHubPage;

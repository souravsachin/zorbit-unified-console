import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Calculator } from 'lucide-react';

export default function ProductPricingSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="product-pricing"
      moduleName="Product Pricing"
      icon={Calculator}
      seedEndpoint="/api/product-pricing/api/v1/G/product-pricing/seed"
      demoSeedEndpoint="/api/product-pricing/api/v1/G/product-pricing/seed/demo"
      demoFlushEndpoint="/api/product-pricing/api/v1/G/product-pricing/seed/demo"
      flushEndpoint="/api/product-pricing/api/v1/G/product-pricing/seed/all"
      healthEndpoint="/api/product-pricing/api/v1/G/product-pricing/health"
    />
  );
}

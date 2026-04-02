import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Calculator } from 'lucide-react';

export default function ProductPricingDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="product-pricing"
      moduleName="Product Pricing"
      icon={Calculator}
    />
  );
}

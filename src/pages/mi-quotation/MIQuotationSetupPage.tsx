import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Car } from 'lucide-react';

export default function MIQuotationSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="mi-quotation"
      moduleName="MI Quotation"
      icon={Car}
      seedEndpoint="/api/mi-quotation/api/v1/G/mi-quotation/seed"
      demoSeedEndpoint="/api/mi-quotation/api/v1/G/mi-quotation/seed/demo"
      demoFlushEndpoint="/api/mi-quotation/api/v1/G/mi-quotation/seed/demo"
      flushEndpoint="/api/mi-quotation/api/v1/G/mi-quotation/seed/all"
      healthEndpoint="/api/mi-quotation/api/v1/G/mi-quotation/health"
    />
  );
}

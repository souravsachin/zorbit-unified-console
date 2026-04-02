import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Receipt } from 'lucide-react';

export default function FeeManagementSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="fee-management"
      moduleName="Fee Management"
      icon={Receipt}
      seedEndpoint="/api/fee-management/api/v1/G/fee-management/seed"
      demoSeedEndpoint="/api/fee-management/api/v1/G/fee-management/seed/demo"
      demoFlushEndpoint="/api/fee-management/api/v1/G/fee-management/seed/demo"
      flushEndpoint="/api/fee-management/api/v1/G/fee-management/seed/all"
      healthEndpoint="/api/fee-management/api/v1/G/fee-management/health"
    />
  );
}

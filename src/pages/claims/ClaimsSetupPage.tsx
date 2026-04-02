import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { ClipboardList } from 'lucide-react';

export default function ClaimsSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="claims"
      moduleName="Claims Core"
      icon={ClipboardList}
      seedEndpoint="/api/claims/api/v1/G/claims/seed"
      demoSeedEndpoint="/api/claims/api/v1/G/claims/seed/demo"
      demoFlushEndpoint="/api/claims/api/v1/G/claims/seed/demo"
      flushEndpoint="/api/claims/api/v1/G/claims/seed/all"
      healthEndpoint="/api/claims/api/v1/G/claims/health"
    />
  );
}

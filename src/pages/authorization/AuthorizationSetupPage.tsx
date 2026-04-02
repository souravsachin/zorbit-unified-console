import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Shield } from 'lucide-react';

export default function AuthorizationSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="authorization"
      moduleName="Authorization Service"
      icon={Shield}
      seedEndpoint="/api/authorization/api/v1/G/authorization/seed"
      demoSeedEndpoint="/api/authorization/api/v1/G/authorization/seed/demo"
      demoFlushEndpoint="/api/authorization/api/v1/G/authorization/seed/demo"
      flushEndpoint="/api/authorization/api/v1/G/authorization/seed/all"
      healthEndpoint="/api/authorization/api/v1/G/authorization/health"
    />
  );
}

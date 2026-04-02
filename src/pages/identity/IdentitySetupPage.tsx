import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Fingerprint } from 'lucide-react';

export default function IdentitySetupPage() {
  return (
    <ModuleSetupPage
      moduleId="identity"
      moduleName="Identity Service"
      icon={Fingerprint}
      seedEndpoint="/api/identity/api/v1/G/identity/seed"
      demoSeedEndpoint="/api/identity/api/v1/G/identity/seed/demo"
      demoFlushEndpoint="/api/identity/api/v1/G/identity/seed/demo"
      flushEndpoint="/api/identity/api/v1/G/identity/seed/all"
      healthEndpoint="/api/identity/api/v1/G/identity/health"
    />
  );
}

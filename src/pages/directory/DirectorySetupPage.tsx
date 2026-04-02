import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Contact } from 'lucide-react';

export default function DirectorySetupPage() {
  return (
    <ModuleSetupPage
      moduleId="directory"
      moduleName="Organization Directory"
      icon={Contact}
      seedEndpoint="/api/identity/api/v1/G/identity/seed"
      demoSeedEndpoint="/api/identity/api/v1/G/identity/seed/demo"
      demoFlushEndpoint="/api/identity/api/v1/G/identity/seed/demo"
      flushEndpoint="/api/identity/api/v1/G/identity/seed/all"
      healthEndpoint="/api/identity/api/v1/G/identity/health"
    />
  );
}

import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Navigation } from 'lucide-react';

export default function NavigationSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="navigation"
      moduleName="Navigation Service"
      icon={Navigation}
      seedEndpoint="/api/navigation/api/v1/G/navigation/seed"
      demoSeedEndpoint="/api/navigation/api/v1/G/navigation/seed/demo"
      demoFlushEndpoint="/api/navigation/api/v1/G/navigation/seed/demo"
      flushEndpoint="/api/navigation/api/v1/G/navigation/seed/all"
      healthEndpoint="/api/navigation/api/v1/G/navigation/health"
    />
  );
}

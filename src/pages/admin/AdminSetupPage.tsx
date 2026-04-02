import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Settings } from 'lucide-react';

export default function AdminSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="admin"
      moduleName="Admin Console"
      icon={Settings}
      seedEndpoint="/api/unified-console/api/v1/G/admin/seed"
      demoSeedEndpoint="/api/unified-console/api/v1/G/admin/seed/demo"
      demoFlushEndpoint="/api/unified-console/api/v1/G/admin/seed/demo"
      flushEndpoint="/api/unified-console/api/v1/G/admin/seed/all"
      healthEndpoint="/api/unified-console/api/v1/G/admin/health"
    />
  );
}

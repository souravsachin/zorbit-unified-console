import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { FileSearch } from 'lucide-react';

export default function AuditSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="audit"
      moduleName="Audit Service"
      icon={FileSearch}
      seedEndpoint="/api/audit/api/v1/G/audit/seed"
      demoSeedEndpoint="/api/audit/api/v1/G/audit/seed/demo"
      demoFlushEndpoint="/api/audit/api/v1/G/audit/seed/demo"
      flushEndpoint="/api/audit/api/v1/G/audit/seed/all"
      healthEndpoint="/api/audit/api/v1/G/audit/health"
    />
  );
}

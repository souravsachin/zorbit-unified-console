import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { EyeOff } from 'lucide-react';

export default function PIIShowcaseSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="pii-showcase"
      moduleName="PII Showcase"
      icon={EyeOff}
      seedEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed"
      demoSeedEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed/demo"
      demoFlushEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed/demo"
      flushEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed/all"
      healthEndpoint="/api/pii-vault/api/v1/G/pii-vault/health"
    />
  );
}

import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Lock } from 'lucide-react';

export default function PiiVaultSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="pii-vault"
      moduleName="PII Vault"
      icon={Lock}
      seedEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed"
      demoSeedEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed/demo"
      demoFlushEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed/demo"
      flushEndpoint="/api/pii-vault/api/v1/G/pii-vault/seed/all"
      healthEndpoint="/api/pii-vault/api/v1/G/pii-vault/health"
    />
  );
}

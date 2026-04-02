import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Lock } from 'lucide-react';

export default function PiiVaultDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="pii-vault"
      moduleName="PII Vault"
      icon={Lock}
    />
  );
}

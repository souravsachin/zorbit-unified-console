import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Fingerprint } from 'lucide-react';

export default function IdentityDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="identity"
      moduleName="Identity Service"
      icon={Fingerprint}
    />
  );
}

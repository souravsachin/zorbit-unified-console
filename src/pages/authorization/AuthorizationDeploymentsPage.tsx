import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Shield } from 'lucide-react';

export default function AuthorizationDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="authorization"
      moduleName="Authorization Service"
      icon={Shield}
    />
  );
}

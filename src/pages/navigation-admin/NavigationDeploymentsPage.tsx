import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Navigation } from 'lucide-react';

export default function NavigationDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="navigation"
      moduleName="Navigation Service"
      icon={Navigation}
    />
  );
}

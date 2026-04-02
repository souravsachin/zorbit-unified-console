import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { ClipboardList } from 'lucide-react';

export default function ClaimsDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="claims"
      moduleName="Claims Core"
      icon={ClipboardList}
    />
  );
}

import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Receipt } from 'lucide-react';

export default function FeeManagementDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="fee-management"
      moduleName="Fee Management"
      icon={Receipt}
    />
  );
}

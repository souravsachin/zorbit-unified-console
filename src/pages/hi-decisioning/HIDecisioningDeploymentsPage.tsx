import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Brain } from 'lucide-react';

export default function HIDecisioningDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="hi-decisioning"
      moduleName="HI Decisioning"
      icon={Brain}
    />
  );
}

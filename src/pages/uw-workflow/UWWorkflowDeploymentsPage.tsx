import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { GitBranch } from 'lucide-react';

export default function UWWorkflowDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="uw-workflow"
      moduleName="UW Workflow"
      icon={GitBranch}
    />
  );
}

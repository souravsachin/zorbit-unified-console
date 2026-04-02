import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="dashboard"
      moduleName="Dashboard"
      icon={LayoutDashboard}
    />
  );
}

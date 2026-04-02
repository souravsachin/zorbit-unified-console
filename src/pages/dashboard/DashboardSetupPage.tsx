import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="dashboard"
      moduleName="Dashboard"
      icon={LayoutDashboard}
      seedEndpoint="/api/identity/api/v1/G/dashboard/seed"
      healthEndpoint="/api/identity/api/v1/G/identity/health"
    />
  );
}

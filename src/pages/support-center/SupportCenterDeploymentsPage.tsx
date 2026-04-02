import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Headset } from 'lucide-react';

export default function SupportCenterDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="support-center"
      moduleName="Support Center"
      icon={Headset}
    />
  );
}

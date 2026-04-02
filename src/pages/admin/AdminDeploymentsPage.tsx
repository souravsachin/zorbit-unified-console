import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Settings } from 'lucide-react';

export default function AdminDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="admin"
      moduleName="Admin Console"
      icon={Settings}
    />
  );
}

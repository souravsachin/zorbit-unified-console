import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Contact } from 'lucide-react';

export default function DirectoryDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="directory"
      moduleName="Organization Directory"
      icon={Contact}
    />
  );
}

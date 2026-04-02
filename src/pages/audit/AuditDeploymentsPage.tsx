import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { FileSearch } from 'lucide-react';

export default function AuditDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="audit"
      moduleName="Audit Service"
      icon={FileSearch}
    />
  );
}

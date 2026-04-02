import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { FileInput } from 'lucide-react';

export default function FormBuilderDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="form-builder"
      moduleName="Form Builder"
      icon={FileInput}
    />
  );
}

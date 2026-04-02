import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { EyeOff } from 'lucide-react';

export default function PIIShowcaseDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="pii-showcase"
      moduleName="PII Showcase"
      icon={EyeOff}
    />
  );
}

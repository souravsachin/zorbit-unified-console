import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Sparkles } from 'lucide-react';

export default function JaynaDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="jayna"
      moduleName="Jayna AI Calling"
      icon={Sparkles}
    />
  );
}

import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Sparkles } from 'lucide-react';

export default function JaynaSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="jayna"
      moduleName="Jayna AI Calling"
      icon={Sparkles}
      seedEndpoint="/api/jayna/api/v1/G/jayna/seed"
      demoSeedEndpoint="/api/jayna/api/v1/G/jayna/seed/demo"
      demoFlushEndpoint="/api/jayna/api/v1/G/jayna/seed/demo"
      flushEndpoint="/api/jayna/api/v1/G/jayna/seed/all"
      healthEndpoint="/api/jayna/api/v1/G/jayna/health"
    />
  );
}

import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Headset } from 'lucide-react';

export default function SupportCenterSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="support-center"
      moduleName="Support Center"
      icon={Headset}
      seedEndpoint="/api/chat/api/v1/G/chat/seed"
      demoSeedEndpoint="/api/chat/api/v1/G/chat/seed/demo"
      demoFlushEndpoint="/api/chat/api/v1/G/chat/seed/demo"
      flushEndpoint="/api/chat/api/v1/G/chat/seed/all"
      healthEndpoint="/api/chat/api/v1/G/chat/health"
    />
  );
}

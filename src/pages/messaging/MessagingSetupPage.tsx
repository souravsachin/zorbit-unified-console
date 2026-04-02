import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { MessageSquare } from 'lucide-react';

export default function MessagingSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="messaging"
      moduleName="Messaging Service"
      icon={MessageSquare}
      seedEndpoint="/api/messaging/api/v1/G/messaging/seed"
      demoSeedEndpoint="/api/messaging/api/v1/G/messaging/seed/demo"
      demoFlushEndpoint="/api/messaging/api/v1/G/messaging/seed/demo"
      flushEndpoint="/api/messaging/api/v1/G/messaging/seed/all"
      healthEndpoint="/api/messaging/api/v1/G/messaging/health"
    />
  );
}

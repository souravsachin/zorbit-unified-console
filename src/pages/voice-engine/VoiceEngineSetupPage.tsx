import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Mic } from 'lucide-react';

export default function VoiceEngineSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="voice-engine"
      moduleName="Voice Engine"
      icon={Mic}
      seedEndpoint="/api/voice-engine/api/v1/G/voice/seed"
      demoSeedEndpoint="/api/voice-engine/api/v1/G/voice/seed/demo"
      demoFlushEndpoint="/api/voice-engine/api/v1/G/voice/seed/demo"
      flushEndpoint="/api/voice-engine/api/v1/G/voice/seed/all"
      healthEndpoint="/api/voice-engine/api/v1/G/voice/health"
    />
  );
}

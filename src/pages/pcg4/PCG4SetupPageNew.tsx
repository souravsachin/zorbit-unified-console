import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { Package } from 'lucide-react';

/**
 * Reusable ModuleSetupPage wrapper for PCG4.
 * The original PCG4SetupPage has a custom SSE-based implementation
 * with table inventory. This wrapper provides the standardized
 * setup page. The original remains at /app/pcg4/setup.
 */
export default function PCG4SetupPageNew() {
  return (
    <ModuleSetupPage
      moduleId="pcg4"
      moduleName="PCG4 (Products)"
      icon={Package}
      seedEndpoint="/api/app/pcg4/api/v1/G/pcg4/seed"
      demoSeedEndpoint="/api/app/pcg4/api/v1/G/pcg4/seed/demo"
      demoFlushEndpoint="/api/app/pcg4/api/v1/G/pcg4/seed/demo"
      flushEndpoint="/api/app/pcg4/api/v1/G/pcg4/seed/all"
      healthEndpoint="/api/app/pcg4/api/v1/G/pcg4/health"
    />
  );
}

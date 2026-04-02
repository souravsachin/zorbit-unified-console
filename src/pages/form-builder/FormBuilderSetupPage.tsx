import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { FileInput } from 'lucide-react';

export default function FormBuilderSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="form-builder"
      moduleName="Form Builder"
      icon={FileInput}
      seedEndpoint="/api/form-builder/api/v1/G/form-builder/seed"
      demoSeedEndpoint="/api/form-builder/api/v1/G/form-builder/seed/demo"
      demoFlushEndpoint="/api/form-builder/api/v1/G/form-builder/seed/demo"
      flushEndpoint="/api/form-builder/api/v1/G/form-builder/seed/all"
      healthEndpoint="/api/form-builder/api/v1/G/form-builder/health"
    />
  );
}

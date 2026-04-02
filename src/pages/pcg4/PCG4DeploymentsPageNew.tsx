import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Package } from 'lucide-react';

/**
 * Reusable ModuleDeploymentsPage wrapper for PCG4.
 * The original PCG4DeploymentsPage has a custom placeholder.
 * This wrapper provides the standardized deployments page.
 * The original remains at /app/pcg4/deployments.
 */
export default function PCG4DeploymentsPageNew() {
  return (
    <ModuleDeploymentsPage
      moduleId="pcg4"
      moduleName="PCG4 (Products)"
      icon={Package}
    />
  );
}

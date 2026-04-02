import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { Car } from 'lucide-react';

export default function MIQuotationDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="mi-quotation"
      moduleName="MI Quotation"
      icon={Car}
    />
  );
}

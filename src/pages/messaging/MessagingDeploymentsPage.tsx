import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { MessageSquare } from 'lucide-react';

export default function MessagingDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="messaging"
      moduleName="Messaging Service"
      icon={MessageSquare}
    />
  );
}

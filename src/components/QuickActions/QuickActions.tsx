import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ScrollText, Settings, LayoutDashboard } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  icon: LucideIcon;
  title: string;
  description: string;
  route: string;
}

const defaultActions: QuickAction[] = [
  {
    icon: UserPlus,
    title: 'New Customer',
    description: 'Create a new customer record',
    route: '/customers',
  },
  {
    icon: ScrollText,
    title: 'View Audit Logs',
    description: 'Review recent system activity',
    route: '/audit',
  },
  {
    icon: LayoutDashboard,
    title: 'Design Dashboard',
    description: 'Customize your dashboard widgets',
    route: '/dashboard-designer',
  },
  {
    icon: Settings,
    title: 'Profile Settings',
    description: 'Update your account preferences',
    route: '/settings',
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions = defaultActions }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <button
          key={action.route}
          onClick={() => navigate(action.route)}
          className="card p-4 text-left hover:ring-2 hover:ring-primary-400 transition-all group"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
              <action.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{action.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;

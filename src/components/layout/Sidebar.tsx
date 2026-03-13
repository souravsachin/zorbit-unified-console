import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  UserCircle,
  ScrollText,
  Mail,
  Navigation,
  FileText,
  Settings,
  Lock,
  Play,
  GraduationCap,
  Gauge,
  Pencil,
  Table2,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard-view', icon: Gauge, label: 'Dashboard View' },
  { to: '/dashboard-designer', icon: Pencil, label: 'Dashboard Designer' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/organizations', icon: Building2, label: 'Organizations' },
  { to: '/roles', icon: Shield, label: 'Roles & Privileges' },
  { to: '/customers', icon: UserCircle, label: 'Customers' },
  { to: '/navigation', icon: Navigation, label: 'Navigation' },
  { to: '/messaging', icon: Mail, label: 'Messaging' },
  { to: '/audit', icon: ScrollText, label: 'Audit Logs' },
  { to: '/pii-vault', icon: Lock, label: 'PII Vault' },
  { to: '/api-docs', icon: FileText, label: 'API Docs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/demo', icon: Play, label: 'Demo' },
  { to: '/demo-training', icon: GraduationCap, label: 'Training Center' },
  { to: '/data-table-demo', icon: Table2, label: 'Data Table Demo' },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 transform transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-bold text-lg">Zorbit</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

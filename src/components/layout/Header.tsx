import React from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  showHamburger?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, darkMode, onDarkModeToggle, showHamburger = true }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center">
        {showHamburger && (
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={onDarkModeToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {user && (
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.displayName || user.email}</p>
              <p className="text-xs text-gray-500">{user.email && user.email !== user.displayName ? user.email : user.organizationId}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

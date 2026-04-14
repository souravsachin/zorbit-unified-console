import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NoAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    localStorage.removeItem('zorbit_token');
    localStorage.removeItem('zorbit_user');
    const domain = window.location.hostname.split('.').slice(-2).join('.');
    document.cookie = `zorbit_token=; domain=.${domain}; path=/; max-age=0; SameSite=Lax; Secure`;
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zorbit Platform</h1>
        </div>

        <div className="card p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <ShieldOff className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              No Access Assigned
            </h2>
            {user?.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Signed in as <span className="font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
              </p>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
              Your account does not have access to any Zorbit modules yet.
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Please contact your administrator or the person who provided your credentials to request access.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="btn-primary w-full"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoAccessPage;

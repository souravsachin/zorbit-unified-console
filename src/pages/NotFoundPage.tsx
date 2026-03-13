import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn(`[Zorbit] Route not found: ${location.pathname}`);
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-4 mb-6">
        <AlertTriangle size={48} className="text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Page Not Available
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-2">
        This module is not yet implemented or the route is not registered.
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-8">
        {location.pathname}
      </p>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Home size={16} />
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;

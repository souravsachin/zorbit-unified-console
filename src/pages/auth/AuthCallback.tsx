import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token) {
      localStorage.setItem('zorbit_token', token);
      if (refresh) {
        localStorage.setItem('zorbit_refresh_token', refresh);
      }

      // Decode user info from token and store it
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        const userInfo = {
          id: decoded.sub || decoded.id,
          email: decoded.email,
          displayName: decoded.displayName || decoded.name || decoded.email,
          organizationId: decoded.organizationId || decoded.orgId || 'O-DEMO',
        };
        localStorage.setItem('zorbit_user', JSON.stringify(userInfo));
      } catch {
        // Token will still work; user info will be decoded on next page load
      }

      navigate('/', { replace: true });
    } else {
      const errorMsg =
        searchParams.get('error') || 'Authentication failed. No token received.';
      setError(errorMsg);
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="card p-8 space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Authentication Failed
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
            <Link
              to="/login"
              className="btn-primary inline-block px-6 py-2"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="card p-8 space-y-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Completing sign in...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

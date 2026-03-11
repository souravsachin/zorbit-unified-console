import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { identityService } from '../../services/identity';
import { useToast } from '../../components/shared/Toast';
import api from '../../services/api';
import { API_CONFIG } from '../../config';

interface AuthProvider {
  id: string;
  name: string;
  enabled: boolean;
  label?: string;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<AuthProvider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await api.get<AuthProvider[]>(
          `${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/providers`,
        );
        const enabled = (res.data || []).filter((p) => p.enabled);
        setProviders(enabled);
      } catch {
        // Providers endpoint unavailable — hide OAuth section
        setProviders([]);
      } finally {
        setProvidersLoaded(true);
      }
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await identityService.login({ email, password });
      const token = res.data.accessToken || res.data.token;
      login(token, res.data.user);
      toast('Logged in successfully', 'success');
    } catch {
      toast('Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = (providerId: string) => {
    const url = `${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/${providerId}`;
    window.location.href = url;
  };

  const providerButton = (provider: AuthProvider) => {
    const id = provider.id.toLowerCase();

    if (id === 'google') {
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      );
    }

    if (id === 'github') {
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-950 hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors text-sm font-medium text-white"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Sign in with GitHub
        </button>
      );
    }

    if (id === 'linkedin') {
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium text-white"
          style={{ backgroundColor: '#0A66C2' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Sign in with LinkedIn
        </button>
      );
    }

    // SSO / generic provider
    const label = provider.label || `Sign in with ${provider.name || 'SSO'}`;
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleOAuthClick(id)}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium text-white"
      >
        <Lock className="w-5 h-5" />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold">Zorbit Admin Console</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@zorbit.io"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {providersLoaded && providers.length > 0 && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {providers.map((p) => providerButton(p))}
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

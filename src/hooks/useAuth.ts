import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearAllLocalPrefs,
} from '../services/preferences';
import { clearMenuCache } from '../components/HamburgerMenu/useMenu';

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  organizationId: string;
}

function decodeToken(token: string): UserInfo | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      displayName: decoded.displayName || decoded.name || decoded.email,
      organizationId: decoded.org || decoded.organizationId || decoded.orgId || 'O-DEMO',
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(() => {
    const token = localStorage.getItem('zorbit_token');
    if (token) {
      return decodeToken(token);
    }
    const stored = localStorage.getItem('zorbit_user');
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = !!user;

  const login = useCallback(
    (token: string, userInfo?: UserInfo) => {
      localStorage.setItem('zorbit_token', token);
      // Set cookie on parent domain so ALL subdomains can read it
      // (needed for nginx auth_request on livestream.scalatics.com, chat.scalatics.com, etc.)
      const domain = window.location.hostname.split('.').slice(-2).join('.');
      document.cookie = `zorbit_token=${token}; domain=.${domain}; path=/; max-age=3600; SameSite=Lax; Secure`;
      const info = userInfo || decodeToken(token);
      if (info) {
        localStorage.setItem('zorbit_user', JSON.stringify(info));
        setUser(info);
      }
      // Check for returnTo parameter (used by SSO and auth gateway flows)
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      if (returnTo && returnTo.startsWith('http')) {
        window.location.href = returnTo;
      } else {
        navigate(returnTo || '/');
      }
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    // Clear auth state
    localStorage.removeItem('zorbit_token');
    localStorage.removeItem('zorbit_user');
    // Clear cookie on parent domain
    const domain = window.location.hostname.split('.').slice(-2).join('.');
    document.cookie = `zorbit_token=; domain=.${domain}; path=/; max-age=0; SameSite=Lax; Secure`;

    // Clear all user preferences and cached menu
    clearAllLocalPrefs();
    clearMenuCache();

    setUser(null);
    navigate('/login');
  }, [navigate, user]);

  const orgId = user?.organizationId || 'O-DEMO';

  // Auth redirect is handled by ProtectedRoute in App.tsx — no useEffect needed here

  return { user, isAuthenticated, login, logout, orgId };
}

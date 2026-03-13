import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadLocalPrefs,
  savePrefsToServer,
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
      organizationId: decoded.organizationId || decoded.orgId || 'O-DEMO',
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
      const info = userInfo || decodeToken(token);
      if (info) {
        localStorage.setItem('zorbit_user', JSON.stringify(info));
        setUser(info);
      }
      navigate('/');
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    // Sync preferences to backend before clearing (token still valid here)
    const currentUser = user;
    if (currentUser?.id) {
      try {
        const prefs = loadLocalPrefs(currentUser.id);
        if (Object.keys(prefs).length > 0) {
          await savePrefsToServer(currentUser.id, prefs);
        }
      } catch {
        // Best-effort — don't block logout
      }
    }

    // Clear auth state
    localStorage.removeItem('zorbit_token');
    localStorage.removeItem('zorbit_user');

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

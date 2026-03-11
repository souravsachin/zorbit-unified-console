import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const logout = useCallback(() => {
    localStorage.removeItem('zorbit_token');
    localStorage.removeItem('zorbit_user');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const orgId = user?.organizationId || 'O-DEMO';

  useEffect(() => {
    const token = localStorage.getItem('zorbit_token');
    if (!token && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      navigate('/login');
    }
  }, [navigate]);

  return { user, isAuthenticated, login, logout, orgId };
}

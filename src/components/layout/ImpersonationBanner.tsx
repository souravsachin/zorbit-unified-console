import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { identityService } from '../../services/identity';

/**
 * Parse the JWT payload from localStorage without verifying signature.
 */
function parseJwt(): Record<string, any> | null {
  try {
    const token = localStorage.getItem('zorbit_token');
    if (!token) return null;
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Persistent amber banner shown at the very top of the page when
 * the current session is an impersonation session (JWT has impersonating: true).
 *
 * Displays who is being impersonated and a button to exit impersonation.
 */
const ImpersonationBanner: React.FC = () => {
  const [exiting, setExiting] = useState(false);
  const token = parseJwt();

  if (!token?.impersonating) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      const res = await identityService.exitImpersonation();
      const data = res.data;
      if (data?.accessToken) {
        localStorage.setItem('zorbit_token', data.accessToken);
        // Set cookie on parent domain
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `zorbit_token=${data.accessToken}; domain=.${domain}; path=/; max-age=3600; SameSite=Lax; Secure`;
        // Update stored user info from new token
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          localStorage.setItem('zorbit_user', JSON.stringify({
            id: payload.sub,
            email: payload.email,
            displayName: payload.displayName || payload.email,
            organizationId: payload.org,
          }));
        } catch { /* ignore */ }
        window.location.reload();
      }
    } catch {
      setExiting(false);
    }
  };

  return (
    <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3 z-50 flex-shrink-0">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        Viewing as <strong>{token.displayName}</strong>
        {token.realDisplayName && (
          <span className="opacity-80"> (you: {token.realDisplayName})</span>
        )}
      </span>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="ml-2 inline-flex items-center gap-1 px-3 py-0.5 rounded bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        <X className="w-3 h-3" />
        {exiting ? 'Exiting...' : 'Exit Impersonation'}
      </button>
    </div>
  );
};

export default ImpersonationBanner;

// =============================================================================
// PII Visibility Hook
// =============================================================================
// Returns the PII visibility level for the current user based on their role.
//
// Visibility levels:
//   'full'     - Real PII values shown (quotation officers, brokers who own the case)
//   'nickname' - Fake culturally-matched alias shown (medical underwriters)
//   'masked'   - Partial masking with lock icon (default for unknown roles)
//   'hidden'   - "RESTRICTED" placeholder, no PII at all (rules admins, actuaries)
//
// Role detection:
//   1. Check localStorage 'zorbit_active_role' (set by role-switcher or login)
//   2. Fall back to JWT email pattern matching (demo convention)
//   3. Default to 'masked'
// =============================================================================

import { useMemo } from 'react';

export type PiiVisibilityLevel = 'full' | 'nickname' | 'masked' | 'hidden';

/** Role codes that map to each visibility level */
const FULL_ACCESS_ROLES = [
  'quotation-officer',
  'broker',
  'sales-agent',
  'customer-service',
];

const NICKNAME_ROLES = [
  'medical-underwriter',
  'financial-underwriter',
  'underwriter',
  'claims-assessor',
];

const HIDDEN_ROLES = [
  'uw-rules-admin',
  'actuary',
  'product-designer',
  'data-analyst',
  'compliance-officer',
];

/** Demo email-to-role mapping (convention: email prefix indicates role) */
const EMAIL_ROLE_MAP: Record<string, string> = {
  'dr.fatima':       'medical-underwriter',
  'fatima.uw':       'medical-underwriter',
  'med.uw':          'medical-underwriter',
  'fin.uw':          'financial-underwriter',
  'quotation':       'quotation-officer',
  'broker':          'broker',
  'sales':           'sales-agent',
  'rules.admin':     'uw-rules-admin',
  'actuary':         'actuary',
  'product':         'product-designer',
  'data.analyst':    'data-analyst',
  'compliance':      'compliance-officer',
};

function resolveRole(email?: string): string | null {
  // 1. Explicit role from localStorage (set by role-switcher UI)
  try {
    const explicit = localStorage.getItem('zorbit_active_role');
    if (explicit) return explicit;
  } catch {
    // SSR or restricted storage
  }

  // 2. Email prefix matching (demo convention)
  if (email) {
    const prefix = email.split('@')[0]?.toLowerCase() || '';
    for (const [pattern, role] of Object.entries(EMAIL_ROLE_MAP)) {
      if (prefix === pattern || prefix.startsWith(pattern)) {
        return role;
      }
    }
  }

  return null;
}

function roleToVisibility(role: string | null): PiiVisibilityLevel {
  if (!role) return 'masked'; // safe default
  if (FULL_ACCESS_ROLES.includes(role)) return 'full';
  if (NICKNAME_ROLES.includes(role)) return 'nickname';
  if (HIDDEN_ROLES.includes(role)) return 'hidden';
  return 'masked';
}

/**
 * Hook: returns PII visibility level based on the current user's role.
 *
 * @param userEmail  The logged-in user's email (from useAuth)
 * @returns { visibility, role, setRole }
 */
export function usePiiVisibility(userEmail?: string) {
  const role = useMemo(() => resolveRole(userEmail), [userEmail]);
  const visibility = useMemo(() => roleToVisibility(role), [role]);

  /** Programmatically override the active role (e.g., from a role-switcher dropdown) */
  const setRole = (newRole: string | null) => {
    if (newRole) {
      localStorage.setItem('zorbit_active_role', newRole);
    } else {
      localStorage.removeItem('zorbit_active_role');
    }
    // Force re-render by reloading — simplest approach for demo.
    // In production, use a context/state management solution.
    window.location.reload();
  };

  return { visibility, role, setRole };
}

/**
 * Pure function version (no hook) for use outside React components.
 */
export function getPiiVisibility(userEmail?: string): PiiVisibilityLevel {
  const role = resolveRole(userEmail);
  return roleToVisibility(role);
}

/**
 * All available roles for the role-switcher UI.
 */
export const PII_ROLE_OPTIONS = [
  { value: 'quotation-officer',     label: 'Quotation Officer',     visibility: 'full' as const },
  { value: 'broker',                label: 'Broker',                visibility: 'full' as const },
  { value: 'medical-underwriter',   label: 'Medical Underwriter',   visibility: 'nickname' as const },
  { value: 'financial-underwriter', label: 'Financial Underwriter', visibility: 'nickname' as const },
  { value: 'uw-rules-admin',        label: 'UW Rules Admin',        visibility: 'hidden' as const },
  { value: 'actuary',               label: 'Actuary',               visibility: 'hidden' as const },
  { value: 'product-designer',      label: 'Product Designer',      visibility: 'hidden' as const },
];

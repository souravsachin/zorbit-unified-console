import { API_CONFIG } from '../config';
import api from './api';

/**
 * SHA-256 hash a password in the browser using Web Crypto API.
 * Returns lowercase hex string (64 chars).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  organizationId?: string;
}

export interface User {
  id: string;
  hashId: string;
  email: string;
  emailToken: string;
  displayName: string;
  organizationId: string;
  organizationHashId: string;
  title: string | null;
  department: string | null;
  role: string | null;
  status: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  hashId?: string;
  name: string;
  slug: string;
  orgType: string;
  status: string;
  isCustomer: boolean;
  isPaying: boolean;
  lastPaymentReceivedAt: string | null;
  customerStatus: string | null;
  createdAt: string;
}

export const identityService = {
  login: (payload: LoginPayload) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/login`, payload),

  register: (payload: RegisterPayload) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/register`, payload),

  getUsers: (orgId: string, params?: Record<string, unknown>) =>
    api.get<User[]>(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users`, { params }),

  getUser: (orgId: string, userId: string) =>
    api.get<User>(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users/${userId}`),

  createUser: (orgId: string, payload: Partial<User> & { password: string }) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users`, payload),

  getOrganizations: (params?: Record<string, unknown>) =>
    api.get<Organization[]>(`${API_CONFIG.IDENTITY_URL}/api/v1/G/organizations`, { params }),

  deleteUser: (orgId: string, userId: string) =>
    api.delete(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users/${userId}`),

  createOrganization: (payload: Partial<Organization>) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/organizations`, payload),

  updateOrganization: (orgId: string, payload: Partial<Organization>) =>
    api.put(`${API_CONFIG.IDENTITY_URL}/api/v1/G/organizations/${orgId}`, payload),

  // ─── MFA ─────────────────────────────────────────────────────────
  mfaSetup: () =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/mfa/setup`),

  mfaVerifySetup: (code: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/mfa/verify`, { code }),

  mfaValidateLogin: (tempToken: string, code: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/mfa/validate`, { tempToken, code }),

  mfaBackupVerify: (tempToken: string, backupCode: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/mfa/backup-verify`, { tempToken, backupCode }),

  mfaDisable: (code: string) =>
    api.delete(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/mfa/disable`, { data: { code } }),

  mfaStatus: () =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/mfa/status`),

  // ─── WebAuthn / Passkeys ────────────────────────────────────────
  webauthnRegisterOptions: () =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/webauthn/register-options`),

  webauthnRegisterVerify: (credential: any, deviceName?: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/webauthn/register-verify`, { credential, deviceName }),

  webauthnLoginOptions: (email: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/webauthn/login-options`, { email }),

  webauthnLoginVerify: (email: string, credential: any) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/webauthn/login-verify`, { email, credential }),

  webauthnListCredentials: () =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/webauthn/credentials`),

  webauthnRemoveCredential: (credentialId: string) =>
    api.delete(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/webauthn/credentials/${encodeURIComponent(credentialId)}`),

  // ─── QR Code Login ──────────────────────────────────────────────
  qrGenerate: () =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/qr/generate`),

  qrConfirm: (sessionId: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/qr/confirm`, { sessionId }),

  qrStatus: (sessionId: string) =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/qr/status/${sessionId}`),

  // ─── Magic Link ─────────────────────────────────────────────────
  magicLinkSend: (email: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/magic-link/send`, { email }),

  // ─── Email OTP ──────────────────────────────────────────────────
  emailOtpSend: (email: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/email-otp/send`, { email }),

  emailOtpVerify: (email: string, otp: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/email-otp/verify`, { email, otp }),

  // ─── Auth Methods (admin) ──────────────────────────────────────
  updateAuthMethods: (orgId: string, userId: string, methods: Record<string, boolean>) =>
    api.put(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users/${userId}/auth-methods`, methods),

  // ─── Password Management ��─────────────────────────────────────���
  changePassword: (currentPassword: string, newPassword: string, mfaCode?: string) =>
    api.put(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/change-password`, { currentPassword, newPassword, mfaCode }),

  adminResetPassword: (userHashId: string, newPassword: string, requirePasswordChange?: boolean, sendEmail?: boolean) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/admin-reset-password`, { userHashId, newPassword, requirePasswordChange, sendEmail }),

  forgotPassword: (email: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/forgot-password`, { email }),

  validateResetToken: (token: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/validate-reset-token`, { token }),

  resetPassword: (token: string, newPassword: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/reset-password`, { token, newPassword }),

  forceChangePassword: (tempToken: string, newPassword: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/force-change-password`, { tempToken, newPassword }),

  // ─── Sessions ───────────────────────────────────────────────────
  getSessions: (userId: string) =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/U/${userId}/sessions`),

  revokeSession: (userId: string, sessionId: string) =>
    api.delete(`${API_CONFIG.IDENTITY_URL}/api/v1/U/${userId}/sessions/${sessionId}`),

  // ─── Impersonation (Sudo) ──────────────────────────────────────
  impersonate: (targetUserHashId: string) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/impersonate`, { targetUserHashId }),

  exitImpersonation: () =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/exit-impersonation`),

  // ─── Organization Security Policy ──────────────────────────────
  getOrganization: (orgId: string) =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/G/organizations/${orgId}`),

  // ─── Departments / Hierarchy ────────────────────────────────────
  getOrgHierarchy: (orgId: string) =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/organizations/hierarchy`),

  createDepartment: (orgId: string, payload: { name: string }) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/departments`, payload),

  // ─── Org Chart ──────────────────────────────────────────────────
  getOrgChart: (orgId: string) =>
    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users/org-chart`),
};

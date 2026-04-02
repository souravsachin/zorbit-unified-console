import { API_CONFIG } from '../config';
import api from './api';

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
};

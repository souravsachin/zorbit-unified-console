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
  email: string;
  displayName: string;
  organizationId: string;
  status: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export const identityService = {
  login: (payload: LoginPayload) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/login`, payload),

  register: (payload: RegisterPayload) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/register`, payload),

  getUsers: (orgId: string) =>
    api.get<User[]>(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users`),

  getUser: (orgId: string, userId: string) =>
    api.get<User>(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users/${userId}`),

  createUser: (orgId: string, payload: Partial<User> & { password: string }) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${orgId}/users`, payload),

  getOrganizations: () =>
    api.get<Organization[]>(`${API_CONFIG.IDENTITY_URL}/api/v1/G/organizations`),

  createOrganization: (payload: Partial<Organization>) =>
    api.post(`${API_CONFIG.IDENTITY_URL}/api/v1/G/organizations`, payload),
};

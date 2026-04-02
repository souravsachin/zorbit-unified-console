import { API_CONFIG } from '../config';
import api from './api';

export interface Role {
  id: string;
  name: string;
  description: string;
  privileges: string[];
  organizationId: string;
  createdAt: string;
}

export interface Privilege {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export const authorizationService = {
  getRoles: (orgId: string) =>
    api.get<Role[]>(`${API_CONFIG.AUTHORIZATION_URL}/api/v1/O/${orgId}/roles`),

  getRole: (orgId: string, roleId: string) =>
    api.get<Role>(`${API_CONFIG.AUTHORIZATION_URL}/api/v1/O/${orgId}/roles/${roleId}`),

  createRole: (orgId: string, payload: Partial<Role>) =>
    api.post(`${API_CONFIG.AUTHORIZATION_URL}/api/v1/O/${orgId}/roles`, payload),

  getPrivileges: (orgId: string) =>
    api.get<Privilege[]>(`${API_CONFIG.AUTHORIZATION_URL}/api/v1/O/${orgId}/privileges`),

  createPrivilege: (orgId: string, payload: Partial<Privilege>) =>
    api.post(`${API_CONFIG.AUTHORIZATION_URL}/api/v1/O/${orgId}/privileges`, payload),
};

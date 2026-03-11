import { API_CONFIG } from '../config';
import api from './api';

export interface PiiAuditEntry {
  id: string;
  token: string;
  fieldType: string;
  accessedBy: string;
  accessedAt: string;
  action: string;
  reason: string;
}

export const piiVaultService = {
  getAuditLog: (orgId: string, query?: { page?: number; limit?: number }) =>
    api.get<{ data: PiiAuditEntry[]; total: number }>(
      `${API_CONFIG.PII_VAULT_URL}/api/v1/O/${orgId}/pii/audit`,
      { params: query },
    ),
};

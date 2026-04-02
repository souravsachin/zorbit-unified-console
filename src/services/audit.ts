import { API_CONFIG } from '../config';
import api from './api';

export interface AuditEvent {
  id: string;
  eventType: string;
  actor: string;
  resource: string;
  action: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  eventType?: string;
  actor?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  getEvents: (orgId: string, query?: AuditQuery) =>
    api.get<{ data: AuditEvent[]; total: number }>(
      `${API_CONFIG.AUDIT_URL}/api/v1/O/${orgId}/audit/logs`,
      { params: query },
    ),

  getEvent: (orgId: string, eventId: string) =>
    api.get<AuditEvent>(`${API_CONFIG.AUDIT_URL}/api/v1/O/${orgId}/audit/logs/${eventId}`),
};

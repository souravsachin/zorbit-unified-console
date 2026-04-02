import { API_CONFIG } from '../config';
import api from './api';

export interface Topic {
  hashId: string;
  name: string;
  partitions: number;
  replicationFactor: number;
  retentionMs: number;
  createdAt: string;
}

export interface DLQEntry {
  id: string;
  topic: string;
  originalMessage: Record<string, unknown>;
  error: string;
  timestamp: string;
  retryCount: number;
}

export interface HealthStatus {
  status: string;
  broker: string;
  topics: number;
  uptime: number;
}

export const messagingService = {
  getTopics: () =>
    api.get<Topic[]>(`${API_CONFIG.MESSAGING_URL}/api/v1/G/messaging/topics`),

  getDLQ: () =>
    api.get<DLQEntry[]>(`${API_CONFIG.MESSAGING_URL}/api/v1/G/messaging/dlq`),

  getHealth: () =>
    api.get<HealthStatus>(`${API_CONFIG.MESSAGING_URL}/api/v1/G/messaging/health`),
};

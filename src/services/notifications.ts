import api from './api';
import { API_CONFIG } from '../config';

const BASE = API_CONFIG.NOTIFICATION_URL;

export interface NotificationItem {
  hashId: string;
  organizationHashId: string;
  recipientUserHashId: string;
  type: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  sourceModule?: string;
  sourceEntityHashId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  read: boolean;
  readAt?: string | null;
  emailSent: boolean;
  createdAt: string;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const res = await api.get(`${BASE}/api/v1/U/${userId}/notifications/unread-count`);
  return res.data.count;
}

export async function getNotifications(
  userId: string,
  params?: { page?: number; limit?: number; category?: string; read?: string },
): Promise<{ data: NotificationItem[]; total: number; page: number; limit: number }> {
  const res = await api.get(`${BASE}/api/v1/U/${userId}/notifications`, { params });
  return res.data;
}

export async function markAsRead(userId: string, notifId: string): Promise<void> {
  await api.put(`${BASE}/api/v1/U/${userId}/notifications/${notifId}/read`);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await api.put(`${BASE}/api/v1/U/${userId}/notifications/read-all`);
}

export async function deleteNotification(userId: string, notifId: string): Promise<void> {
  await api.delete(`${BASE}/api/v1/U/${userId}/notifications/${notifId}`);
}

export async function seedDemoNotifications(): Promise<void> {
  await api.post(`${BASE}/api/v1/G/notifications/seed/demo`);
}

export async function flushDemoNotifications(): Promise<void> {
  await api.delete(`${BASE}/api/v1/G/notifications/seed/demo`);
}

import { API_CONFIG } from '../config';
import api from './api';

export type WidgetType = 'count' | 'chart' | 'table' | 'list' | 'gauge';

export interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  metricQuery: string | null;
  config: Record<string, unknown>;
  roles: string[];
  positionX: number;
  positionY: number;
  positionW: number;
  positionH: number;
  orgId: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetPayload {
  title: string;
  type: WidgetType;
  metricQuery?: string;
  config?: Record<string, unknown>;
  roles?: string[];
  positionX?: number;
  positionY?: number;
  positionW?: number;
  positionH?: number;
}

export interface UpdateWidgetPayload extends Partial<CreateWidgetPayload> {}

export const dashboardService = {
  /** Get role-filtered widgets for view mode */
  getViewWidgets: (orgId: string) =>
    api.get<Widget[]>(`${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/O/${orgId}/dashboard/view`),

  /** Get all widgets for designer mode */
  getDesignerWidgets: (orgId: string) =>
    api.get<Widget[]>(`${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/O/${orgId}/dashboard/designer`),

  /** List all widgets */
  getWidgets: (orgId: string) =>
    api.get<Widget[]>(`${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/O/${orgId}/dashboard/widgets`),

  /** Create a new widget */
  createWidget: (orgId: string, payload: CreateWidgetPayload) =>
    api.post<Widget>(`${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/O/${orgId}/dashboard/widgets`, payload),

  /** Update an existing widget */
  updateWidget: (orgId: string, widgetId: string, payload: UpdateWidgetPayload) =>
    api.put<Widget>(`${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/O/${orgId}/dashboard/widgets/${widgetId}`, payload),

  /** Delete a widget */
  deleteWidget: (orgId: string, widgetId: string) =>
    api.delete(`${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/O/${orgId}/dashboard/widgets/${widgetId}`),
};

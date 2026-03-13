import { API_CONFIG } from '../../config';
import api from '../../services/api';

export interface MenuItemData {
  id: string;
  code: string;
  label: string;
  icon: string;
  route: string;
  apiRoute: string;
  seq: number;
  visible_in_menu?: boolean;
}

export interface MenuSectionData {
  id: string;
  code: string;
  label: string;
  icon: string;
  seq: number;
  items: MenuItemData[];
}

export interface MenuResponse {
  sections: MenuSectionData[];
  source: 'database' | 'static';
  generatedAt: string;
}

export type MenuSource = 'database' | 'static';

export async function fetchMenu(
  userId: string,
  orgId: string,
  source?: MenuSource,
): Promise<MenuResponse> {
  const params = new URLSearchParams();
  if (source) {
    params.set('source', source);
  }
  const qs = params.toString();
  const response = await api.get<MenuResponse>(
    `${API_CONFIG.NAVIGATION_URL}/api/v1/U/${userId}/menu${qs ? '?' + qs : ''}`,
  );
  return response.data;
}

import { API_CONFIG } from '../config';
import api from './api';

export interface MenuItem {
  id: string;
  hashId: string;
  label: string;
  route: string;
  icon: string;
  parentId: string | null;
  parentHashId: string | null;
  order: number;
  sortOrder: number;
  section: string;
  privilegeCode: string;
  privileges: string[];
  children?: MenuItem[];
}

export interface RouteRegistration {
  id: string;
  path: string;
  service: string;
  method: string;
}

export interface ResolvedMenuResponse {
  menu: MenuItem[];
  sections?: unknown[];
  source?: 'database' | 'static';
  generatedAt?: string;
}

export const navigationService = {
  getMenus: (orgId: string) =>
    api.get<MenuItem[]>(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/menus`),

  /**
   * Get the cascade-resolved effective menu for a user.
   * Endpoint: /api/v1/U/:userId/menu (EPIC 19 Phase 1).
   *
   * Reads live from registered_modules + nav_overrides (platform → org → user).
   * This is the primary endpoint for the 6-level sidebar.
   *
   * Pass `refresh=true` to bypass the in-memory cache and recompute.
   */
  getMenu: (userId: string, opts?: { refresh?: boolean }) => {
    const suffix = opts?.refresh ? '?refresh=true' : '';
    return api.get<ResolvedMenuResponse>(
      `${API_CONFIG.NAVIGATION_URL}/api/v1/U/${userId}/menu${suffix}`,
    );
  },

  /**
   * Force-invalidate the nav service's effective-menu cache for a scope.
   * Users may always invalidate their own cache.
   */
  invalidateMenuCache: (scope: 'G' | 'O' | 'U', scopeId: string) =>
    api.post(
      `${API_CONFIG.NAVIGATION_URL}/api/v1/G/cache/invalidate?scope=${scope}&scopeId=${encodeURIComponent(scopeId)}`,
      {},
    ),

  /**
   * @deprecated Use getMenu(). Kept for backward compatibility — points at
   * the legacy navigation/menu endpoint that still works until fully
   * decommissioned.
   */
  getResolvedMenu: (userId: string) =>
    api.get<ResolvedMenuResponse>(`${API_CONFIG.NAVIGATION_URL}/api/v1/U/${userId}/navigation/menu`),

  createMenuItem: (orgId: string, payload: Partial<MenuItem>) =>
    api.post(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/menus`, payload),

  updateMenuItem: (orgId: string, menuId: string, payload: Partial<MenuItem>) =>
    api.patch(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/menus/${menuId}`, payload),

  deleteMenuItem: (orgId: string, menuId: string) =>
    api.delete(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/menus/${menuId}`),

  getRoutes: (orgId: string) =>
    api.get<RouteRegistration[]>(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/routes`),

  registerRoute: (orgId: string, payload: Partial<RouteRegistration>) =>
    api.post(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/routes`, payload),
};

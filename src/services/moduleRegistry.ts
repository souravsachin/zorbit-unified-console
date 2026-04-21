import { API_CONFIG } from '../config';
import api from './api';

/**
 * Edition as returned by GET /api/module-registry/api/v1/G/modules/editions.
 * Mirrors the EditionMeta shape consumed by BusinessLineSelector.
 */
export interface Edition {
  name: string;
  category?: string;
  categorySortOrder?: number;
  sortOrder?: number;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  iconRing?: string;
}

export interface EditionsResponse {
  editions: Edition[];
}

export const moduleRegistryService = {
  /**
   * Fetch the union of (a) editions declared by any registered module's
   * manifest placement.edition and (b) the registry's default edition catalog.
   *
   * Public endpoint — no auth required.
   */
  getEditions: () =>
    api.get<EditionsResponse>(
      `${API_CONFIG.MODULE_REGISTRY_URL}/api/v1/G/modules/editions`,
    ),
};

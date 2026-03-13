// =============================================================================
// PCG4 Product Configurator — API Client
// =============================================================================
import api from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PCG4Configuration {
  id: string;
  hashId: string;
  insurerName: string;
  productName: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  planCount: number;
  encounterCount: number;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface PCG4Stats {
  total: number;
  draft: number;
  inReview: number;
  published: number;
}

// ---------------------------------------------------------------------------
// Mock Data (fallback when backend is unavailable)
// ---------------------------------------------------------------------------

const MOCK_CONFIGURATIONS: PCG4Configuration[] = [
  {
    id: '1',
    hashId: 'CFG-92AF',
    insurerName: 'Acme Health Insurance',
    productName: 'Gold Shield Plan',
    status: 'draft',
    planCount: 3,
    encounterCount: 12,
    currentStage: 'benefits_setup',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-13T14:30:00Z',
  },
  {
    id: '2',
    hashId: 'CFG-81F3',
    insurerName: 'Pacific Mutual',
    productName: 'Silver Care Advantage',
    status: 'in_review',
    planCount: 5,
    encounterCount: 24,
    currentStage: 'review_publish',
    createdAt: '2026-02-20T10:15:00Z',
    updatedAt: '2026-03-12T09:45:00Z',
  },
  {
    id: '3',
    hashId: 'CFG-51AA',
    insurerName: 'National Assurance Co.',
    productName: 'Family Wellness Plus',
    status: 'published',
    planCount: 4,
    encounterCount: 18,
    currentStage: 'review_publish',
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-03-01T16:20:00Z',
  },
];

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getConfigurations(orgId: string): Promise<PCG4Configuration[]> {
  try {
    const res = await api.get(`/api/v1/O/${orgId}/pcg4/configurations`);
    return res.data?.data || res.data || [];
  } catch {
    console.warn('PCG4 API unavailable, using mock data');
    return MOCK_CONFIGURATIONS;
  }
}

export async function deleteConfiguration(orgId: string, configId: string): Promise<void> {
  try {
    await api.delete(`/api/v1/O/${orgId}/pcg4/configurations/${configId}`);
  } catch (err: unknown) {
    const error = err as { response?: { status: number } };
    // If it's a network error (no backend), silently succeed for mock mode
    if (error.response && error.response.status !== 404) {
      throw err;
    }
  }
}

export async function getTemplates(orgId: string): Promise<PCG4Configuration[]> {
  try {
    const res = await api.get(`/api/v1/O/${orgId}/pcg4/configurations/templates`);
    return res.data?.data || res.data || [];
  } catch {
    console.warn('PCG4 templates API unavailable, using mock data');
    return MOCK_CONFIGURATIONS.filter(
      (c) => c.status === 'approved' || c.status === 'published',
    );
  }
}

export async function cloneConfiguration(
  orgId: string,
  sourceId: string,
): Promise<{ id: string }> {
  try {
    const res = await api.post(`/api/v1/O/${orgId}/pcg4/configurations/${sourceId}/clone`);
    return res.data;
  } catch {
    // Mock: return a fake new ID
    const mockId = `CFG-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    return { id: mockId };
  }
}

export function computeStats(configs: PCG4Configuration[]): PCG4Stats {
  return {
    total: configs.length,
    draft: configs.filter((c) => c.status === 'draft').length,
    inReview: configs.filter((c) => c.status === 'in_review').length,
    published: configs.filter((c) => c.status === 'published').length,
  };
}

// ---------------------------------------------------------------------------
// Configurator API — full CRUD for the 8-step wizard
// ---------------------------------------------------------------------------

import type {
  PCG4Configuration as FullConfig,
  EncounterCategory,
} from '../types/pcg4';

function orgBase(orgId: string) {
  return `/api/v1/O/${orgId}/pcg4`;
}

export const pcg4ConfiguratorApi = {
  // ---- Configurations ----

  createConfig: (orgId: string, data: Partial<FullConfig>) =>
    api.post(`${orgBase(orgId)}/configurations`, data).then((r) => r.data),

  getConfig: (orgId: string, configId: string): Promise<FullConfig> =>
    api.get(`${orgBase(orgId)}/configurations/${configId}`).then((r) => r.data),

  updateStage: (
    orgId: string,
    configId: string,
    stage: string,
    data: Record<string, unknown>,
  ) =>
    api
      .put(`${orgBase(orgId)}/configurations/${configId}/stage`, { stage, data })
      .then((r) => r.data),

  // ---- Plans ----

  createPlan: (orgId: string, configId: string, data: Record<string, unknown>) =>
    api
      .post(`${orgBase(orgId)}/configurations/${configId}/plans`, data)
      .then((r) => r.data),

  updatePlan: (
    orgId: string,
    configId: string,
    planId: string,
    data: Record<string, unknown>,
  ) =>
    api
      .put(`${orgBase(orgId)}/configurations/${configId}/plans/${planId}`, data)
      .then((r) => r.data),

  deletePlan: (orgId: string, configId: string, planId: string) =>
    api
      .delete(`${orgBase(orgId)}/configurations/${configId}/plans/${planId}`)
      .then((r) => r.data),

  // ---- Benefits ----

  setBenefits: (
    orgId: string,
    configId: string,
    planId: string,
    encounterIds: string[],
  ) =>
    api
      .post(`${orgBase(orgId)}/configurations/${configId}/plans/${planId}/benefits`, {
        encounterIds,
      })
      .then((r) => r.data),

  updateBenefit: (
    orgId: string,
    configId: string,
    planId: string,
    benefitId: string,
    data: Record<string, unknown>,
  ) =>
    api
      .put(
        `${orgBase(orgId)}/configurations/${configId}/plans/${planId}/benefits/${benefitId}`,
        data,
      )
      .then((r) => r.data),

  // ---- Taxonomies ----

  getTaxonomies: (orgId: string): Promise<EncounterCategory[]> =>
    api.get(`/api/v1/O/${orgId}/taxonomies`).then((r) => {
      const data = r.data?.data || r.data || [];
      // Find the "Healthcare Encounter Types" taxonomy
      const taxonomy = Array.isArray(data)
        ? data.find(
            (t: Record<string, unknown>) =>
              t.name === 'Healthcare Encounter Types' ||
              t.type === 'encounter_types',
          )
        : null;
      return taxonomy?.categories || [];
    }),
};

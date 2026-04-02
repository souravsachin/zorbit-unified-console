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
// API Functions
// ---------------------------------------------------------------------------

export async function getConfigurations(orgId: string): Promise<PCG4Configuration[]> {
  const res = await api.get(`/api/app/pcg4/v1/O/${orgId}/configurations`);
  return res.data?.data || res.data || [];
}

export async function deleteConfiguration(orgId: string, configId: string): Promise<void> {
  await api.delete(`/api/app/pcg4/v1/O/${orgId}/configurations/${configId}`);
}

export async function getTemplates(orgId: string): Promise<PCG4Configuration[]> {
  const res = await api.get(`/api/app/pcg4/v1/O/${orgId}/configurations/templates`);
  return res.data?.data || res.data || [];
}

export async function cloneConfiguration(
  orgId: string,
  sourceId: string,
): Promise<{ id: string }> {
  const res = await api.post(`/api/app/pcg4/v1/O/${orgId}/configurations/${sourceId}/clone`);
  return res.data;
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
// Setup API — seed, flush, stats, tables
// ---------------------------------------------------------------------------

export async function seedDemoData(orgId: string): Promise<{ configurations: number; plans: number; encounterTypes: number; benefits: number }> {
  const res = await api.post(`/api/app/pcg4/v1/O/${orgId}/setup/seed`);
  return res.data;
}

export async function flushDemoData(orgId: string): Promise<{ configurations: number; plans: number; benefits: number; encounterTypes: number }> {
  const res = await api.post(`/api/app/pcg4/v1/O/${orgId}/setup/flush`);
  return res.data;
}

export async function getSetupStats(orgId: string) {
  const res = await api.get(`/api/app/pcg4/v1/O/${orgId}/setup/stats`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Setup v2 — table inventory + SSE streaming
// ---------------------------------------------------------------------------

export interface SetupTableInfo {
  name: string;
  count: number;
  protected: boolean;
}

export interface SetupLogEvent {
  type: 'info' | 'success' | 'warning' | 'error' | 'done';
  table?: string;
  message: string;
  timestamp: string;
}

export async function getSetupTables(orgId: string): Promise<{ tables: SetupTableInfo[] }> {
  const res = await api.get(`/api/app/pcg4/v1/O/${orgId}/setup/tables`);
  return res.data;
}

/**
 * Start an SSE stream for a setup operation.
 * Returns an AbortController so the caller can cancel.
 */
export function startSetupSSE(
  orgId: string,
  operation: 'seed-system' | 'seed-demo' | 'flush-demo' | 'flush-all',
  tables: string[] | undefined,
  onEvent: (event: SetupLogEvent) => void,
  onDone: () => void,
  onError: (err: string) => void,
): AbortController {
  const controller = new AbortController();
  const token = localStorage.getItem('zorbit_token');
  const qs = tables && tables.length > 0 ? `?tables=${tables.join(',')}` : '';
  const url = `/api/app/pcg4/v1/O/${orgId}/setup/${operation}${qs}`;

  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        onError(`HTTP ${response.status}: ${response.statusText}`);
        onDone();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body');
        onDone();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: SetupLogEvent = JSON.parse(line.slice(6));
              if (event.type === 'done') {
                onDone();
              } else {
                onEvent(event);
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const event: SetupLogEvent = JSON.parse(buffer.slice(6));
          if (event.type === 'done') {
            onDone();
          } else {
            onEvent(event);
          }
        } catch {
          // ignore
        }
      }

      onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Connection failed');
        onDone();
      }
    });

  return controller;
}

// ---------------------------------------------------------------------------
// Configurator API — full CRUD for the 8-step wizard
// ---------------------------------------------------------------------------

import type {
  PCG4Configuration as FullConfig,
  EncounterCategory,
  Plan as FrontendPlan,
  EncounterBenefit,
  GeneralRules,
  ConfigurationStage,
} from '../types/pcg4';

function orgBase(orgId: string) {
  return `/api/app/pcg4/v1/O/${orgId}`;
}

// ---------------------------------------------------------------------------
// Stage number → string mapping
// ---------------------------------------------------------------------------
const STAGE_MAP: Record<number, ConfigurationStage> = {
  1: 'insurer_details',
  2: 'product_details',
  3: 'create_plans',
  4: 'base_plan_configuration',
  5: 'encounter_configuration',
  6: 'benefits_setup',
  7: 'plan_specific_overrides',
  8: 'review_publish',
};

// ---------------------------------------------------------------------------
// Backend → Frontend mapper for configuration detail
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendConfig(raw: any): FullConfig {
  const plans: FrontendPlan[] = (raw.plans || []).map((p: any) => {
    const benefits: EncounterBenefit[] = (p.benefits || []).map((b: any) => ({
      category: '',
      sub_category: '',
      encounter_type: b.encounterTypeCode || '',
      description: b.encounterTypeLabel || '',
      coverage: true,
      annual_limit: b.costShare?.annual_limit ?? 0,
      waiting_period_days: 0,
      cost_share: {
        copay: b.costShare?.copay ?? 0,
        coinsurance: b.costShare?.coinsurance ?? 0,
        deductible_applies: b.costShare?.deductible_applies ?? false,
      },
      visit_limits: {
        annual_visits: b.visitLimits?.per_year ?? 0,
        lifetime_limit: b.visitLimits?.per_lifetime ?? 0,
        per_event_cap: 0,
      },
      authorization: {
        required: b.visitLimits?.auth_required ?? false,
        notes: '',
      },
      exclusions: [],
    }));

    const generalRules: GeneralRules = p.generalRules
      ? {
          annual_limit: p.generalRules.annual_limit ?? 0,
          deductible: p.generalRules.deductible ?? 0,
          out_of_pocket_max: p.generalRules.out_of_pocket_max ?? 0,
          network_restrictions: p.generalRules.network_restrictions ?? 'Both',
          waiting_period_days: p.generalRules.waiting_period_days ?? 0,
        }
      : {
          annual_limit: 0,
          deductible: 0,
          out_of_pocket_max: 0,
          network_restrictions: 'Both',
          waiting_period_days: 0,
        };

    return {
      plan_id: p.hashId || p.id,
      plan_name: p.name || '',
      plan_tier: p.tier || '',
      regions: p.regions || [],
      currency: p.currency || 'USD',
      benefits: {
        general_rules: generalRules,
        encounter_specific: benefits,
      },
    } as FrontendPlan;
  });

  return {
    id: raw.hashId || raw.id,
    insurer: {
      name: raw.insurerName || '',
      description: '',
      internal_code: raw.insurerCode || '',
      regulator_assigned_code: '',
    },
    product: {
      name: raw.productName || '',
      description: '',
      internal_code: raw.productCode || '',
      regulator_assigned_code: '',
    },
    plans,
    current_stage: STAGE_MAP[raw.currentStage] || 'insurer_details',
    status: raw.status === 'review' ? 'in_review' : (raw.status || 'draft'),
    created_at: raw.createdAt,
    updated_at: raw.updatedAt,
  };
}

export const pcg4ConfiguratorApi = {
  // ---- Configurations ----

  createConfig: (orgId: string, data: Partial<FullConfig>) =>
    api.post(`${orgBase(orgId)}/configurations`, data).then((r) => r.data),

  getConfig: (orgId: string, configId: string): Promise<FullConfig> =>
    api.get(`${orgBase(orgId)}/configurations/${configId}`).then((r) => mapBackendConfig(r.data)),

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
    api.get(`/api/app/pcg4/v1/O/${orgId}/taxonomies`).then((r) => {
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

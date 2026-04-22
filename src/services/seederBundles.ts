/**
 * zorbit-unified-console — Seeder Generator (seed-bundles) service client.
 *
 * Wraps the noun-based HTTP surface of zorbit-cor-seeder's
 * /api/v1/G/seed-bundles/* and /api/v1/G/factor-catalog and
 * /api/v1/G/modules/:moduleId/introspection endpoints.
 *
 * Added 2026-04-23 by Soldier AV.
 */
import api from './api';

const BASE = (import.meta.env.VITE_SEEDER_URL as string | undefined) || '/api/seeder';

export interface FactorDefinition {
  key: string;
  label: string;
  type: string;
  description?: string;
  options?: string[];
  defaultWeights?: number[] | Record<string, number>;
  scope: 'global' | 'module';
  declaredBy?: string;
}

export interface IntrospectedEntity {
  entity: string;
  table?: string;
  hashIdPrefix?: string;
  fields: IntrospectedField[];
}

export interface IntrospectedField {
  name: string;
  type: string;
  required?: boolean;
  nullable?: boolean;
  maxLength?: number;
  enumValues?: string[];
  foreignKey?: { entity: string; field?: string };
  pii?: { masked?: boolean };
  defaultValue?: unknown;
}

export interface ModuleIntrospection {
  moduleId: string;
  moduleName?: string;
  entities: IntrospectedEntity[];
  factorMixes: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
    defaultWeights?: number[] | Record<string, number>;
  }>;
  seed?: {
    db?: string;
    generator?: { defaultCount?: number; minCount?: number; maxCount?: number };
  };
  apiPrefix?: string;
}

export interface BundleSummary {
  bundleId: string;
  moduleId: string;
  status: 'draft' | 'generated' | 'stale';
  count: number;
  entities: string[];
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BundleDetail extends BundleSummary {
  factors: Record<string, unknown>;
  overrides: Record<string, unknown> | null;
  links: {
    records: string;
    sql: string;
    postman: string;
    runs: string;
    deliveries: string;
  };
}

export interface BundleRun {
  runId: string;
  bundleId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  sent: number;
  succeeded: number;
  failed: number;
  total: number;
  logTail?: unknown[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const seederBundlesService = {
  // ---- Factor catalog ----
  listFactors: async (): Promise<{ data: FactorDefinition[]; total: number }> => {
    const { data } = await api.get(`${BASE}/api/v1/G/factor-catalog`);
    return data;
  },
  getFactor: async (key: string): Promise<FactorDefinition> => {
    const { data } = await api.get(`${BASE}/api/v1/G/factor-catalog/${encodeURIComponent(key)}`);
    return data;
  },

  // ---- Introspection ----
  introspectModule: async (moduleId: string): Promise<ModuleIntrospection> => {
    const { data } = await api.get(
      `${BASE}/api/v1/G/modules/${encodeURIComponent(moduleId)}/introspection`,
    );
    return data;
  },

  // ---- Bundles CRUD ----
  createBundle: async (args: {
    moduleId: string;
    entities?: string[];
    factors?: Record<string, unknown>;
    overrides?: Record<string, unknown>;
    count?: number;
    label?: string;
  }): Promise<{ bundleId: string; status: string; count: number; entities: string[] }> => {
    const { data } = await api.post(`${BASE}/api/v1/G/seed-bundles`, args);
    return data;
  },

  listBundles: async (moduleId?: string): Promise<{ data: BundleSummary[]; total: number }> => {
    const { data } = await api.get(`${BASE}/api/v1/G/seed-bundles`, {
      params: moduleId ? { moduleId } : undefined,
    });
    return data;
  },

  getBundle: async (bundleId: string): Promise<BundleDetail> => {
    const { data } = await api.get(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}`,
    );
    return data;
  },

  patchBundle: async (
    bundleId: string,
    body: {
      factors?: Record<string, unknown>;
      overrides?: Record<string, unknown>;
      count?: number;
      label?: string;
      regenerate?: boolean;
    },
  ): Promise<{ bundleId: string; status: string; count: number }> => {
    const { data } = await api.patch(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}`,
      body,
    );
    return data;
  },

  deleteBundle: async (bundleId: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}`,
    );
    return data;
  },

  // ---- Sub-resources ----
  createPreview: async (bundleId: string): Promise<Record<string, unknown[]>> => {
    const { data } = await api.post(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/previews`,
    );
    return data;
  },

  getRecords: async (
    bundleId: string,
    entity?: string,
  ): Promise<Record<string, unknown[]>> => {
    const { data } = await api.get(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/records`,
      { params: entity ? { entity } : undefined },
    );
    return data;
  },

  sqlUrl: (bundleId: string): string =>
    `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/sql`,

  postmanUrl: (bundleId: string): string =>
    `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/postman-collection`,

  // ---- Runs ----
  startRun: async (bundleId: string): Promise<{
    runId: string;
    bundleId: string;
    status: string;
    total: number;
    streamUrl: string;
  }> => {
    const { data } = await api.post(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/runs`,
    );
    return data;
  },

  listRuns: async (bundleId: string): Promise<{ data: BundleRun[]; total: number }> => {
    const { data } = await api.get(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/runs`,
    );
    return data;
  },

  getRun: async (bundleId: string, runId: string): Promise<BundleRun> => {
    const { data } = await api.get(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/runs/${encodeURIComponent(runId)}`,
    );
    return data;
  },

  // ---- Deliveries ----
  deliver: async (
    bundleId: string,
    args: { target: 'module' | 'central'; dryRun?: boolean },
  ): Promise<{ delivered: boolean; target: string; modulePath?: string; dryRun: boolean; sqlBytes: number }> => {
    const { data } = await api.post(
      `${BASE}/api/v1/G/seed-bundles/${encodeURIComponent(bundleId)}/deliveries`,
      args,
    );
    return data;
  },
};

import React, { createContext, useContext } from 'react';

/**
 * Shape of the manifest data that is fetched from module-registry and
 * passed down to any `feComponent` mounted by `ManifestRouter`.
 *
 * Aligns with `src/models/dto/manifest-v2.ts` in zorbit-cor-module_registry.
 */
export interface ManifestData {
  moduleId?: string;
  moduleName?: string;
  moduleType?: string;
  version?: string;

  placement?: {
    scaffold?: string;
    scaffoldSortOrder?: number;
    businessLine?: string;
    capabilityArea?: string;
    sortOrder?: number;
    edition?: { name?: string; category?: string } | null;
  };

  navigation?: {
    sections?: Array<{
      id?: string;
      label?: string;
      items?: Array<{
        label: string;
        feRoute: string;
        beRoute?: string;
        feComponent?: string | null;
        icon?: string;
        privilege?: string;
      }>;
    }>;
  };

  guide?: {
    intro?: { headline?: string; summary?: string; feRoute?: string };
    // US-MF-2100 — content-heavy array fields (deck, entries, links, tiers)
    // accept either an inline array OR an externalised `{ $src: "/url" }`.
    // The `useResolvedContent` hook transparently resolves both shapes.
    slides?: {
      feRoute?: string;
      deck?:
        | Array<{ title: string; body: string; image?: string }>
        | { $src: string };
    };
    lifecycle?: {
      feRoute?: string;
      phases?: Array<{ name: string; description: string }>;
    };
    videos?: {
      feRoute?: string;
      entries?:
        | Array<{
            title: string;
            duration?: number;
            playerType: 'simple' | 'chapter-list' | 'sidebyside' | 'picture-in-picture' | 'quiz' | 'tour';
            src: string;
            src2?: string;
            poster?: string;
            chapters?: Array<{
              t: number;
              label: string;
              src2?: string;
              annotation?: string;
              quiz?: { q: string; options: string[]; answerIndex: number };
            }>;
          }>
        | { $src: string };
    };
    docs?: {
      feRoute?: string;
      links?: Array<{ label: string; href: string }> | { $src: string };
    };
    pricing?: {
      feRoute?: string;
      tiers?:
        | Array<{ name: string; monthlyPrice: number | null; features: string[] }>
        | { $src: string };
    };
  };

  deployments?: {
    health?: { beRoute?: string };
    build?: {
      commitSha?: string;
      builtAt?: string;
      nodeVersion?: string;
      dockerImage?: string;
    };
    environments?: Array<{
      name: string;
      url: string;
      status?: 'healthy' | 'degraded' | 'down' | 'unknown';
    }>;
    runbook?: { href: string };
  };

  db?: {
    dbType?: string;
    dbName?: string;
    operations?: {
      seedSystemMin?: DbOperation;
      seedDemoData?: DbOperation;
      flushDemoData?: DbOperation;
      flushAllData?: DbOperation;
      backup?: DbOperation;
      restore?: DbOperation;
    };
  };

  composition?: unknown;
}

export interface DbOperation {
  beRoute: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  privilege?: string;
  destructive?: boolean;
}

export interface ModuleContextValue {
  slug: string;
  moduleId: string | null;
  manifest: ManifestData | null;
  feRoute: string;
  loading: boolean;
  error?: string | null;
}

const ModuleContext = createContext<ModuleContextValue>({
  slug: '',
  moduleId: null,
  manifest: null,
  feRoute: '',
  loading: false,
  error: null,
});

export const ModuleContextProvider = ModuleContext.Provider;

export function useModuleContext(): ModuleContextValue {
  return useContext(ModuleContext);
}

export default ModuleContext;

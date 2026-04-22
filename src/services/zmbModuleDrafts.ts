/**
 * zorbit-unified-console — ZMB Module-Drafts service client
 *
 * Wraps the HTTP surface of zorbit-pfs-zmb_factory's noun-based
 * /api/v1/G/module-drafts/* and /api/v1/G/modules endpoints.
 *
 * Renamed 2026-04-23 from zmbCompose.ts (verb -> noun). The old file has
 * been hard-deleted — no re-export shim, no back-compat. Pre-launch.
 */
import api from './api';

const BASE = (import.meta.env.VITE_ZMB_FACTORY_URL as string | undefined) || '/api/zmb-factory';

export interface ModuleDraftValidationIssue {
  level: 'error' | 'warning';
  path: string;
  message: string;
}

export interface ModuleDraftValidationResult {
  valid: boolean;
  issues: ModuleDraftValidationIssue[];
}

export interface ModuleDraftPreviewResult {
  moduleId: string;
  summary: {
    navigationItems: number;
    guideSlides: number;
    privilegeCount: number;
    entityCount: number;
  };
  manifest: any;
}

export interface ModuleMaterialisationResult {
  modulePath: string;
  fileCount: number;
  files: string[];
  audioBundleCount?: number;
}

export interface SynthNarrationItem {
  id: string;
  text: string;
  voice?: string;
}

export interface SynthNarrationResult {
  items: Array<{
    id: string;
    ok: boolean;
    dataUrl?: string;
    fallback?: 'browser-speech-synthesis';
    error?: string;
  }>;
  synthesiser: 'voice-engine' | 'browser-fallback';
}

export const zmbModuleDraftsService = {
  validate: async (manifest: any): Promise<ModuleDraftValidationResult> => {
    const { data } = await api.post(`${BASE}/api/v1/G/module-drafts/validations`, { manifest });
    return data;
  },

  preview: async (manifest: any): Promise<ModuleDraftPreviewResult> => {
    const { data } = await api.post(`${BASE}/api/v1/G/module-drafts/previews`, { manifest });
    return data;
  },

  deriveConfig: async (manifest: any): Promise<any> => {
    const { data } = await api.post(`${BASE}/api/v1/G/module-drafts/configs`, { manifest });
    return data;
  },

  /**
   * Materialises a module on the server filesystem. The REST resource
   * created IS a module (/api/v1/G/modules, noun).
   */
  materialiseModule: async (
    manifest: any,
    config?: any,
    targetRoot?: string,
  ): Promise<ModuleMaterialisationResult> => {
    const { data } = await api.post(`${BASE}/api/v1/G/modules`, {
      manifest,
      config,
      targetRoot,
    });
    return data;
  },

  /**
   * Creates a downloadable export (zip) of a draft.
   */
  createExport: async (
    manifest: any,
    config?: any,
  ): Promise<{ blob: Blob; fileName: string }> => {
    const rsp = await api.post(
      `${BASE}/api/v1/G/module-drafts/exports`,
      { manifest, config },
      { responseType: 'blob' },
    );
    const disposition: string = rsp.headers['content-disposition'] || '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const fileName = match?.[1] || `${manifest?.moduleId || 'module'}-scaffold.zip`;
    return { blob: rsp.data as Blob, fileName };
  },

  /**
   * Generate a demo seed SQL preview for the current manifest's entities.
   * Returns { sql, rowCount, entityCount }.
   */
  generateSeed: async (
    manifest: any,
    rowsPerEntity?: number,
  ): Promise<{ sql: string; rowCount: number; entityCount: number }> => {
    const { data } = await api.post(`${BASE}/api/v1/G/module-drafts/seeds`, {
      manifest,
      rowsPerEntity,
    });
    return data;
  },

  synthNarrations: async (
    narrations: SynthNarrationItem[],
    opts?: { voiceEngineUrl?: string; orgId?: string },
  ): Promise<SynthNarrationResult> => {
    const { data } = await api.post(`${BASE}/api/v1/G/module-drafts/narrations`, {
      narrations,
      ...opts,
    });
    return data;
  },

  /**
   * Creates a module-draft from an uploaded manifest (round-trip validation
   * + derived config). Returns { manifest, derivedConfig, validation, hash }.
   */
  createDraft: async (manifest: any): Promise<{
    manifest: any;
    derivedConfig: any;
    validation: ModuleDraftValidationResult;
    hash: string;
  }> => {
    const { data } = await api.post(`${BASE}/api/v1/G/module-drafts`, { manifest });
    return data;
  },
};

/**
 * Browser-side narration player. Plays a text string via the platform TTS
 * (voice_engine) if reachable, else falls back to window.speechSynthesis.
 */
export async function playNarration(
  text: string,
  opts?: { voice?: string; onFinish?: () => void },
): Promise<'voice-engine' | 'browser-fallback'> {
  const result = await zmbModuleDraftsService.synthNarrations(
    [{ id: 'inline', text, voice: opts?.voice }],
  );
  const first = result.items[0];

  if (first?.ok && first.dataUrl) {
    const audio = new Audio(first.dataUrl);
    await new Promise<void>((resolve) => {
      audio.addEventListener('ended', () => resolve(), { once: true });
      audio.addEventListener('error', () => resolve(), { once: true });
      audio.play().catch(() => resolve());
    });
    opts?.onFinish?.();
    return 'voice-engine';
  }

  return new Promise<'browser-fallback'>((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      if (opts?.voice) {
        const v = window.speechSynthesis.getVoices().find((vv) => vv.name === opts.voice);
        if (v) u.voice = v;
      }
      u.onend = () => {
        opts?.onFinish?.();
        resolve('browser-fallback');
      };
      u.onerror = () => {
        opts?.onFinish?.();
        resolve('browser-fallback');
      };
      window.speechSynthesis.speak(u);
    } catch {
      opts?.onFinish?.();
      resolve('browser-fallback');
    }
  });
}

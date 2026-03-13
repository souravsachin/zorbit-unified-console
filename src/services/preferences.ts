import api from './api';
import { API_CONFIG } from '../config';

/**
 * Preferences schema — namespaced for scalability.
 *
 * Top-level keys are namespaces:
 *   ui       — sidebar, theme, density
 *   locale   — languages (ordered), timezone, dateFormat
 *   a11y     — ttsEngine, ttsVoice, fontSize, contrast
 *   notify   — email, push, inApp
 *   modules  — per-module prefs keyed by module code
 */
export interface UserPreferences {
  ui?: {
    sidebar?: {
      mode?: 'compact' | 'normal';
      pinned?: boolean;
      collapsedSections?: string[];
    };
    theme?: 'light' | 'dark' | 'system';
    density?: 'comfortable' | 'compact';
  };
  locale?: {
    languages?: string[];
    timezone?: string | null;
    dateFormat?: string | null;
  };
  a11y?: {
    ttsEngine?: string | null;
    ttsVoice?: string | null;
    fontSize?: 'small' | 'normal' | 'large';
    highContrast?: boolean;
  };
  notify?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  modules?: Record<string, Record<string, unknown>>;
}

const STORAGE_PREFIX = 'zorbit_prefs_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * Read preferences from localStorage.
 */
export function loadLocalPrefs(userId: string): UserPreferences {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Write preferences to localStorage (full replace).
 */
export function saveLocalPrefs(userId: string, prefs: UserPreferences): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
}

/**
 * Clear ALL zorbit preference keys from localStorage.
 * Called on explicit logout to prevent leakage.
 */
export function clearAllLocalPrefs(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  // Also clean up legacy per-key format (from before this migration)
  const legacyPrefixes = ['zorbit_menu_'];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && legacyPrefixes.some((p) => key.startsWith(p))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Fetch preferences from backend.
 */
export async function fetchPrefsFromServer(userId: string): Promise<UserPreferences> {
  const resp = await api.get<UserPreferences>(
    `${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/U/${userId}/preferences`,
  );
  return resp.data;
}

/**
 * Save preferences to backend (full replace).
 */
export async function savePrefsToServer(
  userId: string,
  prefs: UserPreferences,
): Promise<void> {
  await api.put(
    `${API_CONFIG.ADMIN_CONSOLE_URL}/api/v1/U/${userId}/preferences`,
    { preferences: prefs },
  );
}

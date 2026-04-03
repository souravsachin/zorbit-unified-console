import { useState, useEffect, useCallback } from 'react';
import {
  UserPreferences,
  loadLocalPrefs,
  saveLocalPrefs,
  clearAllLocalPrefs,
} from '../services/preferences';
import { useRealtime } from './useRealtime';

/**
 * Central preferences hook.
 *
 * ZERO HTTP calls. Flow:
 *  1. On mount (login): load from localStorage instantly.
 *  2. When WebSocket connects, server pushes preferences:init with any
 *     remote prefs. Merge (remote wins) and save to localStorage.
 *  3. On update: save to localStorage, emit via WebSocket to sync
 *     other tabs/devices.
 *  4. On logout: clear all zorbit_prefs_* from localStorage.
 */
export function usePreferences(userId: string | undefined) {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    if (!userId) return {};
    return loadLocalPrefs(userId);
  });
  const { connected, subscribe, emit } = useRealtime();

  // Reload when userId changes
  useEffect(() => {
    if (!userId) {
      setPrefs({});
      return;
    }
    setPrefs(loadLocalPrefs(userId));
  }, [userId]);

  // Listen for WebSocket preference pushes (init from server + changes from other tabs)
  useEffect(() => {
    if (!connected || !userId) return;

    const unsubInit = subscribe('preferences:init', (data: unknown) => {
      const payload = data as { preferences: UserPreferences };
      if (payload?.preferences) {
        setPrefs((prev) => {
          const merged = mergePrefs(prev, payload.preferences);
          saveLocalPrefs(userId, merged);
          return merged;
        });
      }
    });

    const unsubChanged = subscribe('preferences:changed', (data: unknown) => {
      const payload = data as { preferences: UserPreferences; from: string };
      if (payload?.preferences) {
        setPrefs((prev) => {
          const merged = mergePrefs(prev, payload.preferences);
          saveLocalPrefs(userId, merged);
          return merged;
        });
      }
    });

    return () => {
      unsubInit();
      unsubChanged();
    };
  }, [connected, subscribe, userId]);

  /**
   * Update preferences (deep merge at namespace level).
   * Writes to localStorage immediately. Emits via WebSocket to sync other sessions.
   */
  const update = useCallback(
    (partial: Partial<UserPreferences>) => {
      if (!userId) return;
      setPrefs((prev) => {
        const next = mergePrefs(prev, partial);
        saveLocalPrefs(userId, next);
        // Emit via WebSocket so other tabs/devices receive the change
        if (connected) {
          emit('preferences:update', { preferences: next });
        }
        return next;
      });
    },
    [userId, connected, emit],
  );

  /**
   * Clear all local preferences on logout.
   * No HTTP sync needed.
   */
  const flushAndClear = useCallback(async () => {
    clearAllLocalPrefs();
    setPrefs({});
  }, []);

  return { prefs, update, flushAndClear, syncing: false };
}

/**
 * Shallow merge at namespace level (ui, locale, a11y, etc.).
 * Within each namespace, deep merge one level (e.g. ui.sidebar).
 */
function mergePrefs(
  base: UserPreferences,
  override: Partial<UserPreferences>,
): UserPreferences {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof UserPreferences)[]) {
    const baseVal = result[key];
    const overVal = override[key];

    if (
      overVal &&
      typeof overVal === 'object' &&
      !Array.isArray(overVal) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      (result as Record<string, unknown>)[key] = { ...baseVal, ...overVal };
    } else {
      (result as Record<string, unknown>)[key] = overVal;
    }
  }

  return result;
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPreferences,
  loadLocalPrefs,
  saveLocalPrefs,
  clearAllLocalPrefs,
  fetchPrefsFromServer,
  savePrefsToServer,
} from '../services/preferences';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Central preferences hook.
 *
 * Flow:
 *  1. On mount (login): load from localStorage instantly, then fetch from
 *     backend and merge (backend wins). Save merged result to localStorage.
 *  2. During session: all reads/writes go to localStorage (instant).
 *     update() deep-merges the provided partial into the current prefs.
 *  3. Every 5 minutes: sync localStorage → backend (PUT).
 *  4. On logout: sync to backend, then clear ALL zorbit_prefs_* from localStorage.
 */
export function usePreferences(userId: string | undefined) {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    if (!userId) return {};
    return loadLocalPrefs(userId);
  });
  const [syncing, setSyncing] = useState(false);
  const dirtyRef = useRef(false);
  const userIdRef = useRef(userId);

  // Reload when userId changes
  useEffect(() => {
    userIdRef.current = userId;
    if (!userId) {
      setPrefs({});
      return;
    }

    // Load local first (instant)
    const local = loadLocalPrefs(userId);
    setPrefs(local);

    // Then fetch from backend and merge
    fetchPrefsFromServer(userId)
      .then((remote) => {
        // Backend wins for conflicts — deep merge at namespace level
        const merged = mergePrefs(local, remote);
        setPrefs(merged);
        saveLocalPrefs(userId, merged);
        dirtyRef.current = false;
      })
      .catch(() => {
        // Backend unavailable — use local. Will sync later.
      });
  }, [userId]);

  // Periodic sync (every 5 min)
  useEffect(() => {
    if (!userId) return;

    const timer = setInterval(() => {
      if (dirtyRef.current && userIdRef.current) {
        syncToServer(userIdRef.current);
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const syncToServer = useCallback(async (uid: string) => {
    try {
      setSyncing(true);
      const current = loadLocalPrefs(uid);
      await savePrefsToServer(uid, current);
      dirtyRef.current = false;
    } catch {
      // Silent fail — will retry on next interval or logout
    } finally {
      setSyncing(false);
    }
  }, []);

  /**
   * Update preferences (deep merge at namespace level).
   * Writes to localStorage immediately. Marks dirty for next sync.
   */
  const update = useCallback(
    (partial: Partial<UserPreferences>) => {
      if (!userId) return;
      setPrefs((prev) => {
        const next = mergePrefs(prev, partial);
        saveLocalPrefs(userId, next);
        dirtyRef.current = true;
        return next;
      });
    },
    [userId],
  );

  /**
   * Sync to backend and clear all local preferences.
   * Call this on explicit logout.
   */
  const flushAndClear = useCallback(async () => {
    if (userId) {
      try {
        await syncToServer(userId);
      } catch {
        // Best-effort
      }
    }
    clearAllLocalPrefs();
    setPrefs({});
    dirtyRef.current = false;
  }, [userId, syncToServer]);

  return { prefs, update, flushAndClear, syncing };
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
      // Deep merge one more level
      (result as Record<string, unknown>)[key] = { ...baseVal, ...overVal };
    } else {
      (result as Record<string, unknown>)[key] = overVal;
    }
  }

  return result;
}

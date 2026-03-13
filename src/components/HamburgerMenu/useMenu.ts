import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMenu, MenuResponse, MenuSectionData, MenuSource } from './menuApi';
import { UserPreferences } from '../../services/preferences';

export type WidthMode = 'compact' | 'normal';

const WIDTH_VALUES: Record<WidthMode, number> = {
  compact: 60,
  normal: 240,
};

const MENU_CACHE_KEY = 'zorbit_menu_cache';

/** Cache menu in sessionStorage — survives page refresh but not tab close */
function getCachedMenu(userId: string): { sections: MenuSectionData[]; source: string } | null {
  try {
    const raw = sessionStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.userId !== userId) return null; // different user
    return data;
  } catch { return null; }
}

function setCachedMenu(userId: string, sections: MenuSectionData[], source: string) {
  sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ userId, sections, source, cachedAt: Date.now() }));
}

export function clearMenuCache() {
  sessionStorage.removeItem(MENU_CACHE_KEY);
}

interface UseMenuOptions {
  prefs: UserPreferences;
  updatePrefs: (partial: Partial<UserPreferences>) => void;
}

export function useMenu(
  userId: string | undefined,
  orgId: string,
  { prefs, updatePrefs }: UseMenuOptions,
) {
  // Try loading from cache immediately
  const cached = userId ? getCachedMenu(userId) : null;
  const [sections, setSections] = useState<MenuSectionData[]>(cached?.sections ?? []);
  const [menuSource, setMenuSourceState] = useState<'database' | 'static'>((cached?.source as 'database' | 'static') ?? 'database');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuSourceOverride, setMenuSourceOverride] = useState<MenuSource | undefined>(undefined);

  // Derive sidebar state from preferences
  const sidebar = prefs.ui?.sidebar;
  const collapsedSections = new Set<string>(sidebar?.collapsedSections ?? []);
  const pinned = sidebar?.pinned ?? true;
  const widthMode: WidthMode = sidebar?.mode === 'compact' ? 'compact' : 'normal';

  const fetchRef = useRef(0);
  const hasFetched = useRef(!!cached); // skip fetch if already cached

  const loadMenu = useCallback(async (source?: MenuSource, force?: boolean) => {
    if (!userId) return;
    if (hasFetched.current && !force) return; // already loaded — don't re-fetch
    const id = ++fetchRef.current;
    setLoading(true);
    setError(null);
    try {
      const data: MenuResponse = await fetchMenu(userId, orgId, source);
      if (id !== fetchRef.current) return;
      const sorted = [...data.sections]
        .sort((a, b) => a.seq - b.seq)
        .map((sec) => ({
          ...sec,
          items: [...sec.items]
            .filter((item) => item.visible_in_menu !== false)
            .sort((a, b) => a.seq - b.seq),
        }));
      setSections(sorted);
      setMenuSourceState(data.source);
      setCachedMenu(userId, sorted, data.source);
      hasFetched.current = true;
    } catch (err: unknown) {
      if (id !== fetchRef.current) return;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load menu';
      setError(msg);
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [userId, orgId]);

  // Fetch once on mount (skip if cached)
  useEffect(() => {
    loadMenu(menuSourceOverride);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to update sidebar prefs
  const updateSidebar = useCallback(
    (patch: Partial<NonNullable<NonNullable<UserPreferences['ui']>['sidebar']>>) => {
      updatePrefs({
        ui: {
          ...prefs.ui,
          sidebar: { ...sidebar, ...patch },
        },
      });
    },
    [updatePrefs, prefs.ui, sidebar],
  );

  const toggleSection = useCallback((sectionId: string) => {
    const next = new Set(collapsedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    updateSidebar({ collapsedSections: [...next] });
  }, [collapsedSections, updateSidebar]);

  const expandAll = useCallback(() => {
    updateSidebar({ collapsedSections: [] });
  }, [updateSidebar]);

  const collapseAll = useCallback(() => {
    updateSidebar({ collapsedSections: sections.map((s) => s.id) });
  }, [sections, updateSidebar]);

  const isSectionCollapsed = useCallback(
    (sectionId: string) => collapsedSections.has(sectionId),
    [collapsedSections],
  );

  const togglePin = useCallback(() => {
    updateSidebar({ pinned: !pinned });
  }, [pinned, updateSidebar]);

  const toggleCompact = useCallback(() => {
    updateSidebar({ mode: widthMode === 'compact' ? 'normal' : 'compact' });
  }, [widthMode, updateSidebar]);

  const setMenuSource = useCallback((source: MenuSource) => {
    setMenuSourceOverride(source);
    loadMenu(source, true);
  }, [loadMenu]);

  const widthPx = WIDTH_VALUES[widthMode];
  const isCompact = widthMode === 'compact';

  return {
    sections,
    menuSource,
    loading,
    error,
    toggleSection,
    isSectionCollapsed,
    expandAll,
    collapseAll,
    pinned,
    togglePin,
    widthMode,
    widthPx,
    isCompact,
    toggleCompact,
    setMenuSource,
    reload: () => loadMenu(menuSourceOverride, true),
  };
}

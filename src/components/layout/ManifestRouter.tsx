import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useLocation, Navigate } from 'react-router-dom';
import { API_CONFIG } from '../../config';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { componentByName } from '../shared/componentRegistry';
import { ExternalLink, Info } from 'lucide-react';
import {
  ModuleContextProvider,
  type ManifestData,
} from '../../contexts/ModuleContext';

interface NavItem {
  label: string;
  feRoute: string;
  beRoute?: string;
  icon?: string;
  privilege?: string;
  feComponent?: string | null;
  sortOrder?: number;
}
interface NavSection {
  moduleId: string;
  moduleName?: string;
  items?: NavItem[];
}
interface MenuResponse {
  stale?: boolean;
  sections?: NavSection[];
}

/**
 * Returns the first slug segment of a /m/{slug}/... style path.
 * Empty string for non-module paths.
 */
function firstModuleSlug(path: string): string {
  // expected shape: "/m/<slug>[/...]"
  if (!path.startsWith('/m/')) return '';
  const rest = path.slice(3);
  const idx = rest.indexOf('/');
  return idx === -1 ? rest : rest.slice(0, idx);
}

function findMatchingItem(sections: NavSection[], path: string): { section: NavSection; item: NavItem } | null {
  let bestExact: { section: NavSection; item: NavItem } | null = null;
  let bestPrefix: { section: NavSection; item: NavItem; len: number } | null = null;
  const pathSlug = firstModuleSlug(path);
  for (const section of sections) {
    for (const item of section.items || []) {
      if (!item.feRoute) continue;
      if (item.feRoute === path) {
        bestExact = { section, item };
      } else if (path.startsWith(item.feRoute.endsWith('/') ? item.feRoute : item.feRoute + '/')) {
        // Guard against greedy prefix matches across sibling modules.
        // Require the first slug segment of the path to equal the first
        // slug segment of item.feRoute; otherwise /m/hi-decisioning/*
        // would accept a prefix match against /m/sample-rates/*.
        const itemSlug = firstModuleSlug(item.feRoute);
        if (pathSlug && itemSlug && pathSlug !== itemSlug) continue;
        const len = item.feRoute.length;
        if (!bestPrefix || len > bestPrefix.len) bestPrefix = { section, item, len };
      }
    }
  }
  return bestExact || (bestPrefix ? { section: bestPrefix.section, item: bestPrefix.item } : null);
}

/**
 * When the user navigates to a bare `/m/{slug}` with no feature path,
 * return the first nav item registered for that slug (lowest sortOrder,
 * or first in array order as tiebreak). Returns null if the slug has no
 * registered items.
 */
function firstItemForSlug(sections: NavSection[], slug: string): NavItem | null {
  if (!slug) return null;
  const candidates: NavItem[] = [];
  for (const section of sections) {
    for (const item of section.items || []) {
      if (!item.feRoute) continue;
      if (firstModuleSlug(item.feRoute) === slug) {
        candidates.push(item);
      }
    }
  }
  if (candidates.length === 0) return null;
  // Stable sort: sortOrder ascending (undefined treated as Infinity),
  // preserving original order on tie.
  const withIdx = candidates.map((item, idx) => ({ item, idx }));
  withIdx.sort((a, b) => {
    const sa = a.item.sortOrder ?? Number.POSITIVE_INFINITY;
    const sb = b.item.sortOrder ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;
    return a.idx - b.idx;
  });
  return withIdx[0].item;
}

const StubNoMatch: React.FC<{ path: string; slug: string }> = ({ path, slug }) => {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200 mb-1">
              No manifest nav item matches this path
            </h2>
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
              Current path <code className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">{path}</code>, module slug <code className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">{slug}</code>.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
              Every sidebar link is driven by <code>placement.navigation.items[*].feRoute</code> in a module manifest. This path is not declared by any currently-registered manifest.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link to="/m/module-registry/modules" className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                <ExternalLink size={11} /> Module Registry
              </Link>
              <Link to="/" className="px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StubNoComponent: React.FC<{ item: NavItem; section: NavSection }> = ({ item, section }) => {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 p-5">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-1">
              {item.label} — component not yet wired
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              Manifest declared route <code className="bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">{item.feRoute}</code>
              {item.feComponent
                ? <> points to component <code className="bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">{item.feComponent}</code>, but that name is not in componentRegistry.ts.</>
                : <> but the nav item declares no <code>feComponent</code>.</>
              }
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs mt-4">
              <div>
                <div className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Module</div>
                <div className="font-mono">{section.moduleId}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Label</div>
                <div>{item.label}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">Backend route</div>
                <div className="font-mono break-all">{item.beRoute || '—'}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs mt-4">
              <Link to="/m/module-registry/modules" className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                <ExternalLink size={11} /> Inspect manifest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Module-scoped manifest cache. We dedupe fetches by moduleId so
 * navigating among /m/{slug}/guide/intro, /m/{slug}/guide/videos, etc.
 * doesn't re-fetch the same manifest.
 */
const manifestCache = new Map<string, Promise<ManifestData>>();

async function fetchManifest(moduleId: string): Promise<ManifestData> {
  if (manifestCache.has(moduleId)) return manifestCache.get(moduleId)!;
  const p = api
    .get<ManifestData>(`${API_CONFIG.MODULE_REGISTRY_URL}/api/v1/G/modules/${moduleId}/manifest`)
    .then((res) => res.data || {})
    .catch(() => ({} as ManifestData));
  manifestCache.set(moduleId, p);
  return p;
}

const ManifestRouter: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [sections, setSections] = useState<NavSection[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const lastModuleIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingMenu(true);
    api.get<MenuResponse>(`${API_CONFIG.NAVIGATION_URL}/api/v1/U/${user.id}/navigation/menu`)
      .then((res) => setSections(res.data?.sections || []))
      .catch(() => setSections([]))
      .finally(() => setLoadingMenu(false));
  }, [user?.id]);

  const path = location.pathname;
  const slug = params.slug || '';
  const match = useMemo(() => findMatchingItem(sections, path), [sections, path]);

  // Derive moduleId from the matching section (same as what sidebar declared)
  const moduleId = match?.section.moduleId || null;

  // Fetch manifest for current moduleId and re-fetch only when moduleId changes.
  useEffect(() => {
    if (!moduleId) return;
    if (lastModuleIdRef.current === moduleId) return;
    lastModuleIdRef.current = moduleId;
    setLoadingManifest(true);
    setManifestError(null);
    fetchManifest(moduleId)
      .then((m) => setManifest(m))
      .catch((e) => setManifestError((e as Error).message))
      .finally(() => setLoadingManifest(false));
  }, [moduleId]);

  if (loadingMenu) return <div className="p-6 text-gray-500 text-sm">Loading module manifest…</div>;

  // Bare `/m/{slug}` (no feature path) — redirect to the first nav item
  // registered for that slug so users see a module-landing page instead
  // of being bounced to Dashboard via StubNoMatch.
  if (!match) {
    const isBareSlug = path === `/m/${slug}` || path === `/m/${slug}/`;
    if (isBareSlug && slug) {
      const landing = firstItemForSlug(sections, slug);
      if (landing && landing.feRoute && landing.feRoute !== path) {
        return <Navigate to={landing.feRoute} replace />;
      }
    }
    return <StubNoMatch path={path} slug={slug} />;
  }

  const { item, section } = match;
  const Component = componentByName(item.feComponent);
  if (!Component) return <StubNoComponent item={item} section={section} />;

  return (
    <ModuleContextProvider
      value={{
        slug,
        moduleId,
        manifest,
        feRoute: item.feRoute,
        loading: loadingManifest,
        error: manifestError,
      }}
    >
      <Suspense fallback={<div className="p-6 text-gray-500 text-sm">Loading module…</div>}>
        <Component />
      </Suspense>
    </ModuleContextProvider>
  );
};

export default ManifestRouter;

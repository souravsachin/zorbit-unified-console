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
  // SPEC-cross-module-feComponent.md v1.0 — config block passed to the
  // mounted component so modules can parameterise cross-module components
  // (e.g. DataTable columns, FormRenderer templateId) purely by manifest.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feProps?: Record<string, any>;
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

/**
 * Strip the standard zorbit module prefix to derive the short slug used in
 * `feRoute` values. Mirrors the convention enforced by Sidebar6Level /
 * ModuleRegistryPage: `zorbit-(app|cor|pfs|tpm|sdk|ext|ai)-<short>` →
 * `<short>`. The `_` separator inside `<short>` is preserved verbatim per
 * `feedback_nomenclature_strict` (NEVER replace `_` with `-`).
 *
 * F3 fix 2026-04-25 — see fix/F3-manifest-route-matcher-2026-04-25:
 * Cycle 102 found `/m/<full-module-id>` (e.g. `/m/zorbit-cor-identity`)
 * showed "No manifest nav item matches this path" because every manifest
 * declares feRoutes using the short slug only. We now accept BOTH shapes
 * by translating the full module-id segment into its short-slug equivalent
 * before matching.
 */
function shortSlugFromModuleId(moduleId: string): string {
  return moduleId.replace(/^zorbit-(app|cor|pfs|tpm|sdk|ext|ai)-/, '');
}

/**
 * If `path` begins with `/m/<full-module-id>` (matching one of the
 * registered sections), rewrite it to `/m/<short-slug>...`. Otherwise
 * return `path` unchanged. Pure function — never mutates the URL bar.
 */
function rewriteFullModuleIdPath(sections: NavSection[], path: string): string {
  const head = firstModuleSlug(path);
  if (!head) return path;
  // Already a short slug (no zorbit-xxx- prefix)? Leave it.
  if (!/^zorbit-(app|cor|pfs|tpm|sdk|ext|ai)-/.test(head)) return path;
  for (const section of sections) {
    if (section.moduleId === head) {
      const short = shortSlugFromModuleId(head);
      if (!short || short === head) return path;
      const rest = path.slice(`/m/${head}`.length); // includes leading '/' if any
      return `/m/${short}${rest}`;
    }
  }
  return path;
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
        // slug segment of item.feRoute; otherwise /m/hi_decisioning/*
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
  // F3 fix 2026-04-25: accept BOTH the short slug (e.g. `identity`) AND the
  // full module-id (e.g. `zorbit-cor-identity`). When the caller hands us a
  // full module-id we resolve it to the short slug declared in feRoutes.
  let resolvedSlug = slug;
  if (/^zorbit-(app|cor|pfs|tpm|sdk|ext|ai)-/.test(slug)) {
    const matchSection = sections.find((s) => s.moduleId === slug);
    if (matchSection) resolvedSlug = shortSlugFromModuleId(slug);
  }
  const candidates: NavItem[] = [];
  for (const section of sections) {
    for (const item of section.items || []) {
      if (!item.feRoute) continue;
      if (firstModuleSlug(item.feRoute) === resolvedSlug) {
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
              <Link to="/m/module_registry/modules" className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200">
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
              <Link to="/m/module_registry/modules" className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-200">
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
  // F3 fix 2026-04-25: when a user lands on `/m/<full-module-id>/...` we
  // canonicalise the URL to the short-slug shape declared in manifests.
  // This is computed synchronously from `sections` (already loaded) so the
  // redirect fires at most once per navigation.
  const canonicalPath = useMemo(
    () => rewriteFullModuleIdPath(sections, path),
    [sections, path]
  );
  const needsCanonicalRedirect = canonicalPath !== path;
  const match = useMemo(
    () => findMatchingItem(sections, canonicalPath),
    [sections, canonicalPath]
  );

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

  // F3 fix 2026-04-25: if the URL's first segment is a full module-id
  // (e.g. `/m/zorbit-cor-identity/users`) replace the URL with the
  // canonical short-slug form (`/m/identity/users`). Then ManifestRouter
  // re-runs against the canonical path. We replace (not push) so Back
  // doesn't bounce the user back into the alias.
  if (needsCanonicalRedirect) {
    return <Navigate to={canonicalPath} replace />;
  }

  // Bare `/m/{slug}` (no feature path) — redirect to the first nav item
  // registered for that slug so users see a module-landing page instead
  // of being bounced to Dashboard via StubNoMatch. `firstItemForSlug` now
  // accepts both the short slug AND the full module-id (F3 fix).
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

  const { item: menuItem, section } = match;
  // The navigation service's /menu response doesn't yet forward `feComponent`
  // / `feProps` for every module, so we enrich the matched item from the
  // authoritative manifest (fetched in parallel). Manifest-sourced fields win;
  // menu-sourced fields are the fallback. This path will simplify once the
  // navigation assembler is updated to carry those fields end-to-end.
  let item: NavItem = menuItem;
  if (manifest && manifest.navigation?.sections) {
    for (const mSec of manifest.navigation.sections) {
      const hit = (mSec.items || []).find((i) => i.feRoute === menuItem.feRoute);
      if (hit) {
        item = { ...menuItem, ...hit } as NavItem;
        break;
      }
    }
  }
  // Pass currentModuleId so unqualified `feComponent` strings can resolve
  // against the owning module's registry (per SPEC-cross-module-feComponent
  // §"Runtime behaviour"). Qualified `<moduleId>:X` / `@platform:X` strings
  // ignore currentModuleId.
  const Component = componentByName(item.feComponent, section.moduleId);
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
        {/*
          Forward `feProps` to the component per SPEC-cross-module-feComponent
          §"Runtime behaviour" — cross-module components (DataTable,
          FormRenderer, …) rely on manifest-supplied config. Spread both as a
          nested `feProps` object (preferred) AND flat fields so legacy
          component signatures keep working.
        */}
        <Component feProps={item.feProps} {...(item.feProps || {})} />
      </Suspense>
    </ModuleContextProvider>
  );
};

export default ManifestRouter;

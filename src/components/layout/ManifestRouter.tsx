import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { API_CONFIG } from '../../config';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { componentByName } from '../shared/componentRegistry';
import { ExternalLink, Info } from 'lucide-react';

interface NavItem {
  label: string;
  feRoute: string;
  beRoute?: string;
  icon?: string;
  privilege?: string;
  feComponent?: string | null;
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

function findMatchingItem(sections: NavSection[], path: string): { section: NavSection; item: NavItem } | null {
  let bestExact: { section: NavSection; item: NavItem } | null = null;
  let bestPrefix: { section: NavSection; item: NavItem; len: number } | null = null;
  for (const section of sections) {
    for (const item of section.items || []) {
      if (!item.feRoute) continue;
      if (item.feRoute === path) {
        bestExact = { section, item };
      } else if (path.startsWith(item.feRoute.endsWith('/') ? item.feRoute : item.feRoute + '/')) {
        const len = item.feRoute.length;
        if (!bestPrefix || len > bestPrefix.len) bestPrefix = { section, item, len };
      }
    }
  }
  return bestExact || (bestPrefix ? { section: bestPrefix.section, item: bestPrefix.item } : null);
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

const ManifestRouter: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [sections, setSections] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    api.get<MenuResponse>(`${API_CONFIG.NAVIGATION_URL}/api/v1/U/${user.id}/navigation/menu`)
      .then((res) => setSections(res.data?.sections || []))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const path = location.pathname;
  const slug = params.slug || '';
  const match = useMemo(() => findMatchingItem(sections, path), [sections, path]);

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading module manifest…</div>;
  if (!match) return <StubNoMatch path={path} slug={slug} />;

  const { item, section } = match;
  const Component = componentByName(item.feComponent);
  if (!Component) return <StubNoComponent item={item} section={section} />;

  return (
    <Suspense fallback={<div className="p-6 text-gray-500 text-sm">Loading module…</div>}>
      <Component />
    </Suspense>
  );
};

export default ManifestRouter;

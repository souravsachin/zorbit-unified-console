import React, { useEffect, useState } from 'react';
import { Map, ChevronRight, ChevronDown, ExternalLink, Loader2, FolderTree } from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Route-to-module attribution map                                    */
/* ------------------------------------------------------------------ */

interface ModuleAttribution {
  label: string;
  color: string;
  bg: string;
}

const ROUTE_MODULE_MAP: { prefix: string; module: ModuleAttribution }[] = [
  { prefix: '/dashboard', module: { label: 'zorbit-unified-console', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' } },
  { prefix: '/users', module: { label: 'zorbit-identity', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' } },
  { prefix: '/organizations', module: { label: 'zorbit-identity', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' } },
  { prefix: '/roles', module: { label: 'zorbit-authorization', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' } },
  { prefix: '/privileges', module: { label: 'zorbit-authorization', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' } },
  { prefix: '/navigation', module: { label: 'zorbit-navigation', color: 'text-cyan-700 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30' } },
  { prefix: '/messaging', module: { label: 'zorbit-event_bus', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' } },
  { prefix: '/audit', module: { label: 'zorbit-audit', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' } },
  { prefix: '/pii-vault', module: { label: 'zorbit-pii_vault', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' } },
  { prefix: '/pii-showcase', module: { label: 'zorbit-pii_vault', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' } },
  { prefix: '/settings', module: { label: 'zorbit-unified-console', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' } },
  { prefix: '/admin', module: { label: 'zorbit-unified-console', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' } },
  { prefix: '/app/pcg4', module: { label: 'zorbit-app-pcg4', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' } },
  { prefix: '/form-builder', module: { label: 'zorbit-pfs-form_builder', color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' } },
  { prefix: '/directory', module: { label: 'zorbit-pfs-chat + zorbit-pfs-rtc', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' } },
  { prefix: '/support-center', module: { label: 'zorbit-tpm-rocket_chat + unified-console', color: 'text-pink-700 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' } },
  { prefix: '/uw-workflow', module: { label: 'zorbit-app-uw_workflow', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' } },
  { prefix: '/hi-decisioning', module: { label: 'zorbit-app-hi_decisioning', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' } },
  { prefix: '/hi-quotation', module: { label: 'zorbit-app-hi_quotation', color: 'text-fuchsia-700 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' } },
  { prefix: '/mi-quotation', module: { label: 'zorbit-app-mi_quotation', color: 'text-lime-700 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-900/30' } },
  { prefix: '/customers', module: { label: 'sample-customer-service', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' } },
];

function getModuleForRoute(route: string): ModuleAttribution {
  // Strip namespace prefix like /O/O-OZPY/ or legacy /org/O-OZPY/
  const clean = route.replace(/^\/(O|org)\/[^/]+/, '');
  for (const entry of ROUTE_MODULE_MAP) {
    if (clean.startsWith(entry.prefix)) return entry.module;
  }
  return { label: 'unknown', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MenuItem {
  id: string;
  hashId: string;
  label: string;
  icon?: string;
  route?: string;
  section?: string;
  parentId?: string | null;
  parentHashId?: string | null;
  sortOrder?: number;
  children?: MenuItem[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SitemapPage: React.FC = () => {
  const { orgId } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const res = await api.get(`${API_CONFIG.NAVIGATION_URL}/api/v1/O/${orgId}/navigation/menus`);
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
        // The API returns a tree with children arrays. Flatten to a single list.
        const flat: MenuItem[] = [];
        const flatten = (items: MenuItem[]) => {
          items.forEach((item) => {
            flat.push(item);
            if (item.children && item.children.length > 0) {
              flatten(item.children);
            }
          });
        };
        flatten(raw);
        setMenuItems(flat);
        // Expand all sections by default
        const sectionIds = new Set<string>();
        flat.forEach((item: MenuItem) => {
          if (!item.parentId && !item.parentHashId) {
            sectionIds.add(item.hashId || item.id);
          }
        });
        setExpandedSections(sectionIds);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load menu';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [orgId]);

  // Build tree: sections (no parent) -> children
  const sections = menuItems.filter(
    (item) => !item.parentId && !item.parentHashId,
  );

  const getChildren = (parentHashId: string): MenuItem[] =>
    menuItems
      .filter(
        (item) =>
          item.parentHashId === parentHashId || item.parentId === parentHashId,
      )
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Gather unique modules for the legend
  const allModules: Record<string, ModuleAttribution> = {};
  menuItems.forEach((item) => {
    if (item.route) {
      const mod = getModuleForRoute(item.route);
      allModules[mod.label] = mod;
    }
  });

  const moduleEntries = Object.entries(allModules);
  const totalSections = sections.length;
  const totalItems = menuItems.length;
  const totalRoutes = menuItems.filter((i) => i.route).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          <Map className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Sitemap
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete menu structure with module attribution
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <span>
          <strong className="text-gray-900 dark:text-white">
            {totalSections}
          </strong>{' '}
          sections
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>
          <strong className="text-gray-900 dark:text-white">
            {totalItems}
          </strong>{' '}
          menu items
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>
          <strong className="text-gray-900 dark:text-white">
            {totalRoutes}
          </strong>{' '}
          routed
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>
          <strong className="text-gray-900 dark:text-white">
            {moduleEntries.length}
          </strong>{' '}
          contributing modules
        </span>
      </div>

      {/* Module legend */}
      {moduleEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Module Legend
          </p>
          <div className="flex flex-wrap gap-2">
            {moduleEntries.map(([label, mod]) => (
              <span
                key={label}
                className={`text-[10px] font-mono font-semibold px-2 py-1 rounded ${mod.bg} ${mod.color}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading menu tree...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Sitemap Tree */}
      {!loading && !error && (
        <div className="space-y-2">
          {sections
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((section) => {
              const sectionId = section.hashId || section.id;
              const expanded = expandedSections.has(sectionId);
              const children = getChildren(sectionId);
              const sectionModule = section.route
                ? getModuleForRoute(section.route)
                : null;

              return (
                <div
                  key={sectionId}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <FolderTree className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm flex-1">
                      {section.label}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {section.section || 'root'}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                      {children.length} items
                    </span>
                    {sectionModule && (
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${sectionModule.bg} ${sectionModule.color}`}
                      >
                        {sectionModule.label}
                      </span>
                    )}
                  </button>

                  {/* Children */}
                  {expanded && children.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {children.map((child, idx) => {
                        const mod = child.route
                          ? getModuleForRoute(child.route)
                          : null;
                        const grandChildren = getChildren(
                          child.hashId || child.id,
                        );
                        return (
                          <React.Fragment key={child.hashId || child.id}>
                            <div
                              className={`flex items-center gap-3 px-4 py-2.5 pl-10 ${
                                idx > 0
                                  ? 'border-t border-gray-50 dark:border-gray-700/50'
                                  : ''
                              } hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors`}
                            >
                              {/* Tree connector */}
                              <span className="text-gray-300 dark:text-gray-600 text-xs w-4 text-center">
                                {idx === children.length - 1 ? '\u2514' : '\u251C'}
                              </span>

                              {/* Icon */}
                              {child.icon && (
                                <span className="text-xs text-gray-400 w-16 shrink-0 font-mono truncate">
                                  {child.icon}
                                </span>
                              )}

                              {/* Label */}
                              <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                                {child.label}
                              </span>

                              {/* Route */}
                              {child.route && (
                                <span className="text-xs text-gray-400 font-mono max-w-[240px] truncate">
                                  {child.route}
                                </span>
                              )}

                              {/* Module badge */}
                              {mod && (
                                <span
                                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${mod.bg} ${mod.color}`}
                                >
                                  {mod.label}
                                </span>
                              )}

                              {/* External link icon if has route */}
                              {child.route && (
                                <a
                                  href={child.route.replace(
                                    '{{org_id}}',
                                    orgId,
                                  )}
                                  className="text-gray-300 hover:text-indigo-500 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>

                            {/* Grandchildren (3rd level) */}
                            {grandChildren.map((gc, gIdx) => {
                              const gcMod = gc.route
                                ? getModuleForRoute(gc.route)
                                : null;
                              return (
                                <div
                                  key={gc.hashId || gc.id}
                                  className="flex items-center gap-3 px-4 py-2 pl-20 border-t border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                                >
                                  <span className="text-gray-300 dark:text-gray-600 text-xs w-4 text-center">
                                    {gIdx === grandChildren.length - 1
                                      ? '\u2514'
                                      : '\u251C'}
                                  </span>
                                  {gc.icon && (
                                    <span className="text-xs text-gray-400 w-16 shrink-0 font-mono truncate">
                                      {gc.icon}
                                    </span>
                                  )}
                                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                    {gc.label}
                                  </span>
                                  {gc.route && (
                                    <span className="text-xs text-gray-400 font-mono max-w-[200px] truncate">
                                      {gc.route}
                                    </span>
                                  )}
                                  {gcMod && (
                                    <span
                                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${gcMod.bg} ${gcMod.color}`}
                                    >
                                      {gcMod.label}
                                    </span>
                                  )}
                                  {gc.route && (
                                    <a
                                      href={gc.route.replace(
                                        '{{org_id}}',
                                        orgId,
                                      )}
                                      className="text-gray-300 hover:text-indigo-500 transition-colors"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty section */}
                  {expanded && children.length === 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 pl-10">
                      <span className="text-xs text-gray-400 italic">
                        No child items
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default SitemapPage;

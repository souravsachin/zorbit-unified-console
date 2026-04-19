/**
 * Sidebar6Level — 6-level hierarchical sidebar
 *
 * Drop-in replacement for HamburgerMenu when menuStyle === '6level'.
 * Matches the same open/close/overlay/pin behavior.
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ChevronsDown,
  ChevronsUp,
  Lock,
  Unlock,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SidebarSearch from './SidebarSearch';
import BusinessLineSelector, { BusinessLine, BUSINESS_LINE_LABELS, SHORT_LABELS } from './BusinessLineSelector';
import SidebarSwitcher from './SidebarSwitcher';
import { L1Node, MenuNodeData, MenuNodePlacement, ForceExpandContext, ForceExpandSignal } from './MenuNode';
import staticMenuData from '../../data/menu-6level.json';
import { navigationService, MenuItem } from '../../services/navigation';
import type { MenuStyle } from '../../hooks/useMenuPreference';
import type { UserPreferences } from '../../services/preferences';

/**
 * Transform a flat/nested MenuItem[] from the navigation service into
 * the MenuNodeData[] shape the sidebar tree expects.
 */
function transformNavItems(items: MenuItem[], level = 1): MenuNodeData[] {
  function transform(item: MenuItem, lvl: number): MenuNodeData {
    return {
      id: item.hashId || item.id,
      label: item.label,
      icon: item.icon || '',
      route: item.route || null,
      privilegeCode: item.privilegeCode || null,
      level: lvl,
      children: item.children ? item.children.map((c) => transform(c, lvl + 1)) : [],
    };
  }
  return items.map((item) => transform(item, level));
}

/**
 * Parse JWT privileges from localStorage token.
 * Returns privilege code strings, or null if superadmin (has 'superadmin' role).
 */
function getJwtPrivileges(): { privileges: string[]; isSuperAdmin: boolean } {
  try {
    const token = localStorage.getItem('zorbit_token');
    if (!token) return { privileges: [], isSuperAdmin: false };
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isSuperAdmin = payload.role === 'superadmin' || payload.role === 'admin';
    const privileges: string[] = Array.isArray(payload.privileges) ? payload.privileges : [];
    return { privileges, isSuperAdmin };
  } catch {
    return { privileges: [], isSuperAdmin: false };
  }
}

/**
 * Filter menu nodes by user privileges (client-side defense in depth).
 * Nodes without a privilegeCode are always visible.
 * Superadmin sees everything.
 * A parent node is visible if it has no privilegeCode or at least one visible child.
 */
function filterByPrivileges(
  nodes: MenuNodeData[],
  privileges: string[],
  isSuperAdmin: boolean,
): MenuNodeData[] {
  if (isSuperAdmin) return nodes;

  function filterNode(node: MenuNodeData): MenuNodeData | null {
    // Recursively filter children first
    const filteredChildren = node.children
      .map(filterNode)
      .filter(Boolean) as MenuNodeData[];

    // Leaf node with a privilege code: check access
    if (node.privilegeCode && filteredChildren.length === 0 && node.children.length === 0) {
      if (!privileges.includes(node.privilegeCode)) return null;
    }

    // Branch node: visible if it has visible children or no privilege restriction
    if (node.children.length > 0 && filteredChildren.length === 0) {
      // All children were filtered out
      if (node.privilegeCode && !privileges.includes(node.privilegeCode)) return null;
      // Even without privilege, hide empty branches
      return null;
    }

    return { ...node, children: filteredChildren };
  }

  return nodes.map(filterNode).filter(Boolean) as MenuNodeData[];
}

// ─── Business-line filter ─────────────────────────────────────────────
//
// Two modes coexist:
//
//  A. Static mode — node IDs follow a 6-level tree convention (hi-, biz-hi,
//     biz-dist-pm-pcg4, etc). The ID itself encodes which business line it
//     belongs to. We filter by ID prefix against BIZ_LINE_PREFIXES.
//
//  B. Database mode — nodes come from the nav service `/menu` API. The API
//     returns per-module sections carrying `placement.businessLine` and an
//     optional `placement.specificTo` array. We filter using that payload.
//     We DO NOT hardcode "zorbit-cor-X belongs to business line Y" mappings.
//
// Both filters honor the same set of selectable editions (insurance lines +
// TPA/Broker/Provider/Regulator). There is deliberately no "Platform View"
// dropdown entry; core and feature-services modules simply always pass the
// filter regardless of selected edition.
//
// See US-NV-2083 (2026-04-19) for the rewrite rationale. The prior hard-coded
// BIZ_LINE_PREFIXES / PLATFORM_SECTION_IDS approach failed because API-emitted
// IDs (`zorbit-app-hi_quotation-0`) never matched the static tree's ID shape.

// Static-tree structural IDs — kept only for static mode.
const BIZ_STRUCTURAL_IDS = new Set([
  'business-insurer', 'biz-distribution', 'biz-servicing', 'biz-finance',
  'biz-dist-product-mgmt', 'biz-dist-policy-admin', 'biz-dist-reporting',
  'biz-serv-network', 'biz-serv-claims', 'biz-serv-customer',
  'biz-serv-fwa', 'biz-serv-reporting',
  'biz-fin-premium', 'biz-fin-reporting',
]);
const STATIC_PLATFORM_IDS = new Set([
  'platform-core', 'platform-feature-services', 'ai-automation', 'administration',
]);
// Note: 'platform' remains in the BusinessLine type because older internal
// checks in this file reference it (e.g. label override around the
// business-insurer node). The dropdown (BusinessLineSelector.tsx GROUPS) does
// NOT expose 'platform' as a selectable option — that was removed by the user
// in an earlier session. Empty prefixes = show all.
const STATIC_LINE_PREFIXES: Record<BusinessLine, string[]> = {
  platform:    [],
  health:      ['hi-', 'health', 'biz-health', 'biz-hi', 'biz-dist-pm-', 'biz-dist-pas-', 'biz-dist-pm-pcg4'],
  motor:       ['mi-', 'motor', 'biz-motor', 'biz-dist-pm-motor', 'biz-dist-pm-', 'biz-dist-pas-'],
  marine:      ['marine', 'biz-marine', 'biz-dist-pm-', 'biz-dist-pas-'],
  property:    ['property', 'biz-property', 'biz-dist-pm-', 'biz-dist-pas-'],
  life:        ['life', 'biz-life', 'biz-dist-pm-', 'biz-dist-pas-'],
  uhc:         ['uhc', 'biz-uhc', 'biz-hi', 'biz-dist-pm-', 'biz-dist-pas-'],
  'tpa-motor': ['tpa-motor', 'biz-tpa-motor', 'biz-motor', 'biz-dist-pm-', 'biz-dist-pas-'],
  tpa:         ['tpa', 'biz-tpa', 'biz-hi', 'biz-dist-pm-', 'biz-dist-pas-'],
  broker:      ['broker', 'biz-broker', 'biz-dist-pm-', 'biz-dist-pas-'],
  provider:    ['provider', 'biz-provider', 'biz-dist-pm-', 'biz-dist-pas-'],
  regulator:   ['regulator', 'biz-regulator', 'biz-dist-pm-', 'biz-dist-pas-'],
};

// Business lines whose sections are NOT tied to a specific insurance product —
// they cut across all insurance editions. Core and feature-services are
// always visible; distribution/underwriting/claims/servicing are visible for
// any selected insurance edition unless the section also declares `specificTo`.
const EDITION_AGNOSTIC_BUSINESS_LINES = new Set([
  'core', 'feature-services', 'distribution', 'underwriting', 'claims', 'servicing',
]);
const ALWAYS_VISIBLE_BUSINESS_LINES = new Set(['core', 'feature-services']);

function filterByBusinessLineStatic(nodes: MenuNodeData[], line: BusinessLine): MenuNodeData[] {
  const prefixes = STATIC_LINE_PREFIXES[line];
  if (!prefixes || prefixes.length === 0) return nodes;
  function filterNode(node: MenuNodeData): MenuNodeData | null {
    if (BIZ_STRUCTURAL_IDS.has(node.id)) {
      const kids = node.children.map(filterNode).filter(Boolean) as MenuNodeData[];
      return { ...node, children: kids };
    }
    const idLower = node.id.toLowerCase();
    const selfMatches = prefixes.some((p) => idLower.startsWith(p) || idLower.includes(p));
    const kids = node.children.map(filterNode).filter(Boolean) as MenuNodeData[];
    if (selfMatches || kids.length > 0) return { ...node, children: kids };
    return null;
  }
  return nodes.map((node) => {
    if (STATIC_PLATFORM_IDS.has(node.id)) return node;
    return filterNode(node);
  }).filter(Boolean) as MenuNodeData[];
}

function filterByBusinessLineDatabase(
  nodes: MenuNodeData[],
  line: BusinessLine,
): MenuNodeData[] {
  // In database mode the top-level nodes are module sections with placement
  // metadata attached to each node. A node is visible if ANY of these hold:
  //   - placement.businessLine is core / feature-services (always visible)
  //   - placement.businessLine is edition-agnostic AND placement.specificTo is
  //     either absent or contains the selected edition
  //   - placement.specificTo explicitly contains the selected edition
  return nodes
    .map((node) => {
      const placement = node.placement || {};
      const nodeLine = placement.businessLine;
      const specificTo = placement.specificTo;

      if (nodeLine && ALWAYS_VISIBLE_BUSINESS_LINES.has(nodeLine)) {
        return node;
      }
      if (Array.isArray(specificTo) && specificTo.length > 0) {
        return specificTo.includes(line) ? node : null;
      }
      if (nodeLine && EDITION_AGNOSTIC_BUSINESS_LINES.has(nodeLine)) {
        return node;
      }
      return null;
    })
    .filter(Boolean) as MenuNodeData[];
}

function filterByBusinessLine(
  nodes: MenuNodeData[],
  line: BusinessLine,
  mode: 'static' | 'database',
): MenuNodeData[] {
  return mode === 'database'
    ? filterByBusinessLineDatabase(nodes, line)
    : filterByBusinessLineStatic(nodes, line);
}

// Expand/collapse state tracker
function getAllNodeIds(nodes: MenuNodeData[]): string[] {
  const ids: string[] = [];
  function walk(n: MenuNodeData) {
    ids.push(n.id);
    n.children.forEach(walk);
  }
  nodes.forEach(walk);
  return ids;
}

// ─── Props ────────────────────────────────────────────────────────────
interface Sidebar6LevelProps {
  open: boolean;
  onClose: () => void;
  isOverlay: boolean;
  menuStyle: MenuStyle;
  onToggleMenuStyle: () => void;
  prefs: UserPreferences;
  updatePrefs: (partial: Partial<UserPreferences>) => void;
}

const Sidebar6Level: React.FC<Sidebar6LevelProps> = ({
  open,
  onClose,
  isOverlay,
  menuStyle,
  onToggleMenuStyle,
  prefs,
  updatePrefs,
}) => {
  const { user, orgId, logout } = useAuth();

  // Static fallback — always the ground truth until full pipeline is wired
  const [staticData] = useState<MenuNodeData[]>(staticMenuData as MenuNodeData[]);
  // Nav-service data fetched in background for comparison (NOT auto-promoted to active)
  const [navServiceData, setNavServiceData] = useState<MenuNodeData[]>([]);
  const [autoMenuSource, setAutoMenuSource] = useState<'static' | 'database'>('static');
  const fetchedRef = useRef(false);

  // Parse JWT privileges for client-side filtering
  const { privileges: jwtPrivileges, isSuperAdmin } = useMemo(() => getJwtPrivileges(), []);

  useEffect(() => {
    if (fetchedRef.current) return;
    const userId = user?.id;
    if (!userId) return;
    fetchedRef.current = true;

    // Fetch nav service data. Auto-promotes to 'database' source when:
    //   1. The nav service returns source: 'database' (registry cache populated)
    //   2. There are actual menu items to show
    // This means the full pipeline is working:
    //   Module → Kafka → module-registry → platform.module.ready → navigation → here
    navigationService
      .getMenu(userId)
      .then((res) => {
        const data = res.data as {
          stale?: boolean;
          sections?: Array<{
            moduleId: string;
            moduleName?: string;
            placement?: MenuNodePlacement;
            items?: Array<{ label: string; feRoute: string; icon: string; privilege: string }>;
          }>;
        };
        const isStale = data?.stale !== false;
        const sections = data?.sections || [];

        // Build hierarchical nodes: each section becomes a level-1 module node;
        // its items become level-2 leaves. Placement metadata is attached to
        // the top-level node so filterByBusinessLineDatabase can decide
        // visibility from the payload (no ID-prefix hacks).
        const dbNodes: MenuNodeData[] = sections
          .filter((sec) => (sec.items || []).length > 0)
          .map((sec) => ({
            id: sec.moduleId,
            label: sec.moduleName || sec.moduleId,
            icon: '',
            route: null,
            privilegeCode: null,
            level: 1,
            placement: sec.placement || {},
            children: (sec.items || []).map((item, idx) => ({
              id: `${sec.moduleId}-${idx}`,
              label: item.label,
              icon: item.icon || 'circle',
              route: item.feRoute || null,
              privilegeCode: item.privilege || null,
              level: 2,
              children: [],
            })),
          }));

        if (!isStale && dbNodes.length > 0) {
          // Full pipeline confirmed: Module→Kafka→registry→platform.module.ready→navigation→here
          setNavServiceData(dbNodes);
          setAutoMenuSource('database');
        } else if (dbNodes.length > 0) {
          // Nav service reachable but serving static fallback — store for manual comparison only
          setNavServiceData(dbNodes);
          // autoMenuSource stays 'static' — pipeline not fully wired yet
        }
      })
      .catch(() => {
        // Nav service unreachable — navServiceData stays empty
      });
  }, [user?.id, orgId]);

  // Local state
  const [filter, setFilter] = useState('');
  const [businessLine, setBusinessLine] = useState<BusinessLine>('health');
  const [forceExpand, setForceExpand] = useState<ForceExpandSignal | null>(null);
  const [iconOnly, setIconOnly] = useState(false);

  // menuSource: auto-promoted to 'database' when the full pipeline delivers data.
  // Pipeline: Module → Kafka → module-registry → platform.module.ready → nav service → here.
  const menuSource: 'static' | 'database' = autoMenuSource;

  // forceSource: manual debug toggle (null = follow menuSource)
  // Cycles: null → 'static' → 'database' → null
  const [forceSource, setForceSource] = useState<null | 'static' | 'database'>(null);
  const cycleForceSource = useCallback(() => {
    setForceSource((prev) => {
      if (prev === null) return 'static';
      if (prev === 'static') return 'database';
      return null;
    });
  }, []);

  // Effective data: when user forces 'database', use nav service data (or empty)
  const effectiveSource = forceSource ?? menuSource;
  const menuData = effectiveSource === 'database' ? navServiceData : staticData;

  // Height resize state — null = fill full screen height
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null);
  const [isHeightDragging, setIsHeightDragging] = useState(false);
  const heightDragStartY = useRef(0);
  const heightDragStartHeight = useRef(0);

  const handleHeightResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const aside = (e.currentTarget as HTMLElement).closest('aside');
    heightDragStartHeight.current = sidebarHeight ?? (aside?.getBoundingClientRect().height ?? 600);
    heightDragStartY.current = e.clientY;
    setIsHeightDragging(true);

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(200, heightDragStartHeight.current + ev.clientY - heightDragStartY.current);
      setSidebarHeight(next);
    };

    const onUp = () => {
      setIsHeightDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarHeight]);

  // Sidebar pin from prefs (mirrors classic sidebar behavior)
  const sidebar = prefs.ui?.sidebar;
  const pinned = sidebar?.pinned ?? false;

  const togglePin = useCallback(() => {
    updatePrefs({
      ui: {
        ...prefs.ui,
        sidebar: { ...sidebar, pinned: !pinned },
      },
    });
  }, [pinned, prefs.ui, sidebar, updatePrefs]);

  const MIN_WIDTH = 72;
  const MAX_WIDTH = 520;
  const iconOnlyPx = 72;

  // `contentWidth` — the inner div is always this wide (never reflows during drag)
  const [contentWidth, setContentWidth] = useState<number>(() => {
    const saved = localStorage.getItem('zorbit_sidebar_width');
    if (saved) {
      const n = parseInt(saved, 10);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
    return 280;
  });

  // `clippedWidth` — only the aside uses this; curtain-clips the fixed inner div
  const [clippedWidth, setClippedWidth] = useState(contentWidth);

  const [isDragging, setIsDragging] = useState(false);
  const [dragTooltipY, setDragTooltipY] = useState(0);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const liveWidthRef = useRef(contentWidth);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = liveWidthRef.current;
    setDragTooltipY(e.clientY);
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth.current + ev.clientX - dragStartX.current));
      liveWidthRef.current = next;
      // Only update the clipping width — inner content stays at contentWidth
      setClippedWidth(next);
      setDragTooltipY(ev.clientY);
    };

    const onUp = () => {
      const final = liveWidthRef.current;
      setIsDragging(false);
      setContentWidth(final);   // settle content to new size
      setClippedWidth(final);
      localStorage.setItem('zorbit_sidebar_width', String(final));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Filter menu data: business line first, then privilege filtering.
  // `effectiveSource` picks the correct filter strategy (static tree vs DB).
  const filteredData = useMemo(() => {
    const byLine = filterByBusinessLine(menuData, businessLine, effectiveSource);
    return filterByPrivileges(byLine, jwtPrivileges, isSuperAdmin);
  }, [menuData, businessLine, jwtPrivileges, isSuperAdmin, effectiveSource]);

  // Initials helper
  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  // Count total visible items
  const totalItems = useMemo(() => getAllNodeIds(filteredData).length, [filteredData]);

  const handleNavigate = useCallback(() => {
    if (isOverlay) onClose();
  }, [isOverlay, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOverlay && open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: open ? (iconOnly ? iconOnlyPx : clippedWidth) : 0,
          ...(sidebarHeight ? { height: sidebarHeight, alignSelf: 'flex-start' } : {}),
        }}
        className={`
          ${isOverlay ? 'fixed top-0 left-0 z-50 h-screen' : 'relative z-0 self-stretch'}
          bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/60
          flex flex-col
          ${isDragging ? '' : 'transition-[width] duration-300 ease-in-out'}
          overflow-hidden
          shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_8px_-2px_rgba(0,0,0,0.3)]
        `}
      >
        {/* Resize handle — right edge drag */}
        {!iconOnly && open && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute top-0 right-0 h-full z-10 group"
            style={{ width: 6, cursor: 'col-resize' }}
          >
            {/* Indicator line */}
            <div className={`
              absolute top-0 right-0 h-full w-[2px]
              transition-colors duration-150
              ${isDragging
                ? 'bg-indigo-400 dark:bg-indigo-500'
                : 'bg-transparent group-hover:bg-indigo-300 dark:group-hover:bg-indigo-600'}
            `} />

            {/* Live size tooltip — shown only while dragging */}
            {isDragging && (
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{ left: clippedWidth + 14, top: dragTooltipY - 36 }}
              >
                <div className="
                  bg-gray-900/95 dark:bg-gray-950/95
                  border border-indigo-500/40
                  rounded-lg shadow-xl shadow-black/30
                  px-3 py-2
                  backdrop-blur-sm
                  flex flex-col items-center gap-0.5
                  min-w-[110px]
                ">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-semibold">sidebar</span>
                    <span className="text-white font-mono font-bold text-sm leading-none">{clippedWidth}</span>
                    <span className="text-gray-500 text-[10px]">px</span>
                  </div>
                  <div className="w-full h-px bg-gray-700/60 my-0.5" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">canvas</span>
                    <span className="text-white font-mono font-bold text-sm leading-none">{window.innerWidth - clippedWidth}</span>
                    <span className="text-gray-500 text-[10px]">px</span>
                  </div>
                </div>
                {/* Arrow pointing left toward the handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-0 h-0"
                  style={{
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: '6px solid rgba(99,102,241,0.4)',
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col flex-1 min-h-0" style={{ width: contentWidth, minWidth: contentWidth }}>

          {/* Header */}
          <div className="flex items-center h-14 pl-4 pr-3 border-b border-gray-100 dark:border-gray-800 shrink-0 gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-xs">Z</span>
            </div>
            <span className="font-bold text-lg flex-1 whitespace-nowrap bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300">
              Zorbit
            </span>
            {/* Menu style switcher */}
            <SidebarSwitcher menuStyle={menuStyle} onToggle={onToggleMenuStyle} compact={true} />
          </div>

          {/* User profile */}
          {user && (
            <div className="py-2 pl-4 pr-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 shadow-sm">
                  {getInitials(user.displayName || user.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium truncate text-gray-800 dark:text-gray-200">
                    {user.displayName || user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {user.role && (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded">
                        {user.role}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{orgId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center px-2 py-1 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
            {/* Collapse to icon-only / expand — independent of pin */}
            <button
              onClick={() => setIconOnly((v) => !v)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-400"
              title={iconOnly ? 'Expand sidebar' : 'Collapse to icons'}
            >
              {iconOnly ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>

            {/* Pin — sits right next to collapse */}
            <button
              onClick={togglePin}
              className={`p-1 rounded transition-colors ${
                pinned
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-400'
              }`}
              title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {pinned ? <Lock size={13} /> : <Unlock size={13} />}
            </button>

            <div className="flex-1" />

            {/* Stat badge */}
            <span className="text-[9px] text-gray-400 dark:text-gray-600 mr-1.5">
              {totalItems} items
            </span>

            <button
              onClick={() => setForceExpand((p) => ({ seq: (p?.seq ?? 0) + 1, expand: false }))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400"
              title="Collapse all"
            >
              <ChevronsUp size={14} />
            </button>
            <button
              onClick={() => setForceExpand((p) => ({ seq: (p?.seq ?? 0) + 1, expand: true }))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400"
              title="Expand all"
            >
              <ChevronsDown size={14} />
            </button>
          </div>

          {/* Search */}
          <SidebarSearch
            value={filter}
            onChange={setFilter}
            placeholder={`Search ${totalItems} items...`}
          />

          {/* Business line selector */}
          <BusinessLineSelector value={businessLine} onChange={setBusinessLine} />

          {/* Nav tree */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            <ForceExpandContext.Provider value={forceExpand}>
            {filteredData.map((node, idx) => {
              // Dynamic label for the BUSINESS section based on selected edition
              const renderNode =
                node.id === 'business-insurer' && businessLine !== 'platform'
                  ? { ...node, label: `BUSINESS — ${SHORT_LABELS[businessLine]}` }
                  : node;
              return (
                <L1Node
                  key={node.id}
                  node={renderNode as MenuNodeData}
                  nodeIndex={idx}
                  filter={filter}
                  onNavigate={handleNavigate}
                />
              );
            })}
            </ForceExpandContext.Provider>

            {filteredData.length === 0 && !filter && (
              <div className="px-4 py-8 text-center text-[11px] text-gray-400">
                No items for selected business line
              </div>
            )}

            {filter && filteredData.every((n) => {
              function anyMatch(node: MenuNodeData): boolean {
                if (node.label.toLowerCase().includes(filter.toLowerCase())) return true;
                return node.children.some(anyMatch);
              }
              return !anyMatch(n as MenuNodeData);
            }) && (
              <div className="px-4 py-8 text-center text-[11px] text-gray-400">
                No results for &ldquo;{filter}&rdquo;
              </div>
            )}
          </nav>

          {/* Diagnostic footer + logout */}
          <div className="shrink-0 px-3 py-2 border-t border-gray-100 dark:border-gray-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
              <div className="min-w-0 flex-1">
                {/* Clickable source indicator — cycles null→static→database→null */}
                <button
                  onClick={cycleForceSource}
                  title={
                    forceSource === null
                      ? `Auto: ${menuSource} — click to force static`
                      : forceSource === 'static'
                      ? `Forced: static — click to compare database`
                      : `Forced: database (${navServiceData.length} items from nav service) — click to clear`
                  }
                  className={`flex items-center gap-1 text-[10px] rounded px-0.5 -ml-0.5 transition-colors cursor-pointer
                    ${forceSource === null
                      ? 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'
                      : forceSource === 'static'
                      ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600'
                      : 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-600'}
                  `}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                  </svg>
                  <span className="font-medium whitespace-nowrap">
                    {forceSource !== null ? `⚡ ${effectiveSource}` : effectiveSource}
                  </span>
                  {forceSource === 'database' && navServiceData.length === 0 && (
                    <span className="text-red-400 text-[9px]">(empty)</span>
                  )}
                </button>
                <div className="text-[10px] font-mono text-gray-300 dark:text-gray-600 tracking-tight mt-0.5 whitespace-nowrap">
                  {__APP_VERSION__} &middot; {__BUILD_DATE__} &middot; {__GIT_SHA__}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Height resize handle — bottom edge drag */}
        {open && (
          <div
            onMouseDown={handleHeightResizeMouseDown}
            onDoubleClick={() => setSidebarHeight(null)}
            className="absolute bottom-0 left-0 right-0 z-10 group"
            style={{ height: 6, cursor: 'row-resize' }}
            title="Drag to resize height · Double-click to reset"
          >
            <div className={`
              absolute bottom-0 left-0 right-0 h-[2px]
              transition-colors duration-150
              ${isHeightDragging
                ? 'bg-indigo-400 dark:bg-indigo-500'
                : 'bg-transparent group-hover:bg-indigo-300 dark:group-hover:bg-indigo-600'}
            `} />
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar6Level;

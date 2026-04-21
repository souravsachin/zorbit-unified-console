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
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SidebarSearch from './SidebarSearch';
import BusinessLineSelector, { BusinessLine, EditionMeta, BUSINESS_LINE_LABELS, SHORT_LABELS } from './BusinessLineSelector';
import SidebarSwitcher from './SidebarSwitcher';
import { L1Node, MenuNodeData, MenuNodePlacement, ForceExpandContext, ForceExpandSignal } from './MenuNode';
import staticMenuData from '../../data/menu-6level.json';
import { navigationService, MenuItem } from '../../services/navigation';
import { moduleRegistryService } from '../../services/moduleRegistry';
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
  _line: BusinessLine,
): MenuNodeData[] {
  // In DB mode buildDbScaffold has already filtered Business modules by the
  // selected edition and assembled the L1 scaffolds. Nothing more to do here.
  return nodes;
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

// ─── DB scaffold builder (auto-discovery) ─────────────────────────────
//
// Reads the new placement schema where each manifest declares:
//   placement.scaffold              — L1 label (e.g. "Platform Core")
//   placement.scaffoldSortOrder     — numeric L1 ordering (first-seen wins)
//   placement.edition               — only for scaffold === "Business"
//   placement.businessLine          — L2 inside Business (Distribution / Servicing / Finance)
//   placement.capabilityArea        — L3 (or L2 for non-Business scaffolds)
//   placement.sortOrder             — order inside the deepest grouping
//
// No hardcoded scaffold list. No hardcoded vocabulary. The scaffold tree
// emerges from whatever manifests are registered. Edition filtering is
// strict: only sections whose edition.name === selected edition show under
// the Business scaffold. Non-Business scaffolds (Platform Core / PFS /
// AI and Voice / Administration) ignore edition entirely.

interface ApiSection {
  moduleId: string;
  moduleName?: string;
  placement?: MenuNodePlacement & {
    scaffold?: string;
    scaffoldSortOrder?: number;
    edition?: EditionMeta | null;
    capabilityArea?: string;
  };
  items?: Array<{ label: string; feRoute: string; icon: string; privilege: string; feComponent?: string | null }>;
}

// ─── Guide grouping (US-GU-2101) ───────────────────────────────────────
//
// Every module that declares a `guide` block (per SPEC-module-manifest §5)
// ships six nav items with these feComponent names. The sidebar collects
// them under a single "Guide" parent node so the flat 6-siblings layout
// (Intro / Presentation / Lifecycle / Videos / Resources / Pricing) does
// not drown out the module's actual working pages.
//
// Detection is by feComponent — explicit, avoids false positives from any
// page that happens to be labelled "Pricing" or "Videos".
const GUIDE_FE_COMPONENTS = new Set([
  'GuideIntroView',
  'GuideSlideDeck',
  'GuideLifecycle',
  'GuideVideos',
  'GuideDocs',
  'GuidePricing',
]);

// Canonical display order inside the Guide parent.
const GUIDE_COMPONENT_ORDER: Record<string, number> = {
  GuideIntroView:  1,
  GuideSlideDeck:  2,
  GuideLifecycle:  3,
  GuideVideos:     4,
  GuideDocs:       5,
  GuidePricing:    6,
};

/**
 * Walk a module's leaf items. If two or more are "guide" items (identified
 * by feComponent), pull them out of the flat list and insert a single
 * collapsible Guide parent in the position of the FIRST guide item. The
 * six children appear under it in the canonical order above.
 *
 * Non-guide items keep their relative order. When fewer than 2 guide items
 * are present, the input is returned unchanged (no wrapping for 0/1 items —
 * a single-child "Guide" parent would be visual noise).
 */
function groupGuideItems(
  items: MenuNodeData[],
  parentLevel: number,
  wrapperIdPrefix: string,
): MenuNodeData[] {
  const guideChildren: MenuNodeData[] = [];
  const result: MenuNodeData[] = [];
  let insertIdx = -1;

  for (const item of items) {
    const fc = item.feComponent || '';
    if (GUIDE_FE_COMPONENTS.has(fc)) {
      if (insertIdx === -1) insertIdx = result.length;
      guideChildren.push({ ...item, level: parentLevel + 1 });
    } else {
      result.push(item);
    }
  }

  if (guideChildren.length < 2) return items; // don't wrap 0/1 items

  guideChildren.sort(
    (a, b) =>
      (GUIDE_COMPONENT_ORDER[a.feComponent || ''] ?? 99) -
      (GUIDE_COMPONENT_ORDER[b.feComponent || ''] ?? 99),
  );

  const wrapper: MenuNodeData = {
    id: `${wrapperIdPrefix}-guide`,
    label: 'Guide',
    icon: 'BookOpen',
    route: null,
    privilegeCode: null,
    level: parentLevel,
    children: guideChildren,
  };

  // Insert wrapper at the position of the first removed guide item so the
  // Guide block appears where the author placed the first guide entry.
  result.splice(insertIdx, 0, wrapper);
  return result;
}

function prettyModuleName(moduleId: string): string {
  return moduleId
    .replace(/^zorbit-([a-z]+)-/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ScaffoldGroup {
  id: string;
  label: string;
  sortOrder: number;
  // For Business scaffold, sections are first grouped by businessLine (L2),
  // then by capabilityArea (L3). For other scaffolds, sections are grouped
  // by capabilityArea directly (L2 == L3 in our model).
  l2Buckets: Map<string, L2Bucket>;
}

interface L2Bucket {
  id: string;
  label: string;
  sortOrder: number;
  // For Business: { capabilityArea -> [sections] }
  // For non-Business: { capabilityArea (= module's own area) -> [sections] }
  l3Buckets: Map<string, L3Bucket>;
}

interface L3Bucket {
  id: string;
  label: string;
  sortOrder: number;
  sections: ApiSection[];
}

function buildDbScaffold(sections: ApiSection[], selectedEdition: BusinessLine): MenuNodeData[] {
  const visible = sections.filter((sec) => (sec.items || []).length > 0);

  const scaffolds = new Map<string, ScaffoldGroup>();

  for (const sec of visible) {
    const placement = sec.placement || {};
    const scaffoldName = (placement.scaffold as string) || 'Other';
    const scaffoldOrder = (placement.scaffoldSortOrder as number) ?? 999;

    // Edition gate (strict): Business modules show only when the user-
    // selected edition matches the manifest's declared edition.name.
    if (scaffoldName === 'Business') {
      const edName = placement.edition?.name;
      if (!edName || edName !== selectedEdition) continue;
    }

    if (!scaffolds.has(scaffoldName)) {
      scaffolds.set(scaffoldName, {
        id: scaffoldName.toLowerCase().replace(/\s+/g, '-'),
        label: scaffoldName.toUpperCase(),
        sortOrder: scaffoldOrder,
        l2Buckets: new Map(),
      });
    }
    const sc = scaffolds.get(scaffoldName)!;
    if (scaffoldOrder < sc.sortOrder) sc.sortOrder = scaffoldOrder;

    // L2 bucket: businessLine for Business scaffold, capabilityArea for others.
    const l2Label = scaffoldName === 'Business'
      ? (placement.businessLine || 'Other')
      : (placement.capabilityArea || prettyModuleName(sec.moduleId));
    const l2Order = (placement.sortOrder as number) ?? 999;

    if (!sc.l2Buckets.has(l2Label)) {
      sc.l2Buckets.set(l2Label, {
        id: `${sc.id}-${l2Label.toLowerCase().replace(/\s+/g, '-')}`,
        label: l2Label,
        sortOrder: l2Order,
        l3Buckets: new Map(),
      });
    }
    const l2 = sc.l2Buckets.get(l2Label)!;

    if (scaffoldName === 'Business') {
      // L3 inside Business: capabilityArea (Product Mgmt / Policy Admin / FWA / etc.).
      const l3Label = placement.capabilityArea || 'Other';
      if (!l2.l3Buckets.has(l3Label)) {
        l2.l3Buckets.set(l3Label, {
          id: `${l2.id}-${l3Label.toLowerCase().replace(/\s+/g, '-')}`,
          label: l3Label,
          sortOrder: l2Order,
          sections: [],
        });
      }
      l2.l3Buckets.get(l3Label)!.sections.push(sec);
    } else {
      // Non-Business: each module is its own L2 (already created above).
      // We use a single synthetic L3 keyed by the module to keep the same
      // tree-walking code below.
      const onlyKey = '__module__';
      if (!l2.l3Buckets.has(onlyKey)) {
        l2.l3Buckets.set(onlyKey, {
          id: l2.id,
          label: l2Label,
          sortOrder: l2Order,
          sections: [],
        });
      }
      l2.l3Buckets.get(onlyKey)!.sections.push(sec);
    }
  }

  // Build MenuNodeData tree from the collected groups.
  const sortedScaffolds = Array.from(scaffolds.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });

  return sortedScaffolds.map((sc): MenuNodeData => ({
    id: sc.id,
    label: sc.label,
    icon: '',
    route: null,
    privilegeCode: null,
    level: 1,
    placement: { businessLine: sc.label.toLowerCase() },
    children: Array.from(sc.l2Buckets.values())
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
      .map((l2): MenuNodeData => {
        if (sc.label === 'BUSINESS') {
          // Business: emit L2 (Distribution/Servicing/Finance) with L3
          // capability buckets containing the modules below them.
          return {
            id: l2.id,
            label: l2.label,
            icon: '',
            route: null,
            privilegeCode: null,
            level: 2,
            children: Array.from(l2.l3Buckets.values())
              .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
              .map((l3): MenuNodeData => ({
                id: l3.id,
                label: l3.label,
                icon: '',
                route: null,
                privilegeCode: null,
                level: 3,
                children: l3.sections
                  .sort((a, b) => (a.placement?.sortOrder ?? 999) - (b.placement?.sortOrder ?? 999))
                  .map((sec): MenuNodeData => {
                    const flat: MenuNodeData[] = (sec.items || []).map((item, idx) => ({
                      id: `${sec.moduleId}-${idx}`,
                      label: item.label,
                      icon: item.icon || 'circle',
                      route: item.feRoute || null,
                      privilegeCode: item.privilege || null,
                      level: 5,
                      children: [],
                      feComponent: item.feComponent ?? null,
                    }));
                    return {
                      id: sec.moduleId,
                      label: sec.moduleName || prettyModuleName(sec.moduleId),
                      icon: '',
                      route: null,
                      privilegeCode: null,
                      level: 4,
                      children: groupGuideItems(flat, 5, sec.moduleId),
                    };
                  }),
              })),
          };
        }
        // Non-Business: skip the synthetic L3 wrapper — sections become L2's
        // children directly (each section a module L2, items become L3).
        const sectionsFlat: ApiSection[] = Array.from(l2.l3Buckets.values()).flatMap((b) => b.sections);
        sectionsFlat.sort((a, b) => (a.placement?.sortOrder ?? 999) - (b.placement?.sortOrder ?? 999));
        const l2Id = l2.id;
        const flatChildren: MenuNodeData[] = sectionsFlat.flatMap((sec) =>
          (sec.items || []).map((item, idx) => ({
            id: `${sec.moduleId}-${idx}`,
            label: item.label,
            icon: item.icon || 'circle',
            route: item.feRoute || null,
            privilegeCode: item.privilege || null,
            level: 3,
            children: [] as MenuNodeData[],
            feComponent: item.feComponent ?? null,
          })),
        );
        return {
          id: l2.id,
          label: l2.label,
          icon: '',
          route: null,
          privilegeCode: null,
          level: 2,
          children: groupGuideItems(flatChildren, 3, l2Id),
        };
      }),
  }));
}

// Static-mode-only fallback editions list. Mirrors the dropdown that
// shipped with static mode so visual parity is preserved when no manifest
// data is yet available. DB mode uses collectEditionsFromSections instead.
// Will retire when static mode is removed.
const STATIC_EDITIONS: EditionMeta[] = [
  { name: 'Health Insurance',  category: 'Insurer',  categorySortOrder: 10, sortOrder: 10, icon: 'Heart',      iconBg: '#dcfce7', iconColor: '#15803d', iconRing: '#86efac' },
  { name: 'Motor Insurance',   category: 'Insurer',  categorySortOrder: 10, sortOrder: 20, icon: 'Car',        iconBg: '#dbeafe', iconColor: '#1d4ed8', iconRing: '#93c5fd' },
  { name: 'Marine Insurance',  category: 'Insurer',  categorySortOrder: 10, sortOrder: 30, icon: 'Anchor',     iconBg: '#ccfbf1', iconColor: '#0f766e', iconRing: '#5eead4' },
  { name: 'Property Insurance',category: 'Insurer',  categorySortOrder: 10, sortOrder: 40, icon: 'Home',       iconBg: '#fef3c7', iconColor: '#b45309', iconRing: '#fcd34d' },
  { name: 'Life Insurance',    category: 'Insurer',  categorySortOrder: 10, sortOrder: 50, icon: 'Activity',   iconBg: '#f3e8ff', iconColor: '#7c3aed', iconRing: '#c4b5fd' },
  { name: 'UHC — Health',      category: 'UHC',      categorySortOrder: 20, sortOrder: 10, icon: 'Landmark',   iconBg: '#e0f2fe', iconColor: '#0284c7', iconRing: '#7dd3fc' },
  { name: 'TPA — Health',      category: 'TPA',      categorySortOrder: 30, sortOrder: 10, icon: 'Stethoscope',iconBg: '#ffedd5', iconColor: '#c2410c', iconRing: '#fdba74' },
  { name: 'TPA — Motor',       category: 'TPA',      categorySortOrder: 30, sortOrder: 20, icon: 'Truck',      iconBg: '#fff7ed', iconColor: '#9a3412', iconRing: '#fb923c' },
  { name: 'Broker — All Lines',category: 'Broker',   categorySortOrder: 40, sortOrder: 10, icon: 'Briefcase',  iconBg: '#ede9fe', iconColor: '#7c3aed', iconRing: '#a78bfa' },
  { name: 'Provider — Hospital',category:'Provider', categorySortOrder: 50, sortOrder: 10, icon: 'Plus',       iconBg: '#d1fae5', iconColor: '#059669', iconRing: '#6ee7b7' },
  { name: 'Regulator — All Lines',category:'Regulator',categorySortOrder:60,sortOrder: 10, icon: 'Scale',      iconBg: '#fee2e2', iconColor: '#dc2626', iconRing: '#fca5a5' },
];

// Collect unique editions from API sections. First-seen wins on conflicting
// metadata for the same edition name (logged once).
function collectEditionsFromSections(sections: ApiSection[]): EditionMeta[] {
  const byName = new Map<string, EditionMeta>();
  for (const sec of sections) {
    const ed = sec.placement?.edition;
    if (!ed || !ed.name) continue;
    if (byName.has(ed.name)) continue;   // first-seen wins
    byName.set(ed.name, ed);
  }
  return Array.from(byName.values());
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
  // API sections cached as-received from the nav service. We re-bucket on
  // edition change rather than re-fetching.
  const [apiSections, setApiSections] = useState<ApiSection[]>([]);
  const [autoMenuSource, setAutoMenuSource] = useState<'static' | 'database'>('static');
  const fetchedRef = useRef(false);

  // Parse JWT privileges for client-side filtering
  const { privileges: jwtPrivileges, isSuperAdmin } = useMemo(() => getJwtPrivileges(), []);

  /**
   * Fetch the effective menu from the cascade resolver endpoint.
   * When `refresh=true` is passed, the nav service bypasses its in-memory
   * cache and recomputes from the live registered_modules + nav_overrides.
   */
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchMenu = useCallback(
    async (refresh = false) => {
      const userId = user?.id;
      if (!userId) return;
      if (refresh) setIsRefreshing(true);
      try {
        const res = await navigationService.getMenu(userId, { refresh });
        const data = res.data as {
          stale?: boolean;
          source?: string;
          bundleHash?: string;
          sections?: Array<{
            moduleId: string;
            moduleName?: string;
            placement?: MenuNodePlacement;
            items?: Array<{ label: string; feRoute: string; icon: string; privilege: string }>;
          }>;
        };
        // The new endpoint returns source='live' when the cascade resolver
        // served real data from registered_modules. The old endpoint still
        // used stale!==false — accept either signal.
        const isLive = data?.source === 'live' || data?.stale === false;
        const sections = (data?.sections || []) as ApiSection[];
        if (isLive && sections.length > 0) {
          setApiSections(sections);
          setAutoMenuSource('database');
        } else if (sections.length > 0) {
          setApiSections(sections);
          // autoMenuSource stays 'static' — pipeline not fully wired yet
        }
      } catch {
        // Nav service unreachable — navServiceData stays empty
      } finally {
        if (refresh) setIsRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (fetchedRef.current) return;
    const userId = user?.id;
    if (!userId) return;
    fetchedRef.current = true;
    void fetchMenu(false);
  }, [user?.id, orgId, fetchMenu]);

  /**
   * Header Refresh button handler (EPIC 19 Phase 1).
   *
   * Posts to the cache-invalidate endpoint for scope=U/self, then re-fetches
   * the menu with refresh=true so the next response is a guaranteed cache
   * bypass. This surfaces retired modules (e.g. 'Sample Rates') and new
   * modules within seconds of the registry change.
   */
  const handleRefreshMenu = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;
    try {
      await navigationService.invalidateMenuCache('U', userId);
    } catch {
      // Non-fatal — we'll still force a recompute via refresh=true below.
    }
    await fetchMenu(true);
  }, [user?.id, fetchMenu]);

  // Local state
  const [filter, setFilter] = useState('');
  // Edition (BusinessLine) is now a free-form string — the edition.name
  // declared by some module's manifest. Default to first discovered edition
  // when DB mode kicks in; static mode keeps the legacy 'health' default.
  const [businessLine, setBusinessLine] = useState<BusinessLine>('Health Insurance');
  const [forceExpand, setForceExpand] = useState<ForceExpandSignal | null>(null);
  const [iconOnly, setIconOnly] = useState(false);

  // Editions auto-discovered from the nav service's section placements,
  // deduped by name.
  const sectionEditions: EditionMeta[] = useMemo(
    () => collectEditionsFromSections(apiSections),
    [apiSections],
  );

  // Editions fetched from the module-registry union endpoint
  // (manifests + default catalog). This is the source of truth when DB mode
  // is active so the dropdown shows every edition the platform plans to host,
  // not just the 1-2 that happen to have live modules right now.
  const [registryEditions, setRegistryEditions] = useState<EditionMeta[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await moduleRegistryService.getEditions();
        const list = (res.data?.editions ?? []) as EditionMeta[];
        if (!cancelled && list.length > 0) setRegistryEditions(list);
      } catch {
        // Registry unreachable — fall back to section-derived editions.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // DB-mode dropdown = union of registry editions + section-derived editions,
  // section-derived wins on conflict (it carries any override a live manifest
  // has declared). First-seen wins within each source.
  const dbEditions: EditionMeta[] = useMemo(() => {
    const byName = new Map<string, EditionMeta>();
    for (const e of registryEditions) {
      if (!byName.has(e.name)) byName.set(e.name, e);
    }
    for (const e of sectionEditions) {
      byName.set(e.name, e); // override
    }
    return Array.from(byName.values());
  }, [registryEditions, sectionEditions]);

  // When new editions are discovered and current selection is unknown, snap
  // to the first one so the dropdown shows a valid value out of the gate.
  useEffect(() => {
    if (dbEditions.length === 0) return;
    if (dbEditions.find((e) => e.name === businessLine)) return;
    setBusinessLine(dbEditions[0].name);
  }, [dbEditions, businessLine]);

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

  // Effective data: when 'database' is the active source, build the tree
  // afresh from API sections + currently selected edition. Cheap (in the
  // tens of milliseconds) and correct on every edition switch.
  const effectiveSource = forceSource ?? menuSource;
  const navServiceData: MenuNodeData[] = useMemo(
    () => buildDbScaffold(apiSections, businessLine),
    [apiSections, businessLine],
  );
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

            {/* Refresh menu — clears nav cache + re-fetches (EPIC 19 Phase 1) */}
            <button
              onClick={handleRefreshMenu}
              disabled={isRefreshing}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
              title="Refresh menu from live registry"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

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

          {/* Business line selector — auto-derived in DB mode, fixed list in static mode */}
          <BusinessLineSelector
            value={businessLine}
            editions={effectiveSource === 'database' ? dbEditions : STATIC_EDITIONS}
            onChange={setBusinessLine}
          />

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

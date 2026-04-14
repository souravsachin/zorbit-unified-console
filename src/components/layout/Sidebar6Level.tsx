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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SidebarSearch from './SidebarSearch';
import BusinessLineSelector, { BusinessLine, BUSINESS_LINE_LABELS } from './BusinessLineSelector';
import SidebarSwitcher from './SidebarSwitcher';
import { L1Node, MenuNodeData } from './MenuNode';
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
      level: lvl,
      children: item.children ? item.children.map((c) => transform(c, lvl + 1)) : [],
    };
  }
  return items.map((item) => transform(item, level));
}

// ─── Business-line filter ─────────────────────────────────────────────
// Node IDs belonging to a given business line (id prefix matching)
const BIZ_LINE_PREFIXES: Record<BusinessLine, string[]> = {
  platform:  [],  // empty = show all
  health:    ['hi-', 'health', 'biz-health'],
  motor:     ['mi-', 'motor', 'biz-motor'],
  marine:    ['marine', 'biz-marine'],
  property:  ['property', 'biz-property'],
  life:      ['life', 'biz-life'],
  uhc:       ['uhc', 'biz-uhc'],
  provider:  ['provider', 'biz-provider'],
  tpa:       ['tpa', 'biz-tpa'],
  broker:    ['broker', 'biz-broker'],
  regulator: ['regulator', 'biz-regulator'],
  garage:    ['garage', 'biz-garage'],
};

function filterByBusinessLine(nodes: MenuNodeData[], line: BusinessLine): MenuNodeData[] {
  if (line === 'platform') return nodes;
  const prefixes = BIZ_LINE_PREFIXES[line];
  if (!prefixes || prefixes.length === 0) return nodes;

  function filterNode(node: MenuNodeData): MenuNodeData | null {
    const idLower = node.id.toLowerCase();
    const selfMatches = prefixes.some((p) => idLower.startsWith(p) || idLower.includes(p));
    const filteredChildren = node.children.map(filterNode).filter(Boolean) as MenuNodeData[];
    if (selfMatches || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  }

  return nodes.map(filterNode).filter(Boolean) as MenuNodeData[];
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
  const { user, orgId } = useAuth();

  // Dynamic menu data — starts with static fallback, replaced by nav service on mount
  const [menuData, setMenuData] = useState<MenuNodeData[]>(staticMenuData as MenuNodeData[]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    if (!orgId) return;
    navigationService
      .getMenus(orgId)
      .then((res) => {
        const items: MenuItem[] = Array.isArray(res.data) ? res.data : [];
        if (items.length > 0) {
          setMenuData(transformNavItems(items));
        }
        // If empty, keep staticMenuData — nav service has no items yet
      })
      .catch(() => {
        // Network / auth error — keep staticMenuData silently
      });
  }, [orgId]);

  // Local state
  const [filter, setFilter] = useState('');
  const [businessLine, setBusinessLine] = useState<BusinessLine>('platform');
  const [forceExpand, setForceExpand] = useState<boolean | null>(null); // null = default

  // Sidebar pin from prefs (mirrors classic sidebar behavior)
  const sidebar = prefs.ui?.sidebar;
  const pinned = sidebar?.pinned ?? true;

  const togglePin = useCallback(() => {
    updatePrefs({
      ui: {
        ...prefs.ui,
        sidebar: { ...sidebar, pinned: !pinned },
      },
    });
  }, [pinned, prefs.ui, sidebar, updatePrefs]);

  // Width: match classic sidebar's 240px
  const widthPx = 280; // slightly wider for 6-level

  // Filter menu data
  const filteredData = useMemo(() => {
    const byLine = filterByBusinessLine(menuData, businessLine);
    return byLine;
  }, [menuData, businessLine]);

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
        style={{ width: open ? widthPx : 0 }}
        className={`
          ${isOverlay ? 'fixed top-0 left-0 z-50' : 'relative z-0'}
          h-full bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/60
          flex flex-col
          transition-[width] duration-300 ease-in-out
          overflow-hidden
          shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_8px_-2px_rgba(0,0,0,0.3)]
        `}
      >
        <div className="flex flex-col h-full" style={{ width: widthPx, minWidth: widthPx }}>

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
            <button
              onClick={togglePin}
              className={`p-1 rounded transition-colors ${
                pinned
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-400'
              }`}
              title={pinned ? 'Unlock sidebar (drawer mode)' : 'Lock sidebar open'}
            >
              {pinned ? <Lock size={13} /> : <Unlock size={13} />}
            </button>

            <div className="flex-1" />

            {/* Stat badge */}
            <span className="text-[9px] text-gray-400 dark:text-gray-600 mr-1.5">
              {totalItems} items
            </span>

            <button
              onClick={() => setForceExpand(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400"
              title="Collapse all"
            >
              <ChevronsUp size={14} />
            </button>
            <button
              onClick={() => setForceExpand(true)}
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
            {filteredData.map((node, idx) => (
              <L1Node
                key={node.id}
                node={node as MenuNodeData}
                nodeIndex={idx}
                filter={filter}
                onNavigate={handleNavigate}
              />
            ))}

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

          {/* Footer legend */}
          <div className="border-t border-gray-100 dark:border-gray-800 shrink-0 px-3 py-1.5">
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'L1', bg: '#dbeafe', text: '#1d4ed8' },
                { label: 'L2', bg: '#dcfce7', text: '#15803d' },
                { label: 'L3', bg: '#ccfbf1', text: '#0f766e' },
                { label: 'L4', bg: '#fef3c7', text: '#b45309' },
                { label: 'L5', bg: '#f3e8ff', text: '#6d28d9' },
                { label: 'L6', bg: '#fce7f3', text: '#be185d' },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="text-[8.5px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: tag.bg, color: tag.text }}
                >
                  {tag.label}
                </span>
              ))}
              <span className="text-[9px] text-gray-400 dark:text-gray-600 ml-1">
                {businessLine !== 'platform' ? BUSINESS_LINE_LABELS[businessLine] : 'All lines'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar6Level;

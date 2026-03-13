import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Unlock,
  Database,
  FileJson,
  Loader2,
  AlertCircle,
  RefreshCw,
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  UserCircle,
  ScrollText,
  Mail,
  Navigation,
  KeyRound,
  FileText,
  Settings,
  SlidersHorizontal,
  Play,
  Eye,
  Layers,
  Server,
  Gauge,
  Box,
  Briefcase,
  Paintbrush,
  List,
  Route,
  MessageSquare,
  ReceiptText,
  History,
  ShieldAlert,
  Wrench,
  KeySquare,
  CreditCard,
  LayoutGrid,
  PenLine,
  ClipboardList,
  Calculator,
  Scale,
  FormInput,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMenu } from './useMenu';
import { MenuSource } from './menuApi';

// Map Material Design icon names (from navigation service) to lucide-react components
const ICON_MAP: Record<string, LucideIcon> = {
  // Section icons
  dashboard: LayoutDashboard,
  person: UserCircle,
  security: Shield,
  menu: Navigation,
  email: Mail,
  fact_check: ScrollText,
  enhanced_encryption: ShieldAlert,
  settings: Settings,
  admin_panel_settings: SlidersHorizontal,
  inventory_2: Box,

  // Dashboard items
  visibility: Eye,
  design_services: Paintbrush,

  // Identity items
  people: Users,
  business: Building2,

  // Authorization items
  verified_user: ShieldCheck,

  // Navigation items
  list: List,
  route: Route,

  // Messaging items
  topic: MessageSquare,
  receipt_long: ReceiptText,

  // Audit items
  history: History,

  // PII Vault items
  vpn_key: KeyRound,

  // Settings items
  tune: Wrench,
  lock: KeySquare,

  // Admin items
  hub: Server,
  card_membership: CreditCard,

  // Products items
  category: LayoutGrid,
  edit_note: PenLine,
  assignment: ClipboardList,
  calculate: Calculator,
  rule: Scale,
  dynamic_form: FormInput,

  // Legacy/alias names (backwards compat with older menu data)
  users: Users,
  building: Building2,
  organizations: Building2,
  shield: Shield,
  authorization: Shield,
  customers: UserCircle,
  article: ScrollText,
  audit: ScrollText,
  mail: Mail,
  messaging: Mail,
  navigation: Navigation,
  pii: ShieldAlert,
  description: FileText,
  docs: FileText,
  play_arrow: Play,
  demo: Play,
  layers: Layers,
  server: Server,
  gauge: Gauge,
  inventory: Box,
  products: Box,
  work: Briefcase,
};

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || LayoutDashboard;
}

// Layout constants — icons centered in the compact column (60px)
// Icon column: 20px left pad + 18px icon = icon center at ~29px
// Text starts at 64px — fully hidden when aside is 60px wide
const ICON_LEFT_PAD = 'pl-5'; // 20px — centers 18px icon in 60px strip
const TEXT_LEFT_GAP = 'ml-7'; // 28px — pushes text start past 60px

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
  isOverlay: boolean;
  prefs: import('../../services/preferences').UserPreferences;
  updatePrefs: (partial: Partial<import('../../services/preferences').UserPreferences>) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ open, onClose, isOverlay, prefs, updatePrefs }) => {
  const { user, orgId } = useAuth();
  const location = useLocation();
  const {
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
    widthPx,
    isCompact,
    toggleCompact,
    setMenuSource,
    reload,
  } = useMenu(user?.id, orgId, { prefs, updatePrefs });

  const [showSourceToggle, setShowSourceToggle] = useState(false);

  const isRouteActive = (route: string) => {
    if (!route) return false;
    const normalizedRoute = route.replace(/\/$/, '') || '/';
    const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
    return normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + '/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Backdrop for overlay mode */}
      {isOverlay && open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar — width animates, content inside is always 240px and gets cropped */}
      <aside
        style={{ width: open ? widthPx : 0 }}
        className={`
          ${isOverlay ? 'fixed top-0 left-0 z-50' : 'relative z-0'}
          h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col
          transition-[width] duration-300 ease-in-out
          ${isOverlay && !open ? '-translate-x-full' : 'translate-x-0'}
          overflow-hidden
        `}
      >
        {/* Inner container — always 240px wide, never changes. The aside crops it. */}
        <div className="flex flex-col h-full" style={{ width: 240, minWidth: 240 }}>

          {/* Header: Logo */}
          <div className={`flex items-center h-14 ${ICON_LEFT_PAD} border-b border-gray-200 dark:border-gray-700 shrink-0`}>
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">Z</span>
            </div>
            <span className={`font-bold text-lg ${TEXT_LEFT_GAP} whitespace-nowrap`}>Zorbit</span>
          </div>

          {/* User profile */}
          {user && (
            <div className={`py-2.5 ${ICON_LEFT_PAD} pr-3 border-b border-gray-200 dark:border-gray-700 shrink-0`}>
              <div className="flex items-center">
                <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {getInitials(user.displayName || user.email)}
                </div>
                <div className={`min-w-0 flex-1 ${TEXT_LEFT_GAP}`}>
                  <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded">
                      admin
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">{orgId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar — drawer toggle + lock first (visible in compact), gap, then expand/collapse */}
          <div className="flex items-center px-2 py-1.5 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
            <button
              onClick={toggleCompact}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={isCompact ? 'Expand sidebar' : 'Collapse to icons'}
            >
              {isCompact ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
            <button
              onClick={togglePin}
              className={`p-1 rounded transition-colors ${
                pinned
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
              }`}
              title={pinned ? 'Unlock sidebar (drawer mode)' : 'Lock sidebar open'}
            >
              {pinned ? <Lock size={13} /> : <Unlock size={13} />}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            <button
              onClick={collapseAll}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Collapse all sections"
            >
              <ChevronsUp size={14} />
            </button>
            <button
              onClick={expandAll}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Expand all sections"
            >
              <ChevronsDown size={14} />
            </button>
          </div>

          {/* Menu sections */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
            {loading && sections.length === 0 && (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="ml-2 text-sm">Loading menu...</span>
              </div>
            )}

            {error && sections.length === 0 && (
              <div className="px-3 py-4">
                <div className="flex items-center text-red-500 text-sm mb-2">
                  <AlertCircle size={16} className="mr-1.5 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
                <button
                  onClick={reload}
                  className="flex items-center text-xs text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry
                </button>
              </div>
            )}

            {sections.map((section, idx) => {
              const SectionIcon = getIcon(section.icon);
              const collapsed = isSectionCollapsed(section.id);
              const hasActiveItem = section.items.some((item) => isRouteActive(item.route));

              return (
                <div key={section.id}>
                  {/* Section separator */}
                  {idx > 0 && (
                    <div className="mx-3 my-1.5 border-t border-gray-100 dark:border-gray-700/40" />
                  )}
                  {/* Section header — icon at fixed left, text beyond 60px crop line */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`
                      w-full flex items-center ${ICON_LEFT_PAD} pr-3 py-2
                      text-xs font-semibold uppercase tracking-wider
                      ${hasActiveItem
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500'}
                      hover:text-gray-600 dark:hover:text-gray-300 transition-colors
                    `}
                    title={section.label}
                  >
                    <SectionIcon size={16} className="shrink-0" />
                    <span className={`${TEXT_LEFT_GAP} truncate whitespace-nowrap flex-1 text-left`}>{section.label}</span>
                    {collapsed ? <ChevronRight size={14} className="shrink-0 ml-1" /> : <ChevronDown size={14} className="shrink-0 ml-1" />}
                  </button>

                  {/* Section items */}
                  {!collapsed && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const ItemIcon = getIcon(item.icon);
                        const active = isRouteActive(item.route);

                        return (
                          <NavLink
                            key={item.id}
                            to={item.route}
                            onClick={() => {
                              if (isOverlay) onClose();
                            }}
                            title={item.label}
                            className={`
                              flex items-center ${ICON_LEFT_PAD} pr-3 py-2 text-sm
                              ${active
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'}
                            `}
                          >
                            <ItemIcon size={18} className="shrink-0" />
                            <span className={`${TEXT_LEFT_GAP} truncate whitespace-nowrap`}>{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom: source + version info */}
          <div className={`border-t border-gray-200 dark:border-gray-700 shrink-0 ${ICON_LEFT_PAD} pr-3 py-2`}>
            {/* Source indicator */}
            <button
              onClick={() => setShowSourceToggle(!showSourceToggle)}
              className="flex items-center text-[11px] text-gray-400 hover:text-gray-500 transition-colors"
            >
              {menuSource === 'database' ? <Database size={12} className="shrink-0" /> : <FileJson size={12} className="shrink-0" />}
              <span className={`${TEXT_LEFT_GAP} whitespace-nowrap`}>{menuSource}</span>
            </button>
            {showSourceToggle && (
              <div className="mt-1 ml-0 flex space-x-1" style={{ paddingLeft: 46 }}>
                <SourceButton
                  label="DB"
                  active={menuSource === 'database'}
                  onClick={() => { setMenuSource('database'); setShowSourceToggle(false); }}
                />
                <SourceButton
                  label="Static"
                  active={menuSource === 'static'}
                  onClick={() => { setMenuSource('static'); setShowSourceToggle(false); }}
                />
              </div>
            )}
            {/* Version info */}
            <div className="flex items-center mt-1 text-[10px] text-gray-300 dark:text-gray-600">
              <span className="shrink-0 w-[18px] text-center">v</span>
              <span className={`${TEXT_LEFT_GAP} whitespace-nowrap`}>
                {__APP_VERSION__} &middot; {__BUILD_DATE__} &middot; {__GIT_SHA__}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

function SourceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-0.5 text-[10px] rounded transition-colors
        ${active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-medium'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}
      `}
    >
      {label}
    </button>
  );
}

export default HamburgerMenu;

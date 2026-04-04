import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Info,
  Library,
  GitCompare,
  Rocket,
  Banknote,
  HelpCircle,
  LifeBuoy,
  Upload,
  Fingerprint,
  Compass,
  Radio,
  LockKeyhole,
  Cpu,
  Boxes,
  EyeOff,
  UsersRound,
  Headset,
  HeartPulse,
  Car,
  FileWarning,
  Wallet,
  BarChart3,
  Zap,
  Stethoscope,
  ClipboardCheck,
  Receipt,
  Contact,
  Package,
  FileCheck,
  Gavel,
  Activity,
  Clock,
  Sparkles,
  Plug,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMenu } from './useMenu';
import { MenuSource } from './menuApi';

// ─── Section accent colors ───────────────────────────────────────────
// Each section gets a unique accent color for its header border, icons, and active state.
// Keyed by lowercase section label.
const SECTION_COLORS: Record<string, { light: string; dark: string; border: string; bg: string; darkBg: string }> = {
  dashboard:          { light: '#3b82f6', dark: '#60a5fa', border: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  darkBg: 'rgba(59,130,246,0.15)' },
  identity:           { light: '#10b981', dark: '#34d399', border: '#10b981', bg: 'rgba(16,185,129,0.08)', darkBg: 'rgba(16,185,129,0.15)' },
  authorization:      { light: '#f59e0b', dark: '#fbbf24', border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', darkBg: 'rgba(245,158,11,0.15)' },
  navigation:         { light: '#8b5cf6', dark: '#a78bfa', border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', darkBg: 'rgba(139,92,246,0.15)' },
  messaging:          { light: '#06b6d4', dark: '#22d3ee', border: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  darkBg: 'rgba(6,182,212,0.15)' },
  audit:              { light: '#f97316', dark: '#fb923c', border: '#f97316', bg: 'rgba(249,115,22,0.08)', darkBg: 'rgba(249,115,22,0.15)' },
  'pii vault':        { light: '#ef4444', dark: '#f87171', border: '#ef4444', bg: 'rgba(239,68,68,0.08)',  darkBg: 'rgba(239,68,68,0.15)' },
  settings:           { light: '#6b7280', dark: '#9ca3af', border: '#6b7280', bg: 'rgba(107,114,128,0.08)',darkBg: 'rgba(107,114,128,0.15)' },
  admin:              { light: '#475569', dark: '#94a3b8', border: '#475569', bg: 'rgba(71,85,105,0.08)',  darkBg: 'rgba(71,85,105,0.15)' },
  products:           { light: '#14b8a6', dark: '#2dd4bf', border: '#14b8a6', bg: 'rgba(20,184,166,0.08)', darkBg: 'rgba(20,184,166,0.15)' },
  'form builder':     { light: '#6366f1', dark: '#818cf8', border: '#6366f1', bg: 'rgba(99,102,241,0.08)', darkBg: 'rgba(99,102,241,0.15)' },
  'pii showcase':     { light: '#f43f5e', dark: '#fb7185', border: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  darkBg: 'rgba(244,63,94,0.15)' },
  directory:          { light: '#0ea5e9', dark: '#38bdf8', border: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', darkBg: 'rgba(14,165,233,0.15)' },
  'support center':   { light: '#a855f7', dark: '#c084fc', border: '#a855f7', bg: 'rgba(168,85,247,0.08)',darkBg: 'rgba(168,85,247,0.15)' },
  'hi quotation':      { light: '#22c55e', dark: '#4ade80', border: '#22c55e', bg: 'rgba(34,197,94,0.08)',  darkBg: 'rgba(34,197,94,0.15)' },
  'uw workflow':       { light: '#f97316', dark: '#fb923c', border: '#f97316', bg: 'rgba(249,115,22,0.08)', darkBg: 'rgba(249,115,22,0.15)' },
  'hi decisioning':    { light: '#8b5cf6', dark: '#a78bfa', border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', darkBg: 'rgba(139,92,246,0.15)' },
  'motor insurance':   { light: '#3b82f6', dark: '#60a5fa', border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', darkBg: 'rgba(59,130,246,0.15)' },
  'mi quotation':      { light: '#3b82f6', dark: '#60a5fa', border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', darkBg: 'rgba(59,130,246,0.15)' },
  claims:             { light: '#ef4444', dark: '#f87171', border: '#ef4444', bg: 'rgba(239,68,68,0.08)',  darkBg: 'rgba(239,68,68,0.15)' },
  fees:               { light: '#f59e0b', dark: '#fbbf24', border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', darkBg: 'rgba(245,158,11,0.15)' },
  'product pricing':  { light: '#0d9488', dark: '#2dd4bf', border: '#0d9488', bg: 'rgba(13,148,136,0.08)', darkBg: 'rgba(13,148,136,0.15)' },
  'voice engine':     { light: '#ec4899', dark: '#f472b6', border: '#ec4899', bg: 'rgba(236,72,153,0.08)', darkBg: 'rgba(236,72,153,0.15)' },
  'jayna ai':         { light: '#7c3aed', dark: '#a78bfa', border: '#7c3aed', bg: 'rgba(124,58,237,0.08)', darkBg: 'rgba(124,58,237,0.15)' },
  endorsements:       { light: '#d946ef', dark: '#e879f9', border: '#d946ef', bg: 'rgba(217,70,239,0.08)', darkBg: 'rgba(217,70,239,0.15)' },
  renewals:           { light: '#0891b2', dark: '#22d3ee', border: '#0891b2', bg: 'rgba(8,145,178,0.08)',  darkBg: 'rgba(8,145,178,0.15)' },
  'sme corporate':    { light: '#7c3aed', dark: '#a78bfa', border: '#7c3aed', bg: 'rgba(124,58,237,0.08)', darkBg: 'rgba(124,58,237,0.15)' },
  reinsurance:        { light: '#be185d', dark: '#f472b6', border: '#be185d', bg: 'rgba(190,24,93,0.08)',  darkBg: 'rgba(190,24,93,0.15)' },
  'claims tpa':       { light: '#dc2626', dark: '#f87171', border: '#dc2626', bg: 'rgba(220,38,38,0.08)',  darkBg: 'rgba(220,38,38,0.15)' },
  'medical coding':   { light: '#059669', dark: '#34d399', border: '#059669', bg: 'rgba(5,150,105,0.08)',  darkBg: 'rgba(5,150,105,0.15)' },
  'maf engine':       { light: '#4f46e5', dark: '#818cf8', border: '#4f46e5', bg: 'rgba(79,70,229,0.08)',  darkBg: 'rgba(79,70,229,0.15)' },
  'rpa integration':  { light: '#ca8a04', dark: '#facc15', border: '#ca8a04', bg: 'rgba(202,138,4,0.08)',  darkBg: 'rgba(202,138,4,0.15)' },
  'api integration':  { light: '#0284c7', dark: '#38bdf8', border: '#0284c7', bg: 'rgba(2,132,199,0.08)',  darkBg: 'rgba(2,132,199,0.15)' },
  reporting:          { light: '#9333ea', dark: '#c084fc', border: '#9333ea', bg: 'rgba(147,51,234,0.08)', darkBg: 'rgba(147,51,234,0.15)' },
  'policy issuance':  { light: '#16a34a', dark: '#4ade80', border: '#16a34a', bg: 'rgba(22,163,74,0.08)',  darkBg: 'rgba(22,163,74,0.15)' },
  'document management': { light: '#b45309', dark: '#fbbf24', border: '#b45309', bg: 'rgba(180,83,9,0.08)', darkBg: 'rgba(180,83,9,0.15)' },
};

const DEFAULT_COLOR = { light: '#6b7280', dark: '#9ca3af', border: '#6b7280', bg: 'rgba(107,114,128,0.08)', darkBg: 'rgba(107,114,128,0.15)' };

function getSectionColor(label: string) {
  return SECTION_COLORS[label.toLowerCase()] || DEFAULT_COLOR;
}

// ─── Icon map ────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  // Section icons — distinctive per domain
  dashboard: BarChart3,
  person: Fingerprint,
  security: ShieldCheck,
  menu: Compass,
  email: Radio,
  fact_check: ScrollText,
  enhanced_encryption: LockKeyhole,
  settings: SlidersHorizontal,
  admin_panel_settings: Cpu,
  inventory_2: Boxes,

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
  topic: Zap,
  receipt_long: ReceiptText,

  // Audit items
  history: History,

  // PII Vault items
  vpn_key: LockKeyhole,

  // Settings items
  tune: Wrench,
  lock: KeySquare,
  'shield-check': ShieldCheck,

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

  // PCG4 / app menu icons
  info: Info,
  library_books: Library,
  compare: GitCompare,
  rocket_launch: Rocket,
  payments: Banknote,
  help: HelpCircle,
  life_buoy: LifeBuoy,
  support: Headset,
  upload: Upload,

  // Extended domain icons
  fingerprint: Fingerprint,
  compass: Compass,
  radio: Radio,
  lock_keyhole: LockKeyhole,
  eye_off: EyeOff,
  users_round: UsersRound,
  headset: Headset,
  heart_pulse: HeartPulse,
  stethoscope: Stethoscope,
  car: Car,
  file_warning: FileWarning,
  wallet: Wallet,
  clipboard_check: ClipboardCheck,
  receipt: Receipt,
  contact: Contact,
  package: Package,
  file_check: FileCheck,
  gavel: Gavel,
  activity: Activity,

  // Form Builder items
  form_input: FormInput,
  form_templates: ClipboardList,
  form_submissions: ClipboardCheck,
  form_create: PenLine,

  // Insurance / UW workflow icons
  health_insurance: HeartPulse,
  motor_insurance: Car,
  add_circle: PenLine,
  assignment_ind: UserCircle,
  check_circle: FileCheck,
  data_object: Box,
  fiber_new: Zap,
  help_outline: HelpCircle,
  list_alt: List,
  menu_book: Library,
  payment: CreditCard,
  pending: Clock,
  question_answer: MessageSquare,
  quiz: HelpCircle,
  speed: Activity,
  table_chart: BarChart3,
  thumb_down: ShieldAlert,
  thumb_up: FileCheck,
  verified: FileCheck,

  // Voice Engine / Jayna icons
  sparkles: Sparkles,
  'play': Play,

  // MUW-52 ported module icons
  pen_line: PenLine,
  refresh_cw: RefreshCw,
  building2: Building2,
  plug: Plug,
  folder_open: FolderOpen,
  cpu: Cpu,
  bar_chart: BarChart3,

  // Legacy/alias names
  users: Users,
  building: Building2,
  organizations: Building2,
  shield: Shield,
  authorization: Shield,
  customers: UserCircle,
  article: ScrollText,
  audit: ScrollText,
  mail: Mail,
  messaging: Radio,
  navigation: Compass,
  pii: LockKeyhole,
  description: FileText,
  docs: FileText,
  play_arrow: Play,
  demo: Play,
  layers: Layers,
  server: Server,
  gauge: Gauge,
  inventory: Box,
  products: Boxes,
  work: Briefcase,
};

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || LayoutDashboard;
}

/** Map section labels for display — allows renaming without DB changes */
const SECTION_LABEL_MAP: Record<string, string> = {
  'Retail Insurance': 'Health Insurance \u2014 Retail',
};

/** Map section icon overrides by label — ensures distinctive icons */
const SECTION_ICON_OVERRIDE: Record<string, LucideIcon> = {
  'Retail Insurance': HeartPulse,
  'Health Insurance \u2014 Retail': HeartPulse,
  'Motor Insurance': Car,
  'Form Builder': FormInput,
  'Products': Boxes,
  'Claims': FileWarning,
  'Fees': Wallet,
  'Directory': Contact,
  'Support Center': Headset,
  'PII Showcase': EyeOff,
};

function getSectionLabel(label: string): string {
  return SECTION_LABEL_MAP[label] || label;
}

function getSectionIcon(label: string, iconName: string): LucideIcon {
  return SECTION_ICON_OVERRIDE[label] || ICON_MAP[iconName] || LayoutDashboard;
}

// Layout constants — icons centered in the compact column (60px)
const ICON_LEFT_PAD = 'pl-5';
const TEXT_LEFT_GAP = 'ml-7';

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

  // Detect dark mode for inline styles
  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  }, []);

  const stripOrgPrefix = (path: string) => path.replace(/^\/(O|org)\/[^/]+/, '');

  const isRouteActive = (route: string) => {
    if (!route) return false;
    const r = stripOrgPrefix(route).replace(/\/$/, '') || '/';
    const p = stripOrgPrefix(location.pathname).replace(/\/$/, '') || '/';
    // Exact match — prevents overlapping highlights
    // (e.g. /dashboard matching both "View Dashboard" and "Dashboard Designer")
    return p === r || p === r + '/';
  };

  /** Loose match for section-level highlighting (section stays accented when any child page is open) */
  const isRouteBelongsToSection = (route: string) => {
    if (!route) return false;
    const r = stripOrgPrefix(route).replace(/\/$/, '') || '/';
    const p = stripOrgPrefix(location.pathname).replace(/\/$/, '') || '/';
    return p === r || p.startsWith(r + '/');
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

      {/* Sidebar */}
      <aside
        style={{ width: open ? widthPx : 0 }}
        className={`
          ${isOverlay ? 'fixed top-0 left-0 z-50' : 'relative z-0'}
          h-full bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/60
          flex flex-col
          transition-[width] duration-300 ease-in-out
          ${isOverlay && !open ? '-translate-x-full' : 'translate-x-0'}
          overflow-hidden
          shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_8px_-2px_rgba(0,0,0,0.3)]
        `}
      >
        <div className="flex flex-col h-full" style={{ width: 240, minWidth: 240 }}>

          {/* Header: Logo */}
          <div className={`flex items-center h-14 ${ICON_LEFT_PAD} border-b border-gray-100 dark:border-gray-800 shrink-0`}>
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-xs">Z</span>
            </div>
            <span className={`font-bold text-lg ${TEXT_LEFT_GAP} whitespace-nowrap bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300`}>Zorbit</span>
          </div>

          {/* User profile */}
          {user && (
            <div className={`py-2.5 ${ICON_LEFT_PAD} pr-3 border-b border-gray-100 dark:border-gray-800 shrink-0`}>
              <div className="flex items-center">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 shadow-sm">
                  {getInitials(user.displayName || user.email)}
                </div>
                <div className={`min-w-0 flex-1 ${TEXT_LEFT_GAP}`}>
                  <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{user.displayName || user.email}</p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded">
                      admin
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{orgId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center px-2 py-1.5 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
            <button
              onClick={toggleCompact}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400"
              title={isCompact ? 'Expand sidebar' : 'Collapse to icons'}
            >
              {isCompact ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
            <button
              onClick={togglePin}
              className={`p-1 rounded transition-colors ${
                pinned
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-400'
              }`}
              title={pinned ? 'Unlock sidebar (drawer mode)' : 'Lock sidebar open'}
            >
              {pinned ? <Lock size={13} /> : <Unlock size={13} />}
            </button>

            <div className="flex-1" />

            <button
              onClick={collapseAll}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400"
              title="Collapse all sections"
            >
              <ChevronsUp size={14} />
            </button>
            <button
              onClick={expandAll}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded transition-colors text-gray-500 dark:text-gray-400"
              title="Expand all sections"
            >
              <ChevronsDown size={14} />
            </button>
          </div>

          {/* Menu sections */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
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
              const displayLabel = getSectionLabel(section.label);
              const SectionIcon = getSectionIcon(section.label, section.icon);
              const collapsed = isSectionCollapsed(section.id);
              const hasActiveItem = section.items.some((item) => isRouteBelongsToSection(item.route));
              const color = getSectionColor(displayLabel);
              const accentColor = isDark ? color.dark : color.light;

              return (
                <div key={section.id}>
                  {/* Section separator — colored line visible in both compact and expanded */}
                  {idx > 0 && (
                    <div className="mx-3 my-2">
                      <div className="h-px rounded-full" style={{ backgroundColor: color.border, opacity: 0.25 }} />
                    </div>
                  )}

                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`
                      w-full flex items-center pr-3 py-2 group
                      text-[11px] font-bold uppercase tracking-widest
                      transition-all duration-200
                    `}
                    style={{
                      paddingLeft: 20,
                      borderLeft: `3px solid ${color.border}`,
                      color: hasActiveItem ? accentColor : (isDark ? '#9ca3af' : '#6b7280'),
                    }}
                    title={displayLabel}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = accentColor;
                    }}
                    onMouseLeave={(e) => {
                      if (!hasActiveItem) {
                        (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#9ca3af' : '#6b7280';
                      }
                    }}
                  >
                    <SectionIcon
                      size={16}
                      className="shrink-0 transition-colors duration-200"
                      style={{ color: accentColor }}
                    />
                    <span className={`${TEXT_LEFT_GAP} truncate whitespace-nowrap flex-1 text-left`}>
                      {displayLabel}
                    </span>
                    {collapsed
                      ? <ChevronRight size={14} className="shrink-0 ml-1 opacity-50" />
                      : <ChevronDown size={14} className="shrink-0 ml-1 opacity-50" />}
                  </button>

                  {/* Section items */}
                  {!collapsed && (
                    <div
                      className="space-y-px pb-0.5"
                      style={{
                        transition: 'max-height 0.25s ease-in-out',
                      }}
                    >
                      {section.items.map((item) => {
                        const ItemIcon = getIcon(item.icon);
                        const active = isRouteActive(item.route);

                        return (
                          <Link
                            key={item.id}
                            to={stripOrgPrefix(item.route)}
                            onClick={() => {
                              if (isOverlay) onClose();
                            }}
                            title={item.label}
                            className={`
                              flex items-center pr-3 py-[7px] text-[13px] group/item
                              transition-all duration-150
                              ${active
                                ? 'font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}
                            `}
                            style={{
                              paddingLeft: 24,
                              borderLeft: active ? `3px solid ${color.border}` : '3px solid transparent',
                              backgroundColor: active
                                ? (isDark ? color.darkBg : color.bg)
                                : undefined,
                              color: active ? accentColor : undefined,
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                                  isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
                              }
                            }}
                          >
                            <ItemIcon
                              size={16}
                              className="shrink-0 transition-colors duration-150"
                              style={{
                                color: active ? accentColor : (isDark ? '#6b7280' : '#9ca3af'),
                              }}
                            />
                            <span className={`${TEXT_LEFT_GAP} truncate whitespace-nowrap`}>
                              {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom: source + version info */}
          <div className={`border-t border-gray-100 dark:border-gray-800 shrink-0 ${ICON_LEFT_PAD} pr-3 py-2`}>
            <button
              onClick={() => setShowSourceToggle(!showSourceToggle)}
              className="flex items-center text-[11px] text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              {menuSource === 'database'
                ? <Database size={11} className="shrink-0 opacity-50" />
                : <FileJson size={11} className="shrink-0 opacity-50" />}
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
            <div className="flex items-center mt-1.5 text-[10px] text-gray-300 dark:text-gray-600">
              <span className="shrink-0 w-[18px] text-center opacity-50">v</span>
              <span className={`${TEXT_LEFT_GAP} whitespace-nowrap font-mono tracking-tight`}>
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

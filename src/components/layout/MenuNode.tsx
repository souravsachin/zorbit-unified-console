import React, { useState, useMemo, useContext, useEffect, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ─── Force-expand context ─────────────────────────────────────────────
// Broadcasted from Sidebar6Level toolbar buttons to all nodes.
// seq increments each click so useEffect fires even if expand direction repeats.
export interface ForceExpandSignal { seq: number; expand: boolean }
export const ForceExpandContext = createContext<ForceExpandSignal | null>(null);
import {
  ChevronRight, ChevronDown,
  Server, Fingerprint, ShieldCheck, Navigation, Radio,
  ClipboardCheck, Lock, KeyRound, BookOpen, Info,
  Presentation, RefreshCw, Video, FileText, DollarSign,
  Settings, Rocket, Users, Contact, Building2, Shield, Key,
  Menu, Route, List, Activity, ScrollText, Hash,
  Layers, Globe, Cpu, Database, FileEdit, Package,
  Table2, Gauge, BarChart3, Code2, Play, GraduationCap,
  HeartPulse, Car, FileWarning, Wallet, ClipboardList,
  Calculator, Scale, FormInput, Zap, Sparkles, Headset,
  Mic, Brain, Network, GitCompare, CreditCard, ReceiptText,
  LayoutDashboard, Box, Briefcase, Paintbrush, PenLine,
  HelpCircle, Upload, Compass, LockKeyhole, EyeOff,
  UsersRound, Stethoscope, FileCheck, Gavel, Clock,
  Plug, FolderOpen, LayoutGrid, MessageSquare, Eye, Boxes,
  BotMessageSquare, UserCircle, Mail, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

// ─── Icon registry ────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Server, Fingerprint, ShieldCheck, Navigation, Radio,
  ClipboardCheck, Lock, KeyRound, BookOpen, Info,
  Presentation, RefreshCw, Video, FileText, DollarSign,
  Settings, Rocket, Users, Contact, Building2, Shield, Key,
  Menu, Route, List, Activity, ScrollText, Hash,
  Layers, Globe, Cpu, Database, FileEdit, Package,
  Table2, Gauge, BarChart3, Code2, Play, GraduationCap,
  HeartPulse, Car, FileWarning, Wallet, ClipboardList,
  Calculator, Scale, FormInput, Zap, Sparkles, Headset,
  Mic, Brain, Network, GitCompare, CreditCard, ReceiptText,
  LayoutDashboard, Box, Briefcase, Paintbrush, PenLine,
  HelpCircle, Upload, Compass, LockKeyhole, EyeOff,
  UsersRound, Stethoscope, FileCheck, Gavel, Clock,
  Plug, FolderOpen, LayoutGrid, MessageSquare, Eye, Boxes,
  BotMessageSquare, UserCircle, Mail, SlidersHorizontal,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || LayoutDashboard;
}

// ─── Level colors ─────────────────────────────────────────────────────
// L1 section border/accent colors — indexed by position
const L1_COLORS = [
  { color: 'indigo',  hex: '#6366f1' },
  { color: 'blue',    hex: '#3b82f6' },
  { color: 'green',   hex: '#22c55e' },
  { color: 'purple',  hex: '#8b5cf6' },
  { color: 'teal',    hex: '#14b8a6' },
  { color: 'orange',  hex: '#f97316' },
  { color: 'red',     hex: '#ef4444' },
  { color: 'gray',    hex: '#6b7280' },
];

// L2 connecting-line colors (brighter variants)
const L2_LINE_COLORS = [
  '#93c5fd', '#86efac', '#fdba74', '#c4b5fd',
  '#99f6e4', '#fcd34d', '#a5b4fc', '#fca5a5',
];

// L3 connecting-line colors (softer variants)
const L3_LINE_COLORS = [
  '#99f6e4', '#fda4af', '#7dd3fc', '#fcd34d',
  '#c4b5fd', '#6ee7b7', '#93c5fd', '#fdba74',
];

// L2 header colors (text + border)
const L2_COLORS = [
  { border: '#3b82f6', text: '#1d4ed8' },
  { border: '#22c55e', text: '#15803d' },
  { border: '#f97316', text: '#c2410c' },
  { border: '#ef4444', text: '#b91c1c' },
  { border: '#8b5cf6', text: '#6d28d9' },
  { border: '#f59e0b', text: '#b45309' },
  { border: '#6366f1', text: '#4338ca' },
  { border: '#14b8a6', text: '#0f766e' },
];

// L3 header colors
const L3_COLORS = [
  { border: '#14b8a6', text: '#0f766e' },
  { border: '#f43f5e', text: '#be123c' },
  { border: '#0ea5e9', text: '#0369a1' },
  { border: '#f59e0b', text: '#b45309' },
  { border: '#8b5cf6', text: '#6d28d9' },
  { border: '#10b981', text: '#047857' },
  { border: '#3b82f6', text: '#1d4ed8' },
  { border: '#f97316', text: '#c2410c' },
  { border: '#6366f1', text: '#4338ca' },
  { border: '#ec4899', text: '#be185d' },
  { border: '#06b6d4', text: '#0e7490' },
  { border: '#22c55e', text: '#15803d' },
  { border: '#ef4444', text: '#b91c1c' },
];

function rotate<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

// ─── Default expand/collapse state ───────────────────────────────────
// L1 sections that start collapsed (all others start open)
const DEFAULT_COLLAPSED_L1 = new Set([
  'platform-core', 'platform-feature-services', 'ai-automation', 'administration',
]);
// L2 nodes that start open (all others start collapsed)
const DEFAULT_OPEN_L2 = new Set(['biz-distribution']);
// L3 nodes that start open (all others start collapsed)
const DEFAULT_OPEN_L3 = new Set(['biz-dist-product-mgmt', 'biz-dist-policy-admin']);

// ─── Node type ────────────────────────────────────────────────────────
export interface MenuNodePlacement {
  edition?: string;
  businessLine?: string;
  capabilityArea?: string;
  sortOrder?: number;
  specificTo?: string[];
}

export interface MenuNodeData {
  id: string;
  label: string;
  icon: string;
  route: string | null;
  source?: string;
  privilegeCode?: string | null;
  level: number;
  children: MenuNodeData[];
  // In database mode, each top-level node carries placement metadata from the
  // module's manifest. Static mode nodes omit this.
  placement?: MenuNodePlacement;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function highlightMatch(text: string, filter: string): React.ReactNode {
  if (!filter) return text;
  const idx = text.toLowerCase().indexOf(filter.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded-sm px-0">{text.slice(idx, idx + filter.length)}</mark>
      {text.slice(idx + filter.length)}
    </>
  );
}

function nodeMatchesFilter(node: MenuNodeData, filter: string): boolean {
  if (!filter) return true;
  const f = filter.toLowerCase();
  if (node.label.toLowerCase().includes(f)) return true;
  return node.children.some((c) => nodeMatchesFilter(c, f));
}

// ─── Strip org prefix from routes ────────────────────────────────────
function stripOrgPrefix(path: string) {
  return path.replace(/^\/(O|org)\/[^/]+/, '');
}

// ─── Level 1 node (group header like "Core Platform Services") ────────
interface L1NodeProps {
  node: MenuNodeData;
  nodeIndex: number;
  filter: string;
  onNavigate: () => void;
}

export const L1Node: React.FC<L1NodeProps> = ({ node, nodeIndex, filter, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(() => DEFAULT_COLLAPSED_L1.has(node.id));
  const forceExpand = useContext(ForceExpandContext);
  useEffect(() => {
    if (forceExpand === null) return;
    setCollapsed(!forceExpand.expand);
  }, [forceExpand?.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  const l1Color = rotate(L1_COLORS, nodeIndex);

  const visibleChildren = useMemo(
    () => (filter ? node.children.filter((c) => nodeMatchesFilter(c, filter)) : node.children),
    [node.children, filter],
  );

  if (filter && visibleChildren.length === 0) return null;

  const IconComp = getIcon(node.icon);

  return (
    <div className="mb-0.5">
      {/* L1 header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center pr-3 py-2 group transition-all"
        style={{
          paddingLeft: 12,
          borderLeft: `3px solid ${l1Color.hex}`,
        }}
      >
        <span
          className="text-[9px] font-bold uppercase tracking-wider flex-1 text-left whitespace-nowrap overflow-hidden"
          style={{ color: l1Color.hex }}
        >
          {node.label}
        </span>
        <IconComp size={11} style={{ color: l1Color.hex, opacity: 0.6 }} className="shrink-0 mr-1" />
        {collapsed
          ? <ChevronRight size={11} className="shrink-0 opacity-40" style={{ color: l1Color.hex }} />
          : <ChevronDown size={11} className="shrink-0 opacity-40" style={{ color: l1Color.hex }} />}
      </button>

      {/* L1 content */}
      {!collapsed && visibleChildren.length > 0 && (
        <div>
          {visibleChildren.map((child, ci) => (
            <L2Node
              key={child.id}
              node={child}
              nodeIndex={ci}
              filter={filter}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Level 2 node (subgroup with colored vertical line) ──────────────
interface L2NodeProps {
  node: MenuNodeData;
  nodeIndex: number;
  filter: string;
  onNavigate: () => void;
}

export const L2Node: React.FC<L2NodeProps> = ({ node, nodeIndex, filter, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(() => !DEFAULT_OPEN_L2.has(node.id));
  const forceExpand = useContext(ForceExpandContext);
  useEffect(() => {
    if (forceExpand === null) return;
    setCollapsed(!forceExpand.expand);
  }, [forceExpand?.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  const l2Color = rotate(L2_COLORS, nodeIndex);
  const lineColor = rotate(L2_LINE_COLORS, nodeIndex);
  const location = useLocation();

  const visibleChildren = useMemo(
    () => (filter ? node.children.filter((c) => nodeMatchesFilter(c, filter)) : node.children),
    [node.children, filter],
  );

  const hasChildren = visibleChildren.length > 0;
  if (filter && !node.label.toLowerCase().includes(filter.toLowerCase()) && visibleChildren.length === 0) return null;

  const IconComp = getIcon(node.icon);

  // Leaf L2 — has a route and no children
  if (!hasChildren && node.route) {
    const active = stripOrgPrefix(location.pathname) === stripOrgPrefix(node.route);
    return (
      <Link
        to={stripOrgPrefix(node.route)}
        onClick={onNavigate}
        className="flex items-center gap-1.5 px-3 py-1.5 ml-2 text-[11px] font-semibold transition-colors rounded-sm"
        style={{
          borderLeft: `2px solid ${active ? l2Color.border : 'transparent'}`,
          color: active ? l2Color.text : '#4b5563',
        }}
      >
        <IconComp size={12} style={{ color: l2Color.text, opacity: 0.7 }} />
        <span>{highlightMatch(node.label, filter)}</span>
      </Link>
    );
  }

  return (
    <div className="my-0.5">
      {/* L2 header */}
      <button
        onClick={() => hasChildren && setCollapsed((v) => !v)}
        className="w-full flex items-center gap-1.5 py-1.5 ml-2 pr-3 text-[11px] font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
        style={{
          paddingLeft: 14,
          borderLeft: `2px solid ${l2Color.border}`,
          color: l2Color.text,
        }}
      >
        <IconComp size={12} className="shrink-0" style={{ color: l2Color.text, opacity: 0.8 }} />
        <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        {node.source && (
          <span className="shrink-0 text-[8px] font-mono px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 max-w-[56px] truncate ml-1">
            {node.source.replace('zorbit-pfs-', '').replace('zorbit-app-', '').replace('zorbit-', '')}
          </span>
        )}
        {hasChildren && (
          collapsed
            ? <ChevronRight size={10} className="shrink-0 opacity-50" />
            : <ChevronDown size={10} className="shrink-0 opacity-50" />
        )}
      </button>

      {/* L2 children — with vertical line */}
      {!collapsed && hasChildren && (
        <div
          className="relative ml-4 pl-2"
          style={{ '--line-color': lineColor } as React.CSSProperties}
        >
          {/* Vertical line */}
          <div
            className="absolute left-0 top-0 bottom-2 pointer-events-none"
            style={{ width: '1.5px', background: lineColor, opacity: 0.5 }}
          />
          {visibleChildren.map((child, ci) => (
            <L3Node
              key={child.id}
              node={child}
              nodeIndex={ci}
              filter={filter}
              lineColor={lineColor}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Level 3 node ─────────────────────────────────────────────────────
interface L3NodeProps {
  node: MenuNodeData;
  nodeIndex: number;
  filter: string;
  lineColor: string;
  onNavigate: () => void;
}

export const L3Node: React.FC<L3NodeProps> = ({ node, nodeIndex, filter, lineColor, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(() => !DEFAULT_OPEN_L3.has(node.id));
  const forceExpand = useContext(ForceExpandContext);
  useEffect(() => {
    if (forceExpand === null) return;
    setCollapsed(!forceExpand.expand);
  }, [forceExpand?.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  const l3Color = rotate(L3_COLORS, nodeIndex);
  const l3Line = rotate(L3_LINE_COLORS, nodeIndex);
  const location = useLocation();

  const visibleChildren = useMemo(
    () => (filter ? node.children.filter((c) => nodeMatchesFilter(c, filter)) : node.children),
    [node.children, filter],
  );

  const hasChildren = visibleChildren.length > 0;
  if (filter) {
    const selfMatches = node.label.toLowerCase().includes(filter.toLowerCase());
    if (!selfMatches && visibleChildren.length === 0) return null;
  }

  // Auto-expand when filtering
  const effectiveCollapsed = filter ? false : collapsed;
  const IconComp = getIcon(node.icon);

  // Leaf L3 — route, no children
  if (!hasChildren && node.route) {
    const path = stripOrgPrefix(node.route);
    const active = stripOrgPrefix(location.pathname) === path;
    return (
      <div className="relative">
        {/* Horizontal branch line */}
        <div
          className="absolute pointer-events-none"
          style={{ left: -8, top: 14, width: 8, height: '1.5px', background: lineColor, opacity: 0.5 }}
        />
        <Link
          to={path}
          onClick={onNavigate}
          className="flex items-center gap-1.5 py-1.5 pr-3 text-[11px] font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm"
          style={{
            paddingLeft: 12,
            borderLeft: `2px solid ${active ? l3Color.border : 'transparent'}`,
            color: active ? l3Color.text : '#4b5563',
          }}
        >
          <IconComp size={11} style={{ color: l3Color.text, opacity: 0.7 }} className="shrink-0" />
          <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Horizontal branch line */}
      <div
        className="absolute pointer-events-none"
        style={{ left: -8, top: 14, width: 8, height: '1.5px', background: lineColor, opacity: 0.5 }}
      />

      {/* L3 header */}
      <button
        onClick={() => hasChildren && setCollapsed((v) => !v)}
        className="w-full flex items-center gap-1.5 py-1.5 pr-3 text-[11px] font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm"
        style={{
          paddingLeft: 12,
          borderLeft: `2px solid ${l3Color.border}`,
          color: l3Color.text,
        }}
      >
        <IconComp size={11} style={{ color: l3Color.text, opacity: 0.8 }} className="shrink-0" />
        <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        {hasChildren && (
          effectiveCollapsed
            ? <ChevronRight size={9} className="shrink-0 opacity-50" />
            : <ChevronDown size={9} className="shrink-0 opacity-50" />
        )}
      </button>

      {/* L3 children — with inner vertical line */}
      {!effectiveCollapsed && hasChildren && (
        <div
          className="relative ml-2 pl-2.5 pb-0.5"
          style={{ '--line-color-l3': l3Line } as React.CSSProperties}
        >
          {/* L3 vertical line */}
          <div
            className="absolute pointer-events-none"
            style={{ left: 4, top: 0, bottom: 6, width: '1px', background: l3Line, opacity: 0.6 }}
          />
          {visibleChildren.map((child, ci) => (
            <L4Node
              key={child.id}
              node={child}
              nodeIndex={ci}
              filter={filter}
              lineColor={l3Line}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Level 4 node ─────────────────────────────────────────────────────
interface L4NodeProps {
  node: MenuNodeData;
  nodeIndex: number;
  filter: string;
  lineColor: string;
  onNavigate: () => void;
}

export const L4Node: React.FC<L4NodeProps> = ({ node, nodeIndex, filter, lineColor, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(true);
  const forceExpand = useContext(ForceExpandContext);
  useEffect(() => {
    if (forceExpand === null) return;
    setCollapsed(!forceExpand.expand);
  }, [forceExpand?.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  const location = useLocation();

  const visibleChildren = useMemo(
    () => (filter ? node.children.filter((c) => nodeMatchesFilter(c, filter)) : node.children),
    [node.children, filter],
  );

  const hasChildren = visibleChildren.length > 0;
  if (filter) {
    const selfMatches = node.label.toLowerCase().includes(filter.toLowerCase());
    if (!selfMatches && visibleChildren.length === 0) return null;
  }

  const effectiveCollapsed = filter ? false : collapsed;
  const IconComp = getIcon(node.icon);

  if (!hasChildren && node.route) {
    const path = stripOrgPrefix(node.route);
    const active = stripOrgPrefix(location.pathname) === path;
    return (
      <div className="relative">
        {/* Horizontal branch */}
        <div
          className="absolute pointer-events-none"
          style={{ left: -6, top: 12, width: 6, height: '1px', background: lineColor, opacity: 0.6 }}
        />
        <Link
          to={path}
          onClick={onNavigate}
          className={`
            flex items-center gap-1.5 py-1 pr-3 text-[11.5px] transition-colors
            hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm
            ${active ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-400'}
          `}
          style={{ paddingLeft: 10 }}
        >
          <IconComp size={11} className="shrink-0" style={{ opacity: active ? 1 : 0.6 }} />
          <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Horizontal branch */}
      <div
        className="absolute pointer-events-none"
        style={{ left: -6, top: 12, width: 6, height: '1px', background: lineColor, opacity: 0.6 }}
      />

      <button
        onClick={() => hasChildren && setCollapsed((v) => !v)}
        className="w-full flex items-center gap-1.5 py-1 pr-3 text-[11.5px] font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm"
        style={{ paddingLeft: 10 }}
      >
        <IconComp size={11} className="shrink-0 opacity-60" />
        <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        {hasChildren && (
          effectiveCollapsed
            ? <ChevronRight size={8} className="shrink-0 opacity-40" />
            : <ChevronDown size={8} className="shrink-0 opacity-40" />
        )}
      </button>

      {!effectiveCollapsed && hasChildren && (
        <div
          className="relative ml-2 pl-2"
          style={{ '--line-color-l4': '#e5e7eb' } as React.CSSProperties}
        >
          <div
            className="absolute pointer-events-none"
            style={{ left: 8, top: 0, bottom: 4, width: '1px', background: '#e5e7eb', opacity: 0.4 }}
          />
          {visibleChildren.map((child, ci) => (
            <L5Node
              key={child.id}
              node={child}
              nodeIndex={ci}
              filter={filter}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Level 5 node ─────────────────────────────────────────────────────
interface L5NodeProps {
  node: MenuNodeData;
  nodeIndex: number;
  filter: string;
  onNavigate: () => void;
}

export const L5Node: React.FC<L5NodeProps> = ({ node, nodeIndex, filter, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(true);
  const forceExpand = useContext(ForceExpandContext);
  useEffect(() => {
    if (forceExpand === null) return;
    setCollapsed(!forceExpand.expand);
  }, [forceExpand?.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  const location = useLocation();

  const visibleChildren = useMemo(
    () => (filter ? node.children.filter((c) => nodeMatchesFilter(c, filter)) : node.children),
    [node.children, filter],
  );

  const hasChildren = visibleChildren.length > 0;
  if (filter) {
    const selfMatches = node.label.toLowerCase().includes(filter.toLowerCase());
    if (!selfMatches && visibleChildren.length === 0) return null;
  }

  const effectiveCollapsed = filter ? false : collapsed;
  const IconComp = getIcon(node.icon);

  const path = node.route ? stripOrgPrefix(node.route) : null;
  const active = path ? stripOrgPrefix(location.pathname) === path : false;

  if (!hasChildren && path) {
    return (
      <div className="relative">
        <div
          className="absolute pointer-events-none"
          style={{ left: 2, top: '50%', width: 5, height: '1px', background: '#e5e7eb', opacity: 0.4 }}
        />
        <Link
          to={path}
          onClick={onNavigate}
          className={`
            flex items-center gap-1 py-0.5 pr-3 text-[11px] transition-all
            hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm
            ${active
              ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/60 dark:bg-indigo-900/10'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
          `}
          style={{ paddingLeft: 12 }}
        >
          <IconComp size={10} className="shrink-0" style={{ opacity: 0.6 }} />
          <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="absolute pointer-events-none"
        style={{ left: 2, top: '50%', width: 5, height: '1px', background: '#e5e7eb', opacity: 0.4 }}
      />
      <button
        onClick={() => {
          if (hasChildren) setCollapsed((v) => !v);
          else if (path) onNavigate();
        }}
        className={`
          w-full flex items-center gap-1 py-0.5 pr-3 text-[11px] font-medium transition-all
          hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm
          ${active
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
        `}
        style={{ paddingLeft: 12 }}
      >
        <IconComp size={10} className="shrink-0" style={{ opacity: 0.6 }} />
        <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
        {hasChildren && (
          effectiveCollapsed
            ? <ChevronRight size={8} className="shrink-0 opacity-30" />
            : <ChevronDown size={8} className="shrink-0 opacity-30" />
        )}
      </button>

      {!effectiveCollapsed && hasChildren && (
        <div
          className="relative ml-2 pl-1.5"
        >
          <div
            className="absolute pointer-events-none"
            style={{ left: 12, top: 0, bottom: 4, width: '1px', background: '#e5e7eb', opacity: 0.3 }}
          />
          {visibleChildren.map((child) => (
            <L6Node
              key={child.id}
              node={child}
              filter={filter}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Level 6 node (leaf action) ───────────────────────────────────────
interface L6NodeProps {
  node: MenuNodeData;
  filter: string;
  onNavigate: () => void;
}

export const L6Node: React.FC<L6NodeProps> = ({ node, filter, onNavigate }) => {
  const location = useLocation();
  if (filter && !node.label.toLowerCase().includes(filter.toLowerCase())) return null;

  const path = node.route ? stripOrgPrefix(node.route) : '#';
  const active = node.route ? stripOrgPrefix(location.pathname) === path : false;
  const IconComp = getIcon(node.icon);

  return (
    <div className="relative">
      <div
        className="absolute pointer-events-none"
        style={{ left: 6, top: '50%', width: 5, height: '1px', background: '#e5e7eb', opacity: 0.3 }}
      />
      <Link
        to={path}
        onClick={onNavigate}
        className={`
          flex items-center gap-1 py-0.5 pr-3 text-[10.5px] transition-all
          hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-sm
          ${active
            ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/60 dark:bg-indigo-900/10'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}
        `}
        style={{ paddingLeft: 16 }}
      >
        <IconComp size={9} className="shrink-0 opacity-50" />
        <span className="flex-1 text-left truncate">{highlightMatch(node.label, filter)}</span>
      </Link>
    </div>
  );
};

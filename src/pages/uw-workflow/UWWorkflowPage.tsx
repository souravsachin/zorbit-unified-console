import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Activity,
  Clock,
  Inbox,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Search,
  User,
  DollarSign,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  X,
  AlertCircle,
  Play,
  UserPlus,
  Eye,
  BarChart3,
  Layers,
  Shield,
  MessageSquare,
  Lock,
  Download,
  Mail,
  FileBadge,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { maskPiiValue } from '../../components/ZorbitDataTable/PiiMask';
import { usePiiVisibility, PII_ROLE_OPTIONS } from '../../hooks/usePiiVisibility';
import type { PiiVisibilityLevel } from '../../hooks/usePiiVisibility';
import { getNickname } from '../../utils/pii-nicknames';

/* ------------------------------------------------------------------ */
/*  PII Visibility Context (module-level, avoids prop drilling)        */
/* ------------------------------------------------------------------ */

const PiiVisibilityContext = React.createContext<PiiVisibilityLevel>('masked');

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QueueStat {
  queue: string;
  label: string;
  count: number;
  assigned: number;
  unassigned: number;
  avgAgeHours: number;
}

interface QueueSummary {
  totalNew: number;
  totalStp: number;
  totalNstp: number;
  totalApproved: number;
  totalDeclined: number;
  totalAssigned: number;
  totalUnassigned: number;
}

interface WorkflowAction {
  hashId: string;
  code: string;
  label: string;
  description?: string;
  category?: string;
  fromStatuses?: string[];
  toStatus?: string;
  actionType?: string;
  requiresComment?: boolean;
  requiresDocument?: boolean;
  requiredPrivilege?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

interface HistoryEntry {
  hashId: string;
  quotationHashId: string;
  actionCode: string;
  actionLabel?: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
  performedBy?: string;
  performedByName?: string;
  performedAt?: string;
  createdAt: string;
}

interface QuotationItem {
  id: string;
  hashId?: string;
  quotationNumber?: string;
  productName?: string;
  productHashId?: string;
  variantName?: string;
  proposerName?: string;
  proposerEmail?: string;
  submittedBy?: string;
  status: string;
  type?: string;
  region?: string;
  memberCount?: number;
  basePremium?: number;
  totalPremium?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  last_action?: string;
  last_action_by?: string;
  assignment?: {
    assignedTo: string;
    assignedToName?: string;
    queue: string;
    assignedAt: string;
  } | null;
}

interface HealthStatus {
  status: string;
  service: string;
  mongodb?: { connected: boolean; readyState: number };
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Column Config (DataTable-ready structure)                          */
/* ------------------------------------------------------------------ */

interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  piiSensitive?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

const QUEUE_COLUMNS: ColumnConfig[] = [
  { key: 'quotationNumber', label: 'Quotation #', sortable: true },
  { key: 'proposerName', label: 'Proposer', sortable: true, piiSensitive: true },
  { key: 'productName', label: 'Product', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'totalPremium', label: 'Premium', sortable: true, align: 'right' },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'assignment', label: 'Assigned To', sortable: false },
];

const ACTION_COLUMNS: ColumnConfig[] = [
  { key: 'code', label: 'Code' },
  { key: 'label', label: 'Label' },
  { key: 'category', label: 'Category' },
  { key: 'fromStatuses', label: 'From Statuses' },
  { key: 'toStatus', label: 'To Status' },
  { key: 'requiresComment', label: 'Comment' },
  { key: 'requiredPrivilege', label: 'Privilege' },
];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

// Maps route segments to backend queue names and display config
const ROUTE_TO_QUEUE: Record<string, { queue: string; statusFilter?: string[]; label: string; icon: React.ElementType }> = {
  'new-quotations-l1': { queue: 'new-quotations-l1', label: 'New Quotations (L1)', icon: Inbox },
  'new-quotations-l2': { queue: 'new-quotations-l2', label: 'New Quotations (L2)', icon: Inbox },
  'new-quotations-l3': { queue: 'new-quotations-l3', label: 'New Quotations (L3)', icon: Inbox },
  'stp-approved': { queue: 'uw-stp-l1', statusFilter: ['stp_approved', 'stp_pending'], label: 'STP Approved', icon: CheckCircle2 },
  'nstp-review': { queue: 'uw-nstp-l1', statusFilter: ['nstp_pending', 'nstp_review'], label: 'NSTP Review', icon: Shield },
  'query-raised': { queue: 'all-quotations', statusFilter: ['query_raised'], label: 'Query Raised', icon: MessageSquare },
  'query-responded': { queue: 'all-quotations', statusFilter: ['query_responded'], label: 'Query Responded', icon: MessageSquare },
  'approved': { queue: 'all-quotations', statusFilter: ['approved', 'approved_with_loading', 'approved_with_conditions'], label: 'Approved', icon: CheckCircle2 },
  'declined': { queue: 'all-quotations', statusFilter: ['declined'], label: 'Declined', icon: XCircle },
  'payment-pending': { queue: 'all-quotations', statusFilter: ['payment_pending'], label: 'Payment Pending', icon: DollarSign },
  'policy-issued': { queue: 'all-quotations', statusFilter: ['policy_issued'], label: 'Policy Issued', icon: FileText },
  'all-quotations': { queue: 'all-quotations', label: 'All Quotations', icon: Layers },
  'my-assignments': { queue: 'all-quotations', label: 'My Assignments', icon: User },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  new: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  pending_review: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  under_review: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  stp_approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  stp_pending: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  nstp_pending: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  nstp_review: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  approved: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  approved_with_loading: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  approved_with_conditions: { bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800' },
  declined: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  query_raised: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  query_responded: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  payment_pending: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  payment_received: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  policy_issued: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  cancelled: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' },
  incomplete: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  verification_pending: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
};

const DEFAULT_STATUS_COLOR = { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount?: number, currency?: string): string {
  if (amount === undefined || amount === null) return '-';
  const cur = currency || 'AED';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${cur} ${amount.toLocaleString()}`;
  }
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
}

/* ------------------------------------------------------------------ */
/*  PII Display Helper                                                 */
/* ------------------------------------------------------------------ */

/** Renders a PII-sensitive value based on the user's role visibility level */
const PiiCell: React.FC<{
  value: unknown;
  columnName: string;
  visibility?: PiiVisibilityLevel;
}> = ({ value, columnName, visibility: explicitVisibility }) => {
  const ctxVisibility = useContext(PiiVisibilityContext);
  const visibility = explicitVisibility ?? ctxVisibility;
  const str = value == null || value === '' ? '' : String(value);
  if (!str) return <span className="text-gray-300 dark:text-gray-600">-</span>;

  // Full access: show real value, no lock
  if (visibility === 'full') {
    return (
      <span className="text-gray-800 dark:text-gray-200 text-sm">
        {str}
      </span>
    );
  }

  // Hidden: show RESTRICTED, no data at all
  if (visibility === 'hidden') {
    return (
      <span className="inline-flex items-center gap-1">
        <Shield className="h-3 w-3 text-red-400 flex-shrink-0" />
        <span className="text-red-400 dark:text-red-500 text-xs font-semibold uppercase tracking-wider">
          Restricted
        </span>
      </span>
    );
  }

  // Nickname: show a culturally-matched fake name with alias badge
  if (visibility === 'nickname') {
    const alias = getNickname(str);
    return (
      <span className="inline-flex items-center gap-1">
        <User className="h-3 w-3 text-blue-400 dark:text-blue-500 flex-shrink-0" />
        <span className="text-gray-700 dark:text-gray-300 text-sm" title="PII alias (not real name)">
          {alias}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 px-1 py-0.5 rounded leading-none">
          alias
        </span>
      </span>
    );
  }

  // Default (masked): show partial mask with lock icon
  const masked = maskPiiValue(value, columnName);
  if (!masked) return <span className="text-gray-300 dark:text-gray-600">-</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Lock className="h-3 w-3 text-amber-400 dark:text-amber-500 flex-shrink-0" />
      <span className="text-gray-600 dark:text-gray-400 font-mono text-xs" title="PII masked">
        {masked}
      </span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = getStatusColor(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      {formatStatus(status)}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Dashboard View                                                     */
/* ------------------------------------------------------------------ */

const DashboardView: React.FC<{
  queues: QueueStat[];
  summary: QueueSummary | null;
  actions: WorkflowAction[];
  history: HistoryEntry[];
  historyTotal: number;
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigateQueue: (route: string) => void;
  onNavigateActions: () => void;
}> = ({ queues, summary, actions, history, historyTotal, health, loading, error, onRefresh, onNavigateQueue, onNavigateActions }) => {
  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <GitBranch className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">UW Workflow Engine</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Underwriting workflow -- 13 queues, status progression, audit trail
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateActions}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Activity className="h-4 w-4" />
            Actions
          </button>
          <a
            href="https://zorbit.scalatics.com/api/uw-workflow/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Swagger
          </a>
        </div>
      </div>

      {/* Health */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : isHealthy ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Service: <span className="font-mono">{health?.service || 'zorbit-app-uw_workflow'}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isHealthy ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {health?.status || 'checking...'}
          </span>
          {health?.mongodb && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${health.mongodb.connected ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600'}`}>
              MongoDB: {health.mongodb.connected ? 'connected' : 'disconnected'}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto font-mono">Port 3115</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'New', value: summary.totalNew, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', route: 'new-quotations-l1' },
            { label: 'STP', value: summary.totalStp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', route: 'stp-approved' },
            { label: 'NSTP', value: summary.totalNstp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', route: 'nstp-review' },
            { label: 'Approved', value: summary.totalApproved, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', route: 'approved' },
            { label: 'Declined', value: summary.totalDeclined, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', route: 'declined' },
            { label: 'Assigned', value: summary.totalAssigned, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', route: 'my-assignments' },
            { label: 'Unassigned', value: summary.totalUnassigned, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', route: 'all-quotations' },
          ].map((card) => (
            <button
              key={card.label}
              onClick={() => onNavigateQueue(card.route)}
              className={`rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 ${card.bg} text-left hover:shadow-md transition-shadow group`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </button>
          ))}
        </div>
      )}

      {/* Queue Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Workflow Queues</h2>
          <span className="text-xs text-gray-400">({queues.length} queues)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 dark:bg-gray-700">
          {queues.map((q) => {
            const routeKey = Object.keys(ROUTE_TO_QUEUE).find(
              (k) => ROUTE_TO_QUEUE[k].queue === q.queue,
            );
            return (
              <button
                key={q.queue}
                onClick={() => onNavigateQueue(routeKey || 'all-quotations')}
                className="bg-white dark:bg-gray-800 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {q.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold ${q.count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                    {q.count}
                  </span>
                  {q.assigned > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                      {q.assigned} assigned
                    </span>
                  )}
                  {q.unassigned > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                      {q.unassigned} unassigned
                    </span>
                  )}
                </div>
                {q.avgAgeHours > 0 && (
                  <div className="text-[10px] text-gray-400 mt-1">
                    Avg age: {q.avgAgeHours < 24 ? `${q.avgAgeHours.toFixed(1)}h` : `${(q.avgAgeHours / 24).toFixed(1)}d`}
                  </div>
                )}
              </button>
            );
          })}
          {queues.length === 0 && !loading && (
            <div className="col-span-full px-4 py-8 text-center text-sm text-gray-400">
              No queue data available. Seed demo data from the Setup page.
            </div>
          )}
        </div>
      </div>

      {/* Workflow Actions Preview */}
      {actions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Workflow Actions</h2>
              <span className="text-xs text-gray-400">({actions.length})</span>
            </div>
            <button
              onClick={onNavigateActions}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {actions.slice(0, 10).map((action) => (
              <div key={action.hashId || action.code} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded w-40 truncate text-center">
                  {action.code}
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{action.label}</span>
                {action.category && (
                  <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded hidden lg:inline">
                    {action.category}
                  </span>
                )}
                {action.toStatus && (
                  <span className="text-xs text-gray-400 font-mono">-&gt; {action.toStatus}</span>
                )}
                {action.requiresComment && (
                  <span className="text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-1.5 py-0.5 rounded">
                    requires comment
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent History</h2>
          <span className="text-xs text-gray-400">({historyTotal} total)</span>
        </div>
        {history.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {history.slice(0, 20).map((entry) => (
              <div key={entry.hashId} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <span className="font-mono text-gray-500 w-24 truncate">{entry.quotationHashId}</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{entry.actionCode}</span>
                <StatusBadge status={entry.fromStatus} />
                <span className="text-gray-400">-&gt;</span>
                <StatusBadge status={entry.toStatus} />
                {entry.performedByName && (
                  <span className="text-gray-400 hidden lg:inline">by {entry.performedByName}</span>
                )}
                <span className="text-gray-400 ml-auto">{formatDateTime(entry.performedAt || entry.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            No workflow history yet. Execute a workflow action to see entries here.
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Queue View                                                         */
/* ------------------------------------------------------------------ */

const QueueView: React.FC<{
  queueRoute: string;
  orgId: string;
  userId?: string;
  onBack: () => void;
  onSelectItem: (item: QuotationItem) => void;
  queues: QueueStat[];
  onNavigateQueue: (route: string) => void;
}> = ({ queueRoute, orgId, userId, onBack, onSelectItem, queues, onNavigateQueue }) => {
  const routeConfig = ROUTE_TO_QUEUE[queueRoute];
  const base = API_CONFIG.UW_WORKFLOW_URL;

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const queueName = routeConfig?.queue || 'all-quotations';
  const queueLabel = routeConfig?.label || formatStatus(queueRoute);
  const QueueIcon = routeConfig?.icon || Inbox;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sort: sortField,
        order: sortOrder,
      });
      if (search) params.set('search', search);
      if (queueRoute === 'my-assignments' && userId) {
        params.set('assignedTo', userId);
      }

      const res = await api.get(`${base}/api/v1/O/${orgId}/uw-workflow/queues/${queueName}/items?${params}`);
      const d = res.data;

      let fetchedItems: QuotationItem[] = d.items || [];

      // Apply client-side status filter if the route maps to specific statuses
      if (routeConfig?.statusFilter) {
        fetchedItems = fetchedItems.filter((item) =>
          routeConfig.statusFilter!.includes(item.status),
        );
      }

      setItems(fetchedItems);
      setTotal(d.total || fetchedItems.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load queue items');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [base, orgId, queueName, queueRoute, userId, page, pageSize, sortField, sortOrder, search, routeConfig?.statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset page when changing queues
  useEffect(() => {
    setPage(1);
    setSearch('');
    setSearchInput('');
  }, [queueRoute]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  const currentQueueStat = queues.find((q) => q.queue === queueName);

  // Page size options matching DataTable convention
  const pageSizes = [10, 25, 50, 100];

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <QueueIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{queueLabel}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {total} quotation{total !== 1 ? 's' : ''} in queue
              {currentQueueStat && currentQueueStat.assigned > 0 && (
                <> | {currentQueueStat.assigned} assigned</>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={fetchItems}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Queue Tab Bar */}
      <div className="flex flex-wrap gap-1 overflow-x-auto pb-1">
        {Object.entries(ROUTE_TO_QUEUE).map(([key, config]) => {
          const isActive = key === queueRoute;
          const stat = queues.find((q) => q.queue === config.queue);
          return (
            <button
              key={key}
              onClick={() => onNavigateQueue(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
              }`}
            >
              {config.label}
              {stat && stat.count > 0 && (
                <span className={`min-w-[18px] h-4 px-1 text-[10px] font-bold rounded-full inline-flex items-center justify-center ${
                  isActive
                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, quotation number, or product..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                {QUEUE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.piiSensitive && <Lock className="h-3 w-3 text-amber-400" />}
                      {col.label}
                      {sortField === col.key && (
                        <ChevronDown className={`h-3 w-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={QUEUE_COLUMNS.length + 1} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Loading queue items...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={QUEUE_COLUMNS.length + 1} className="px-4 py-12 text-center">
                    <Inbox className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No quotations in this queue</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                      Seed demo data from the Setup page or ingest quotations from HI Quotation
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {item.quotationNumber || item.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PiiCell value={item.proposerName} columnName="proposerName" />
                      {item.memberCount && item.memberCount > 0 && (
                        <div className="text-[10px] text-gray-400">{item.memberCount} member{item.memberCount > 1 ? 's' : ''}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 dark:text-gray-300">{item.productName || '-'}</div>
                      {item.variantName && (
                        <div className="text-[10px] text-gray-400">{item.variantName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-right">
                      {formatCurrency(item.totalPremium, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.region || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {item.assignment ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {item.assignment.assignedToName || item.assignment.assignedTo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectItem(item); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * pageSize + 1}--{Math.min(page * pageSize, total)} of {total}
              </p>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = startPage + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 text-xs font-medium rounded-lg transition-colors ${
                        p === page
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Detail Panel (Slide-over)                                          */
/* ------------------------------------------------------------------ */

const DetailPanel: React.FC<{
  item: QuotationItem;
  orgId: string;
  onClose: () => void;
  onActionExecuted: () => void;
}> = ({ item, orgId, onClose, onActionExecuted }) => {
  const base = API_CONFIG.UW_WORKFLOW_URL;
  const [availableActions, setAvailableActions] = useState<WorkflowAction[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showComment, setShowComment] = useState<WorkflowAction | null>(null);
  const [comment, setComment] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [assignQueue, setAssignQueue] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Payment state
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [paymentLinkCopied, setPaymentLinkCopied] = useState(false);

  // Policy state
  const [policyData, setPolicyData] = useState<Record<string, any> | null>(null);
  const [issuingPolicy, setIssuingPolicy] = useState(false);
  const [latestPaymentId, setLatestPaymentId] = useState<string | null>(null);

  // Key info grid items -- structured for easy config changes
  const infoGrid = useMemo(() => [
    { label: 'Status', value: item.status, type: 'status' as const },
    { label: 'Premium', value: formatCurrency(item.totalPremium, item.currency), type: 'text' as const },
    { label: 'Product', value: item.productName || '-', sub: item.variantName, type: 'text' as const },
    { label: 'Region', value: item.region || '-', type: 'text' as const },
    { label: 'Type', value: item.type || 'retail', type: 'text' as const },
    { label: 'Members', value: String(item.memberCount || 0), type: 'text' as const },
    { label: 'Submitted', value: formatDateTime(item.submittedAt || item.createdAt), type: 'text' as const },
    { label: 'Assigned To', value: item.assignment ? (item.assignment.assignedToName || item.assignment.assignedTo) : 'Unassigned', type: 'text' as const },
    { label: 'Proposer', value: item.proposerName, type: 'pii' as const, piiColumn: 'proposerName' },
  ], [item]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingActions(true);
      setLoadingHistory(true);
      try {
        const [actionsRes, historyRes] = await Promise.allSettled([
          api.get(`${base}/api/v1/O/${orgId}/uw-workflow/actions/available/${item.id}`),
          api.get(`${base}/api/v1/O/${orgId}/uw-workflow/history/${item.id}`),
        ]);

        if (actionsRes.status === 'fulfilled') {
          const d = actionsRes.value.data;
          setAvailableActions(d.availableActions || []);
        }
        if (historyRes.status === 'fulfilled') {
          const d = historyRes.value.data;
          setHistory(Array.isArray(d) ? d : d?.items || []);
        }
      } catch {
        // Best effort
      } finally {
        setLoadingActions(false);
        setLoadingHistory(false);
      }

      // Load existing payment link if quotation is in an approved/payment status
      if (['approved', 'approved_with_loading', 'approved_with_conditions', 'payment_pending', 'payment_received', 'policy_issued'].includes(item.status)) {
        try {
          const payRes = await api.get(
            `${base}/api/v1/O/${orgId}/uw-workflow/payments/quotation/${item.id}`,
          );
          const payments = Array.isArray(payRes.data) ? payRes.data : [];
          if (payments.length > 0) {
            const latest = payments[0];
            setPaymentLink(latest.paymentLink);
            setPaymentStatus(latest.status);
            if (latest.paymentId) {
              setLatestPaymentId(latest.paymentId);
            }
          }
        } catch {
          // No payment yet — that's fine
        }
      }

      // Load policy data if quotation is in policy_issued or payment_received status
      if (['payment_received', 'policy_issued'].includes(item.status)) {
        try {
          const polRes = await api.get(
            `${base}/api/v1/O/${orgId}/uw-workflow/policies/quotation/${item.id}`,
          );
          if (polRes.data) {
            setPolicyData(polRes.data);
          }
        } catch {
          // No policy yet — that's fine
        }
      }
    };
    fetchDetails();
  }, [base, orgId, item.id]);

  const executeAction = async (action: WorkflowAction, actionComment?: string) => {
    setExecuting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post(
        `${base}/api/v1/O/${orgId}/uw-workflow/execute/${item.id}/${action.code}`,
        { comment: actionComment || '', metadata: {} },
      );
      setActionSuccess(res.data?.message || `Action "${action.label}" executed successfully`);
      setShowComment(null);
      setComment('');
      onActionExecuted();

      // Refresh available actions and history
      const [actionsRes, historyRes] = await Promise.allSettled([
        api.get(`${base}/api/v1/O/${orgId}/uw-workflow/actions/available/${item.id}`),
        api.get(`${base}/api/v1/O/${orgId}/uw-workflow/history/${item.id}`),
      ]);
      if (actionsRes.status === 'fulfilled') {
        setAvailableActions(actionsRes.value.data.availableActions || []);
      }
      if (historyRes.status === 'fulfilled') {
        const d = historyRes.value.data;
        setHistory(Array.isArray(d) ? d : d?.items || []);
      }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err instanceof Error ? err.message : 'Action failed');
      setActionError(msg);
    } finally {
      setExecuting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTo || !assignQueue) return;
    setExecuting(true);
    setActionError(null);
    try {
      await api.post(`${base}/api/v1/O/${orgId}/uw-workflow/assign`, {
        quotationHashId: item.id,
        assignedTo: assignTo,
        queue: assignQueue,
      });
      setActionSuccess('Assignment successful');
      setShowAssign(false);
      setAssignTo('');
      setAssignQueue('');
      onActionExecuted();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || 'Assignment failed';
      setActionError(msg);
    } finally {
      setExecuting(false);
    }
  };

  // Queue options for assignment dropdown
  const queueOptions = [
    { value: 'new-quotations-l1', label: 'New Quotations (L1)' },
    { value: 'new-quotations-l2', label: 'New Quotations (L2)' },
    { value: 'new-quotations-l3', label: 'New Quotations (L3)' },
    { value: 'uw-stp-l1', label: 'UW STP (L1)' },
    { value: 'uw-stp-l2', label: 'UW STP (L2)' },
    { value: 'uw-stp-l3', label: 'UW STP (L3)' },
    { value: 'uw-nstp-l1', label: 'UW NSTP (L1)' },
    { value: 'uw-nstp-l2', label: 'UW NSTP (L2)' },
    { value: 'uw-nstp-l3', label: 'UW NSTP (L3)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {item.quotationNumber || item.id}
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <PiiCell value={item.proposerName || 'Unknown Proposer'} columnName="proposerName" />
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {infoGrid.map((field) => (
              <div key={field.label}>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                  {field.type === 'pii' && <Lock className="h-2.5 w-2.5 text-amber-400" />}
                  {field.label}
                </label>
                <div className="mt-1">
                  {field.type === 'status' ? (
                    <StatusBadge status={field.value || ''} />
                  ) : field.type === 'pii' ? (
                    <PiiCell value={field.value} columnName={field.piiColumn || field.label} />
                  ) : (
                    <>
                      <p className={`text-sm text-gray-700 dark:text-gray-300 ${field.label === 'Premium' ? 'text-lg font-bold font-mono' : ''}`}>
                        {field.value}
                      </p>
                      {field.sub && <p className="text-xs text-gray-400">{field.sub}</p>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {actionSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {actionError}
            </div>
          )}

          {/* Actions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Available Actions
            </h3>
            {loadingActions ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : availableActions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No actions available for current status</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableActions.map((action) => (
                  <button
                    key={action.code}
                    onClick={() => {
                      setActionError(null);
                      setActionSuccess(null);
                      if (action.requiresComment) {
                        setShowComment(action);
                        setComment('');
                      } else {
                        executeAction(action);
                      }
                    }}
                    disabled={executing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-50 transition-colors"
                  >
                    <Play className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
                <button
                  onClick={() => { setShowAssign(true); setActionError(null); setActionSuccess(null); }}
                  disabled={executing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-3 w-3" />
                  Assign
                </button>
              </div>
            )}
          </div>

          {/* Comment Modal inline */}
          {showComment && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                {showComment.label} -- Comment Required
              </h4>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comment..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowComment(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeAction(showComment, comment)}
                  disabled={!comment.trim() || executing}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {executing ? 'Executing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* Assignment Form */}
          {showAssign && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
              <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                Assign Quotation
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Assign To (User Hash ID)</label>
                  <input
                    type="text"
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    placeholder="e.g. U-81F3"
                    className="mt-1 w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Queue</label>
                  <select
                    value={assignQueue}
                    onChange={(e) => setAssignQueue(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select queue...</option>
                    {queueOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowAssign(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignTo || !assignQueue || executing}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {executing ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Link Section — for approved quotations */}
          {['approved', 'approved_with_loading', 'approved_with_conditions', 'payment_pending', 'payment_received'].includes(item.status) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Payment Collection
              </h3>
              {paymentLink ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Payment Link Generated</span>
                    {paymentStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        paymentStatus === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : paymentStatus === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {paymentStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={paymentLink}
                      className="flex-1 text-xs font-mono bg-white dark:bg-gray-700 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentLink);
                        setPaymentLinkCopied(true);
                        setTimeout(() => setPaymentLinkCopied(false), 2000);
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors whitespace-nowrap"
                    >
                      {paymentLinkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open Payment Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setGeneratingPayment(true);
                    setActionError(null);
                    try {
                      const res = await api.post(
                        `${base}/api/v1/O/${orgId}/uw-workflow/payments/generate-link`,
                        {
                          quotationHashId: item.id,
                          amount: item.totalPremium || 0,
                          currency: item.currency || 'AED',
                          quotationNumber: item.quotationNumber || item.id,
                          productName: item.productName || 'Insurance Product',
                          customerName: item.proposerName || '',
                        },
                      );
                      setPaymentLink(res.data.paymentLink);
                      setPaymentStatus(res.data.status);
                    } catch (err: unknown) {
                      const msg = (err as any)?.response?.data?.message || 'Failed to generate payment link';
                      setActionError(msg);
                    } finally {
                      setGeneratingPayment(false);
                    }
                  }}
                  disabled={generatingPayment}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                >
                  {generatingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Generate Payment Link
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Policy Issuance Section — for payment_received quotations */}
          {item.status === 'payment_received' && !policyData && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Policy Issuance
              </h3>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                  Payment received. Ready to issue policy.
                </p>
                <button
                  onClick={async () => {
                    setIssuingPolicy(true);
                    setActionError(null);
                    setActionSuccess(null);
                    try {
                      const res = await api.post(
                        `${base}/api/v1/O/${orgId}/uw-workflow/policies/issue`,
                        {
                          quotationHashId: item.id,
                          paymentId: latestPaymentId || '',
                        },
                      );
                      setPolicyData(res.data);
                      setActionSuccess(`Policy ${res.data.policyNumber} issued successfully`);
                      onActionExecuted();
                    } catch (err: unknown) {
                      const msg = (err as any)?.response?.data?.message || 'Failed to issue policy';
                      setActionError(msg);
                    } finally {
                      setIssuingPolicy(false);
                    }
                  }}
                  disabled={issuingPolicy || !latestPaymentId}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                >
                  {issuingPolicy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Issuing Policy...
                    </>
                  ) : (
                    <>
                      <FileBadge className="h-4 w-4" />
                      Issue Policy
                    </>
                  )}
                </button>
                {!latestPaymentId && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Unable to find payment ID. Please ensure payment was processed correctly.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Policy Details — for policy_issued quotations or just-issued policies */}
          {(item.status === 'policy_issued' || policyData) && policyData && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Policy Details
              </h3>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileBadge className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                      {policyData.policyNumber}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {(policyData.status || 'active').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Effective From</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {policyData.effectiveFrom ? new Date(policyData.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Effective To</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {policyData.effectiveTo ? new Date(policyData.effectiveTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Premium</span>
                    <p className="text-gray-700 dark:text-gray-300 font-mono font-bold">
                      {policyData.currency || 'AED'} {Number(policyData.premium || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Sum Insured</span>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">
                      {policyData.currency || 'AED'} {Number(policyData.sumInsured || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Email status */}
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {policyData.emailSent
                      ? `Email sent${policyData.emailSentAt ? ` on ${new Date(policyData.emailSentAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`
                      : 'Email pending'}
                  </span>
                </div>

                {/* PDF Download */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`${base}/api/v1/G/uw-workflow/policies/${policyData.policyHashId || policyData.hashId}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Policy PDF
                  </a>
                  <a
                    href={`${base}/api/v1/G/uw-workflow/policies/${policyData.policyHashId || policyData.hashId}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* History Timeline */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Workflow History
            </h3>
            {loadingHistory ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No workflow history for this quotation</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
                <ul className="space-y-3">
                  {history.map((entry, idx) => (
                    <li key={entry.hashId || idx} className="relative pl-8">
                      <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-gray-800" />
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.actionLabel || formatStatus(entry.actionCode)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(entry.performedAt || entry.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <StatusBadge status={entry.fromStatus} />
                          <span className="text-gray-400">-&gt;</span>
                          <StatusBadge status={entry.toStatus} />
                        </div>
                        {entry.performedByName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            by {entry.performedByName}
                          </p>
                        )}
                        {entry.comment && (
                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                            {entry.comment}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Workflow Actions Management View                                    */
/* ------------------------------------------------------------------ */

const WorkflowActionsView: React.FC<{
  orgId: string;
  onBack: () => void;
}> = ({ orgId, onBack }) => {
  const base = API_CONFIG.UW_WORKFLOW_URL;
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      try {
        const res = await api.get(`${base}/api/v1/O/${orgId}/uw-workflow/actions`);
        const d = res.data;
        setActions(Array.isArray(d) ? d : d?.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, [base, orgId]);

  // Client-side search filtering for action definitions
  const filtered = useMemo(() => {
    if (!search) return actions;
    const q = search.toLowerCase();
    return actions.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.label.toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q) ||
        (a.toStatus || '').toLowerCase().includes(q),
    );
  }, [actions, search]);

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Workflow Action Definitions</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{actions.length} actions configured</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter actions by code, label, or category..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  {ACTION_COLUMNS.map((col) => (
                    <th key={col.key} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={ACTION_COLUMNS.length} className="px-4 py-8 text-center text-sm text-gray-400">
                      {search ? 'No actions match your search' : 'No actions configured'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((action) => (
                    <tr key={action.hashId || action.code} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                          {action.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{action.label}</td>
                      <td className="px-4 py-2.5">
                        {action.category ? (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {action.category}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(action.fromStatuses || []).map((s) => (
                            <StatusBadge key={s} status={s} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {action.toStatus && <StatusBadge status={action.toStatus} />}
                      </td>
                      <td className="px-4 py-2.5">
                        {action.requiresComment ? (
                          <span className="text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-1.5 py-0.5 rounded">
                            required
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {action.requiredPrivilege ? (
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {action.requiredPrivilege}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

/** Role-switcher pill displayed at top-right of the page */
const PiiRoleSwitcher: React.FC<{
  currentRole: string | null;
  visibility: PiiVisibilityLevel;
  onSwitch: (role: string | null) => void;
}> = ({ currentRole, visibility, onSwitch }) => {
  const [open, setOpen] = useState(false);

  const visColors: Record<PiiVisibilityLevel, string> = {
    full:     'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    nickname: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    masked:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    hidden:   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  };

  const visLabels: Record<PiiVisibilityLevel, string> = {
    full: 'Full PII',
    nickname: 'Nickname',
    masked: 'Masked',
    hidden: 'Hidden',
  };

  const currentLabel = PII_ROLE_OPTIONS.find(r => r.value === currentRole)?.label || 'Default';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${visColors[visibility]}`}
        title="PII visibility role (demo)"
      >
        <Eye className="h-3 w-3" />
        <span>{currentLabel}</span>
        <span className="opacity-60">({visLabels[visibility]})</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[220px]">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              PII Visibility Role
            </div>
            {PII_ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onSwitch(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between ${
                  currentRole === opt.value ? 'bg-gray-50 dark:bg-gray-700/30 font-medium' : ''
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${visColors[opt.visibility]}`}>
                  {visLabels[opt.visibility]}
                </span>
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
              <button
                onClick={() => { onSwitch(null); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Clear (use email-based detection)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const UWWorkflowPage: React.FC = () => {
  const { orgId, user } = useAuth();
  const { visibility, role: activeRole, setRole } = usePiiVisibility(user?.email);
  const location = useLocation();
  const navigate = useNavigate();

  // Parse current sub-route from catch-all
  const subPath = location.pathname.replace(/^\/uw-workflow\/?/, '');
  const isQueueView = subPath.startsWith('wf/');
  const isActionsView = subPath === 'workflow-actions';
  const queueRoute = isQueueView ? subPath.replace('wf/', '') : '';

  // Dashboard state
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [queues, setQueues] = useState<QueueStat[]>([]);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail panel
  const [selectedItem, setSelectedItem] = useState<QuotationItem | null>(null);

  const base = API_CONFIG.UW_WORKFLOW_URL;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, queuesRes, summaryRes, actionsRes, historyRes] = await Promise.allSettled([
        api.get(`${base}/api/v1/G/uw-workflow/health`),
        api.get(`${base}/api/v1/O/${orgId}/uw-workflow/queues/stats`),
        api.get(`${base}/api/v1/O/${orgId}/uw-workflow/queues/summary`),
        api.get(`${base}/api/v1/O/${orgId}/uw-workflow/actions`),
        api.get(`${base}/api/v1/O/${orgId}/uw-workflow/history`),
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (queuesRes.status === 'fulfilled') {
        const d = queuesRes.value.data;
        setQueues(d?.queues || (Array.isArray(d) ? d : d?.data || []));
      }
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data);
      }
      if (actionsRes.status === 'fulfilled') {
        const d = actionsRes.value.data;
        setActions(Array.isArray(d) ? d : d?.data || []);
      }
      if (historyRes.status === 'fulfilled') {
        const d = historyRes.value.data;
        setHistory(Array.isArray(d) ? d : d?.items || []);
        setHistoryTotal(d?.total || (Array.isArray(d) ? d.length : 0));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [base, orgId]);

  // Fetch queue stats for tab counts even in sub-views
  const fetchQueueStats = useCallback(async () => {
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/uw-workflow/queues/stats`);
      const d = res.data;
      setQueues(d?.queues || (Array.isArray(d) ? d : d?.data || []));
    } catch {
      // best effort
    }
  }, [base, orgId]);

  useEffect(() => {
    if (!isQueueView && !isActionsView) {
      fetchDashboardData();
    } else {
      fetchQueueStats();
    }
  }, [isQueueView, isActionsView, fetchDashboardData, fetchQueueStats]);

  const navigateToQueue = (route: string) => {
    navigate(`/uw-workflow/wf/${route}`);
  };

  const navigateBack = () => {
    navigate('/uw-workflow');
  };

  const navigateToActions = () => {
    navigate('/uw-workflow/workflow-actions');
  };

  // Role-switcher bar (rendered above the main content)
  const roleSwitcherBar = (
    <div className="flex items-center justify-end mb-2 px-1">
      <PiiRoleSwitcher currentRole={activeRole} visibility={visibility} onSwitch={setRole} />
    </div>
  );

  // Determine which view to render -- all wrapped in PiiVisibilityContext
  if (isActionsView) {
    return (
      <PiiVisibilityContext.Provider value={visibility}>
        {roleSwitcherBar}
        <WorkflowActionsView orgId={orgId} onBack={navigateBack} />
      </PiiVisibilityContext.Provider>
    );
  }

  if (isQueueView && queueRoute) {
    return (
      <PiiVisibilityContext.Provider value={visibility}>
        {roleSwitcherBar}
        <QueueView
          queueRoute={queueRoute}
          orgId={orgId}
          userId={user?.id}
          onBack={navigateBack}
          onSelectItem={setSelectedItem}
          queues={queues}
          onNavigateQueue={navigateToQueue}
        />
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            orgId={orgId}
            onClose={() => setSelectedItem(null)}
            onActionExecuted={() => {
              fetchQueueStats();
            }}
          />
        )}
      </PiiVisibilityContext.Provider>
    );
  }

  // Default: Dashboard
  return (
    <PiiVisibilityContext.Provider value={visibility}>
      {roleSwitcherBar}
      <DashboardView
        queues={queues}
        summary={summary}
        actions={actions}
        history={history}
        historyTotal={historyTotal}
        health={health}
        loading={loading}
        error={error}
        onRefresh={fetchDashboardData}
        onNavigateQueue={navigateToQueue}
        onNavigateActions={navigateToActions}
      />
    </PiiVisibilityContext.Provider>
  );
};

export default UWWorkflowPage;

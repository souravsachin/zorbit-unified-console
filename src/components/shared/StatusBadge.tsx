import React from 'react';

type BadgeVariant = 'success' | 'info' | 'warning' | 'error' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function statusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (['active', 'healthy', 'online', 'success', 'completed'].includes(s)) return 'success';
  if (['in-progress', 'pending', 'processing'].includes(s)) return 'info';
  if (['warning', 'degraded', 'expiring'].includes(s)) return 'warning';
  if (['error', 'critical', 'failed', 'offline', 'inactive'].includes(s)) return 'error';
  return 'neutral';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant }) => {
  const v = variant || statusVariant(label);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[v]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;

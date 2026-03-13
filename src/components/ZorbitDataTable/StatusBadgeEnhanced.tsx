import React from 'react';
import type { EnumValue } from '../../types/dataTable';

// Default color map for common status strings
const DEFAULT_COLOR_MAP: Record<string, string> = {
  // Greens
  active: '#4CAF50',
  approved: '#4CAF50',
  completed: '#4CAF50',
  success: '#4CAF50',
  healthy: '#4CAF50',
  verified: '#4CAF50',
  published: '#4CAF50',

  // Blues
  new: '#2196F3',
  'in-progress': '#2196F3',
  processing: '#2196F3',
  pending: '#2196F3',
  open: '#2196F3',

  // Ambers
  warning: '#FFC107',
  review: '#FFC107',
  draft: '#FFC107',
  expiring: '#FFC107',
  suspended: '#FFC107',

  // Reds
  rejected: '#F44336',
  failed: '#F44336',
  error: '#F44336',
  critical: '#F44336',
  inactive: '#F44336',
  closed: '#F44336',
  cancelled: '#F44336',

  // Grays
  unknown: '#9E9E9E',
  archived: '#9E9E9E',
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveColor(value: string, enumValues?: EnumValue[], colorMap?: Record<string, string>): string {
  // Check enum_values color first
  if (enumValues) {
    const ev = enumValues.find((e) => e.value === value);
    if (ev?.color) {
      // Semantic color names
      if (ev.color === 'success') return '#4CAF50';
      if (ev.color === 'warning') return '#FFC107';
      if (ev.color === 'error') return '#F44336';
      if (ev.color === 'info') return '#2196F3';
      if (ev.color.startsWith('#')) return ev.color;
      return ev.color;
    }
  }

  // Check custom color map
  if (colorMap) {
    const c = colorMap[value] || colorMap[value.toLowerCase()];
    if (c) return c;
  }

  // Default map
  const normalized = value.toLowerCase().replace(/\s+/g, '-');
  return DEFAULT_COLOR_MAP[normalized] || '#9E9E9E';
}

interface StatusBadgeEnhancedProps {
  value: string;
  enumValues?: EnumValue[];
  colorMap?: Record<string, string>;
}

const StatusBadgeEnhanced: React.FC<StatusBadgeEnhancedProps> = ({
  value,
  enumValues,
  colorMap,
}) => {
  if (!value) return null;

  const color = resolveColor(value, enumValues, colorMap);
  const label = enumValues?.find((e) => e.value === value)?.label || value;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: hexToRgba(color, 0.15),
        color: color,
        border: `1px solid ${hexToRgba(color, 0.3)}`,
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadgeEnhanced;

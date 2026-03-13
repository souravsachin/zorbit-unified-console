import React from 'react';
import { Widget } from '../../services/dashboard';

interface GaugeWidgetProps {
  widget: Widget;
}

const GaugeWidget: React.FC<GaugeWidgetProps> = ({ widget }) => {
  const config = widget.config || {};
  const value = Math.min(100, Math.max(0, (config.value as number) || 0));
  const label = (config.label as string) || '';
  const color = (config.color as string) || '#4f46e5';

  // SVG circular gauge
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200 dark:text-gray-600"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <p className="text-2xl font-bold mt-2" style={{ color }}>{value}%</p>
      {label && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>}
    </div>
  );
};

export default GaugeWidget;

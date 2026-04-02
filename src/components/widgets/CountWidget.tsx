import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Widget } from '../../services/dashboard';

interface CountWidgetProps {
  widget: Widget;
}

const CountWidget: React.FC<CountWidgetProps> = ({ widget }) => {
  const config = widget.config || {};
  const value = (config.value as number | string) ?? '--';
  const trend = config.trend as string | undefined;
  const trendDirection = config.trendDirection as 'up' | 'down' | undefined;
  const color = (config.color as string) || 'text-primary-600';

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <p className={`text-4xl font-bold ${color}`}>{typeof value === 'object' ? JSON.stringify(value) : value}</p>
      {trend && (
        <div className="flex items-center mt-2 space-x-1 text-sm">
          {trendDirection === 'up' && <TrendingUp size={16} className="text-green-500" />}
          {trendDirection === 'down' && <TrendingDown size={16} className="text-red-500" />}
          <span className={trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};

export default CountWidget;

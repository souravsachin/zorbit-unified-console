import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Widget } from '../../services/dashboard';

interface ChartWidgetProps {
  widget: Widget;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ widget }) => {
  const config = widget.config || {};
  const chartType = (config.chartType as string) || 'bar';

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-gray-400 dark:text-gray-500">
      <BarChart3 size={48} className="mb-3 opacity-50" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Chart visualization coming soon
      </p>
      {widget.metricQuery && (
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-2 font-mono truncate max-w-full px-2">
          {widget.metricQuery}
        </p>
      )}
    </div>
  );
};

export default ChartWidget;

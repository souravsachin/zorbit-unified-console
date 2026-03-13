import React from 'react';
import { Widget } from '../../services/dashboard';
import CountWidget from './CountWidget';
import ChartWidget from './ChartWidget';
import TableWidget from './TableWidget';
import ListWidget from './ListWidget';
import GaugeWidget from './GaugeWidget';

interface WidgetCardProps {
  widget: Widget;
  onClick?: () => void;
  showEditOverlay?: boolean;
}

const renderers: Record<string, React.FC<{ widget: Widget }>> = {
  count: CountWidget,
  chart: ChartWidget,
  table: TableWidget,
  list: ListWidget,
  gauge: GaugeWidget,
};

const WidgetCard: React.FC<WidgetCardProps> = ({ widget, onClick, showEditOverlay }) => {
  const Renderer = renderers[widget.type] || CountWidget;

  return (
    <div
      className={`card h-full flex flex-col overflow-hidden ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary-400 transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold truncate">{widget.title}</h3>
        <span className="text-xs text-gray-400 uppercase">{widget.type}</span>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Renderer widget={widget} />
        {showEditOverlay && (
          <div className="absolute inset-0 bg-primary-600/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow">
              Click to edit
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetCard;

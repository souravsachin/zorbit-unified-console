import React from 'react';
import { Widget } from '../../services/dashboard';

interface ListWidgetProps {
  widget: Widget;
}

const ListWidget: React.FC<ListWidgetProps> = ({ widget }) => {
  const config = widget.config || {};
  const items = (config.items as string[]) || [];
  const ordered = (config.ordered as boolean) || false;

  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <div className="h-full overflow-auto p-4">
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center">No items</p>
      ) : (
        <ListTag className={`space-y-1.5 text-sm ${ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
          {items.map((item, i) => (
            <li key={i} className="text-gray-700 dark:text-gray-300">
              {typeof item === 'object' ? JSON.stringify(item) : item}
            </li>
          ))}
        </ListTag>
      )}
    </div>
  );
};

export default ListWidget;

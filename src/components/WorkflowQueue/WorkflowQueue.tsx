// =============================================================================
// WorkflowQueue — Tab-based wrapper around ZorbitDataTable
// =============================================================================
// The single-backend-many-views pattern: each tab loads ZorbitDataTable
// with different lockedFilters. Adding a new queue = adding a config entry.
// =============================================================================

import React, { useState } from 'react';
import { ZorbitDataTable } from '../ZorbitDataTable';
import type {
  WorkflowQueueConfig,
  WorkflowQueueDef,
  ActionButton,
} from '../../types/dataTable';

interface WorkflowQueueProps {
  config: WorkflowQueueConfig;
  orgId?: string;
  userId?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: ActionButton[];
  title?: string;
}

const WorkflowQueue: React.FC<WorkflowQueueProps> = ({
  config,
  orgId,
  userId,
  onRowClick,
  actions,
  title,
}) => {
  const [activeQueue, setActiveQueue] = useState<WorkflowQueueDef>(
    config.queues[0],
  );

  return (
    <div className="space-y-4">
      {/* Title */}
      {title && (
        <h1 className="text-2xl font-bold">{title}</h1>
      )}

      {/* Queue Tab Bar */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-1">
        {config.queues.map((queue) => {
          const isActive = queue.name === activeQueue.name;
          return (
            <button
              key={queue.name}
              onClick={() => setActiveQueue(queue)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-primary-600 border border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-800 -mb-px'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>{queue.label}</span>
                {queue.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {queue.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Data Table with locked filters from active queue */}
      <ZorbitDataTable
        key={activeQueue.name} // Force remount on queue change to reset state
        config={config.tableConfig}
        dataEndpoint={config.dataEndpoint}
        orgId={orgId}
        userId={userId}
        onRowClick={onRowClick}
        actions={actions}
        lockedFilters={activeQueue.lockedFilters}
      />
    </div>
  );
};

export default WorkflowQueue;

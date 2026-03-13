import React from 'react';

interface WorkflowHistoryEntry {
  from: string;
  to: string;
  action: string;
  performedBy: string;
  performedAt: string;
  comment?: string;
}

interface WorkflowTimelineProps {
  history: WorkflowHistoryEntry[];
}

/**
 * A vertical timeline showing workflow transition history.
 * Most recent entries appear at the top.
 */
const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ history }) => {
  const sorted = [...history].reverse();

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        No transitions yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <ul className="space-y-4">
        {sorted.map((entry, index) => (
          <li key={index} className="relative pl-8">
            {/* Dot */}
            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" />

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatAction(entry.action)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(entry.performedAt)}
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300">
                <span className="font-medium">{entry.performedBy}</span>
                {' moved from '}
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{entry.from}</span>
                {' to '}
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{entry.to}</span>
              </p>

              {entry.comment && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                  {entry.comment}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default WorkflowTimeline;

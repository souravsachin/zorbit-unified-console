import React, { useState } from 'react';
import Modal from './Modal';

interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  label: string;
  requiredRole: string;
  requiresComment?: boolean;
}

interface WorkflowActionsProps {
  /** Available transitions for the current state and user role (from GET /actions) */
  actions: WorkflowTransition[];
  /** Callback when user confirms a transition */
  onTransition: (action: string, comment?: string) => void;
  /** Whether a transition is currently in progress */
  loading?: boolean;
}

/**
 * Renders transition buttons for the available workflow actions.
 * If a transition requires a comment, a modal dialog is shown to collect it.
 */
const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  actions,
  onTransition,
  loading = false,
}) => {
  const [commentModal, setCommentModal] = useState<WorkflowTransition | null>(null);
  const [comment, setComment] = useState('');

  const handleClick = (transition: WorkflowTransition) => {
    if (transition.requiresComment) {
      setComment('');
      setCommentModal(transition);
    } else {
      onTransition(transition.action);
    }
  };

  const handleSubmitComment = () => {
    if (commentModal && comment.trim()) {
      onTransition(commentModal.action, comment.trim());
      setCommentModal(null);
      setComment('');
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((transition) => (
          <button
            key={transition.action}
            onClick={() => handleClick(transition)}
            disabled={loading}
            className={`
              inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              bg-white dark:bg-gray-800
              hover:bg-gray-50 dark:hover:bg-gray-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            `}
          >
            {transition.label}
          </button>
        ))}
      </div>

      <Modal
        isOpen={commentModal !== null}
        onClose={() => setCommentModal(null)}
        title={commentModal?.label ?? 'Add Comment'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A comment is required for this action.
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comment..."
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCommentModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitComment}
              disabled={!comment.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WorkflowActions;

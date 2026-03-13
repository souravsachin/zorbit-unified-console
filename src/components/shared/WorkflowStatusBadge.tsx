import React from 'react';

interface WorkflowStateConfig {
  label: string;
  color: string;
}

interface WorkflowStatusBadgeProps {
  state: WorkflowStateConfig;
}

/**
 * A colored badge that displays the current workflow state.
 * The background color is derived from the state's hex color with low opacity,
 * and the text uses the full hex color.
 */
const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({ state }) => {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${state.color}20`,
        color: state.color,
        border: `1px solid ${state.color}40`,
      }}
    >
      {state.label}
    </span>
  );
};

export default WorkflowStatusBadge;

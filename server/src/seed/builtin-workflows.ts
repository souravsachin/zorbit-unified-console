import { WorkflowDefinition, WorkflowState, WorkflowTransition } from '../models/entities/workflow.entity';

const productConfigStates: WorkflowState[] = [
  {
    id: 'draft',
    label: 'Draft',
    color: '#6B7280',
    icon: 'file-edit',
    isFinal: false,
    requiredRole: 'drafter',
  },
  {
    id: 'in_review',
    label: 'In Review',
    color: '#3B82F6',
    icon: 'eye',
    isFinal: false,
    requiredRole: 'approver',
  },
  {
    id: 'approved',
    label: 'Approved',
    color: '#10B981',
    icon: 'check-circle',
    isFinal: false,
    requiredRole: 'publisher',
  },
  {
    id: 'changes_requested',
    label: 'Changes Requested',
    color: '#F59E0B',
    icon: 'alert-triangle',
    isFinal: false,
    requiredRole: 'drafter',
  },
  {
    id: 'published',
    label: 'Published',
    color: '#8B5CF6',
    icon: 'globe',
    isFinal: true,
  },
  {
    id: 'archived',
    label: 'Archived',
    color: '#9CA3AF',
    icon: 'archive',
    isFinal: true,
  },
];

const productConfigTransitions: WorkflowTransition[] = [
  {
    from: 'draft',
    to: 'in_review',
    action: 'submit_for_review',
    label: 'Submit for Review',
    requiredRole: 'drafter',
  },
  {
    from: 'in_review',
    to: 'approved',
    action: 'approve',
    label: 'Approve',
    requiredRole: 'approver',
  },
  {
    from: 'in_review',
    to: 'changes_requested',
    action: 'request_changes',
    label: 'Request Changes',
    requiredRole: 'approver',
    requiresComment: true,
  },
  {
    from: 'changes_requested',
    to: 'in_review',
    action: 'resubmit',
    label: 'Resubmit',
    requiredRole: 'drafter',
  },
  {
    from: 'approved',
    to: 'published',
    action: 'publish',
    label: 'Publish',
    requiredRole: 'publisher',
  },
  {
    from: 'published',
    to: 'archived',
    action: 'archive',
    label: 'Archive',
    requiredRole: 'admin',
  },
  {
    from: '*',
    to: 'draft',
    action: 'reset_to_draft',
    label: 'Reset to Draft',
    requiredRole: 'admin',
  },
];

/**
 * Builtin workflow definitions seeded on first boot.
 * Uses a stable ID so the seed is idempotent.
 */
export const builtinWorkflowDefinitions: Partial<WorkflowDefinition>[] = [
  {
    id: 'WFL-0001',
    hashId: 'WFL-0001',
    name: 'product-configuration',
    description: 'Standard product configuration approval workflow: draft, review, approve, publish with role-based gates.',
    states: productConfigStates,
    transitions: productConfigTransitions,
    organizationHashId: 'G',
    isActive: true,
  },
];

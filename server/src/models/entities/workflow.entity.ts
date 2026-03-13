import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

/**
 * Shape of a single workflow state stored in JSONB.
 */
export interface WorkflowState {
  id: string;              // e.g., "draft", "in_review", "approved", "published"
  label: string;
  color: string;           // hex color for badges
  icon: string;            // icon name
  isFinal: boolean;
  requiredRole?: string;   // role needed to be in this state's actions
}

/**
 * Shape of a single workflow transition stored in JSONB.
 */
export interface WorkflowTransition {
  from: string;            // state id
  to: string;              // state id
  action: string;          // e.g., "submit_for_review", "approve", "reject", "publish"
  label: string;           // display label
  requiredRole: string;    // who can perform this transition
  requiresComment?: boolean;
}

/**
 * Workflow definition entity.
 * Defines the states and transitions for a reusable workflow template.
 * Table: workflow_definitions, ID prefix: WFL-XXXX
 */
@Entity('workflow_definitions')
export class WorkflowDefinition {
  /** Short hash identifier, e.g. WFL-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  /** Human-readable hash, e.g. WFL-A1B2 */
  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  /** Workflow name, e.g. "product-configuration", "document-approval" */
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 1000, default: '' })
  description!: string;

  /** Array of WorkflowState definitions */
  @Column({ type: 'jsonb', default: [] })
  states!: WorkflowState[];

  /** Array of allowed transitions */
  @Column({ type: 'jsonb', default: [] })
  transitions!: WorkflowTransition[];

  /** Organization scope (O-XXXX) */
  @Column({ type: 'varchar', name: 'organization_hash_id', length: 12 })
  @Index()
  organizationHashId!: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

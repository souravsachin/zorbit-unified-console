import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

/**
 * Shape of a single history entry stored in JSONB.
 */
export interface WorkflowHistoryEntry {
  from: string;
  to: string;
  action: string;
  performedBy: string;
  performedAt: string;     // ISO date
  comment?: string;
}

/**
 * Workflow instance entity.
 * Tracks the current state and history of a specific entity going through a workflow.
 * Table: workflow_instances, ID prefix: WFI-XXXX
 */
@Entity('workflow_instances')
export class WorkflowInstance {
  /** Short hash identifier, e.g. WFI-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  /** Human-readable hash, e.g. WFI-A1B2 */
  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  /** FK to workflow_definitions.id */
  @Column({ type: 'varchar', name: 'workflow_definition_id', length: 12 })
  @Index()
  workflowDefinitionId!: string;

  /** The type of entity being tracked, e.g. "product_configuration", "document" */
  @Column({ type: 'varchar', name: 'entity_type', length: 255 })
  @Index()
  entityType!: string;

  /** The ID of the entity being tracked */
  @Column({ type: 'varchar', name: 'entity_id', length: 255 })
  @Index()
  entityId!: string;

  /** Current state id, e.g. "draft", "in_review" */
  @Column({ type: 'varchar', name: 'current_state', length: 100 })
  currentState!: string;

  /** Array of WorkflowHistoryEntry */
  @Column({ type: 'jsonb', default: [] })
  history!: WorkflowHistoryEntry[];

  /** User assigned to this instance (U-XXXX) */
  @Column({ type: 'varchar', name: 'assigned_to', length: 12, nullable: true })
  assignedTo!: string | null;

  /** Organization scope (O-XXXX) */
  @Column({ type: 'varchar', name: 'organization_hash_id', length: 12 })
  @Index()
  organizationHashId!: string;

  /** User who created this instance (U-XXXX) */
  @Column({ type: 'varchar', name: 'created_by', length: 12 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

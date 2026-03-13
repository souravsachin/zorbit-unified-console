import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

export enum WidgetType {
  COUNT = 'count',
  CHART = 'chart',
  TABLE = 'table',
  LIST = 'list',
  GAUGE = 'gauge',
}

/**
 * Dashboard widget entity.
 * Each widget is scoped to an organization and can be restricted to specific roles.
 */
@Entity('dashboard_widgets')
export class Widget {
  /** Short hash identifier, e.g. WDG-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: WidgetType;

  /** API path template, e.g. "/api/v1/O/{{org_id}}/customers/count" */
  @Column({ type: 'varchar', name: 'metric_query', length: 500, nullable: true })
  metricQuery!: string | null;

  /** Type-specific configuration (JSONB) */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  config!: Record<string, unknown>;

  /** Role codes that can see this widget */
  @Column({ type: 'text', array: true, default: '{}' })
  roles!: string[];

  @Column({ type: 'int', name: 'position_x', default: 0 })
  positionX!: number;

  @Column({ type: 'int', name: 'position_y', default: 0 })
  positionY!: number;

  @Column({ type: 'int', name: 'position_w', default: 4 })
  positionW!: number;

  @Column({ type: 'int', name: 'position_h', default: 3 })
  positionH!: number;

  /** Organization scope (O-XXXX) */
  @Column({ type: 'varchar', name: 'org_id', length: 12 })
  @Index()
  orgId!: string;

  /** User who created this widget (U-XXXX) */
  @Column({ type: 'varchar', name: 'created_by', length: 12, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

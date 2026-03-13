import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

export enum DemoSegmentType {
  INTERACTIVE = 'interactive',
  VIDEO = 'video',
}

export enum StepAction {
  INFO = 'info',
  NAVIGATE = 'navigate',
  TYPE = 'type',
  CLICK = 'click',
  HIGHLIGHT = 'highlight',
  SCROLL = 'scroll',
  WAIT = 'wait',
}

/**
 * A single step within an interactive demo segment.
 */
export interface DemoStep {
  seq: number;
  action: StepAction;
  target: string;      // CSS selector or route
  value: string;       // text to type, info message, etc.
  delay_ms: number;    // wait duration
  narration: string;   // TTS text
}

/**
 * Demo segment entity.
 * Builtin segments are read-only (cannot be edited or deleted, but can be duplicated).
 */
@Entity('demo_segments')
export class DemoSegment {
  /** Short hash identifier, e.g. DEM-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  /** Duration display string, e.g. "3:00" */
  @Column({ type: 'varchar', length: 20, nullable: true })
  duration!: string | null;

  @Column({ type: 'varchar', length: 50 })
  type!: DemoSegmentType;

  /** If true, segment cannot be edited or deleted (only duplicated) */
  @Column({ type: 'boolean', default: false })
  builtin!: boolean;

  /** Category for filtering, e.g. "onboarding", "admin", "reports" */
  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  category!: string | null;

  /** Steps for interactive segments (JSONB array) */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  steps!: DemoStep[];

  /** Video URL for video-type segments */
  @Column({ type: 'varchar', name: 'video_url', length: 1000, nullable: true })
  videoUrl!: string | null;

  /** Whether TTS narration is enabled */
  @Column({ type: 'boolean', name: 'tts_enabled', default: false })
  ttsEnabled!: boolean;

  /** User who created this segment (U-XXXX) */
  @Column({ type: 'varchar', name: 'created_by', length: 12, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

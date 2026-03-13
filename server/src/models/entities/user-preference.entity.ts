import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

/**
 * User preferences entity.
 * Stores per-user settings as a JSONB object, scoped to org.
 *
 * The preferences object is schemaless — the frontend defines the shape.
 * Backend treats it as an opaque JSON blob to allow rapid iteration
 * on preference keys without migrations.
 *
 * Primary key is the user hashId (one row per user).
 */
@Entity('user_preferences')
export class UserPreference {
  /** User short hash identifier, e.g. U-0113 */
  @PrimaryColumn({ type: 'varchar', length: 12, name: 'user_id' })
  userId!: string;

  /** Organization scope, e.g. O-OZPY */
  @Column({ type: 'varchar', length: 12, name: 'org_id' })
  @Index()
  orgId!: string;

  /**
   * Preferences JSONB object.
   *
   * Expected top-level namespaces (enforced by frontend, not backend):
   *   ui       — sidebar mode, collapsed sections, pinned, theme
   *   locale   — languages (ordered), timezone, dateFormat
   *   a11y     — ttsEngine, ttsVoice, fontSize, contrast
   *   notify   — email, push, inApp preferences
   *   modules  — per-module preferences keyed by module code
   */
  @Column({ type: 'jsonb', default: {} })
  preferences!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

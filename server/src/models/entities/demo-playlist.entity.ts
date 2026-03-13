import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

/**
 * A single entry in a demo playlist, referencing a segment.
 */
export interface PlaylistEntry {
  segment_id: string;  // DEM-XXXX
  seq: number;
  auto_play: boolean;
}

/**
 * Demo playlist entity.
 * Playlists are user-scoped — each user can create their own training playlists.
 */
@Entity('demo_playlists')
export class DemoPlaylist {
  /** Short hash identifier, e.g. DPL-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  /** Ordered list of segment entries (JSONB array) */
  @Column({ type: 'jsonb', default: [] })
  segments!: PlaylistEntry[];

  /** User who created this playlist (U-XXXX) */
  @Column({ type: 'varchar', name: 'created_by', length: 12 })
  @Index()
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

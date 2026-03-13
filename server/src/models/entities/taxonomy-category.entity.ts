import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Taxonomy } from './taxonomy.entity';
import { TaxonomyItem } from './taxonomy-item.entity';

/**
 * A category within a taxonomy.
 * Categories group related taxonomy items together.
 */
@Entity('taxonomy_categories')
export class TaxonomyCategory {
  /** Short hash identifier, e.g. TXC-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  @Column({ type: 'varchar', name: 'taxonomy_id', length: 12 })
  @Index()
  taxonomyId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  /** Optional icon identifier */
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  /** Flexible extra data */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Taxonomy, (taxonomy) => taxonomy.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taxonomy_id' })
  taxonomy!: Taxonomy;

  @OneToMany(() => TaxonomyItem, (item) => item.category, {
    cascade: true,
    eager: false,
  })
  items!: TaxonomyItem[];
}

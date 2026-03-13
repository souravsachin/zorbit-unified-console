import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaxonomyCategory } from './taxonomy-category.entity';

/**
 * An item within a taxonomy category.
 * Items are the leaf-level entries in the taxonomy hierarchy.
 */
@Entity('taxonomy_items')
export class TaxonomyItem {
  /** Short hash identifier, e.g. TXI-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  @Column({ type: 'varchar', name: 'category_id', length: 12 })
  @Index()
  categoryId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  /** Flexible extra data */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => TaxonomyCategory, (category) => category.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category!: TaxonomyCategory;
}

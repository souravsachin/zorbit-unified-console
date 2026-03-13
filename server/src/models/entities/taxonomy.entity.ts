import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TaxonomyCategory } from './taxonomy-category.entity';

export enum TaxonomyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * A taxonomy is a versioned container for hierarchical lookup data.
 * Examples: "Healthcare Encounter Types", "Document Categories".
 * Scoped to an organization for namespace isolation.
 */
@Entity('taxonomies')
export class Taxonomy {
  /** Short hash identifier, e.g. TXN-A1B2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  /** Semantic version, e.g. "1.0.0" */
  @Column({ type: 'varchar', length: 20, default: '1.0.0' })
  version!: string;

  @Column({ type: 'varchar', length: 20, default: TaxonomyStatus.DRAFT })
  status!: TaxonomyStatus;

  /** Organization scope (O-XXXX) */
  @Column({ type: 'varchar', name: 'organization_hash_id', length: 12 })
  @Index()
  organizationHashId!: string;

  /** User who created this taxonomy (U-XXXX) */
  @Column({ type: 'varchar', name: 'created_by', length: 12, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => TaxonomyCategory, (category) => category.taxonomy, {
    cascade: true,
    eager: false,
  })
  categories!: TaxonomyCategory[];
}

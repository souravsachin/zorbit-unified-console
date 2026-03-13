import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ProductPlan } from './product-plan.entity';

export enum ConfigurationStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ConfigurationStage {
  INSURER_DETAILS = 'insurer_details',
  PRODUCT_DETAILS = 'product_details',
  TAXONOMY_SELECTION = 'taxonomy_selection',
  BASE_PLAN_CONFIGURATION = 'base_plan_configuration',
  ENCOUNTER_BENEFITS = 'encounter_benefits',
  REVIEW = 'review',
  PUBLISH = 'publish',
}

/**
 * Shape of a deployment environment entry stored in JSONB.
 */
export interface DeploymentEnvironment {
  env_type: string;        // e.g. "staging", "production", "sandbox"
  env_name: string;
  env_url: string;
  made_live_on: string;    // ISO date string
  made_live_by: string;
  scheduled_expiry?: string;
  status: string;          // "active", "expired", "decommissioned"
}

/**
 * Shape of an edit history entry stored in JSONB.
 */
export interface EditHistoryEntry {
  user_email: string;
  user_name: string;
  user_role: string;
  purpose_of_edit: string;
  received_in_status: string;
  moved_to_status: string;
  date_of_edit: string;    // ISO date string
}

/**
 * PCG4 Product Configuration entity.
 * The main entity representing a healthcare insurance product configuration.
 * Table: pcg4_configurations, ID prefix: PCG-XXXX
 */
@Entity('pcg4_configurations')
export class ProductConfiguration {
  /** Short hash identifier, e.g. PCG-A3F2 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  /** Organization scope (O-XXXX) */
  @Column({ type: 'varchar', name: 'organization_hash_id', length: 12 })
  @Index()
  organizationHashId!: string;

  // ---- Insurer details (Step 1) ----

  @Column({ type: 'varchar', name: 'insurer_name', length: 255, default: '' })
  insurerName!: string;

  @Column({ type: 'varchar', name: 'insurer_description', length: 2000, default: '' })
  insurerDescription!: string;

  @Column({ type: 'varchar', name: 'insurer_internal_code', length: 100, default: '' })
  insurerInternalCode!: string;

  @Column({ type: 'varchar', name: 'insurer_regulator_code', length: 100, default: '' })
  insurerRegulatorCode!: string;

  // ---- Product details (Step 2) ----

  @Column({ type: 'varchar', name: 'product_name', length: 255, default: '' })
  productName!: string;

  @Column({ type: 'varchar', name: 'product_description', length: 2000, default: '' })
  productDescription!: string;

  @Column({ type: 'varchar', name: 'product_internal_code', length: 100, default: '' })
  productInternalCode!: string;

  @Column({ type: 'varchar', name: 'product_regulator_code', length: 100, default: '' })
  productRegulatorCode!: string;

  // ---- Inheritance ----

  @Column({ type: 'varchar', name: 'inherited_from_config_id', length: 12, nullable: true })
  inheritedFromConfigId!: string | null;

  @Column({ type: 'varchar', name: 'inherited_from_plan_id', length: 12, nullable: true })
  inheritedFromPlanId!: string | null;

  // ---- Taxonomy reference ----

  /** Which taxonomy version this config uses (TXN-XXXX or "default") */
  @Column({ type: 'varchar', name: 'taxonomy_id', length: 50, default: 'default' })
  taxonomyId!: string;

  // ---- Workflow ----

  /** Current wizard step */
  @Column({
    type: 'varchar',
    name: 'current_stage',
    length: 50,
    default: ConfigurationStage.INSURER_DETAILS,
  })
  currentStage!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ConfigurationStatus.DRAFT,
  })
  status!: string;

  // ---- Environment deployments (JSONB) ----

  @Column({ type: 'jsonb', name: 'deployments', default: [] })
  deployments!: DeploymentEnvironment[];

  // ---- Audit (JSONB) ----

  @Column({ type: 'jsonb', name: 'edit_history', default: [] })
  editHistory!: EditHistoryEntry[];

  /** User who created this configuration (email or U-XXXX) */
  @Column({ type: 'varchar', name: 'created_by', length: 255, default: '' })
  createdBy!: string;

  /** User who last modified this configuration */
  @Column({ type: 'varchar', name: 'last_modified_by', length: 255, default: '' })
  lastModifiedBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ---- Relations ----

  @OneToMany(() => ProductPlan, (plan) => plan.configuration, {
    cascade: true,
    eager: false,
  })
  plans!: ProductPlan[];
}

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
import { ProductPlan } from './product-plan.entity';

/**
 * Shape of a copay rule stored in JSONB.
 */
export interface CopayRule {
  type: 'fixed' | 'percentage';
  value: number;
}

/**
 * Shape of a coinsurance rule stored in JSONB.
 */
export interface CoinsuranceRule {
  type: 'percentage';
  value: number;
}

/**
 * Shape of a custom parameter for extensibility.
 */
export interface CustomParam {
  name: string;
  value: unknown;
  rule?: string;
  validation?: string;
}

/**
 * Shape of adjudication rules stored in JSONB.
 */
export interface AdjudicationRules {
  rule_bundle_name: string;
  rule_bundle_id: string;
  custom_rules: Array<{ rule_name: string; rule_id: string }>;
}

/**
 * PCG4 Plan Benefit entity.
 * Represents encounter-specific benefit configuration for a plan.
 * Table: pcg4_plan_benefits, ID prefix: BNF-XXXX
 */
@Entity('pcg4_plan_benefits')
export class PlanBenefit {
  /** Short hash identifier, e.g. BNF-92AF */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  /** FK to pcg4_plans */
  @Column({ type: 'varchar', name: 'plan_id', length: 12 })
  @Index()
  planId!: string;

  // ---- Encounter reference ----

  @Column({ type: 'varchar', name: 'encounter_category_id', length: 100 })
  encounterCategoryId!: string;

  @Column({ type: 'varchar', name: 'encounter_category', length: 255 })
  encounterCategory!: string;

  @Column({ type: 'varchar', name: 'encounter_type_id', length: 100 })
  encounterTypeId!: string;

  @Column({ type: 'varchar', name: 'encounter_type', length: 255 })
  encounterType!: string;

  @Column({ type: 'varchar', name: 'encounter_description', length: 2000, default: '' })
  encounterDescription!: string;

  // ---- Coverage ----

  @Column({ type: 'boolean', name: 'is_covered', default: true })
  isCovered!: boolean;

  @Column({ type: 'decimal', name: 'annual_limit', precision: 15, scale: 2, default: 0 })
  annualLimit!: number;

  @Column({ type: 'int', name: 'waiting_period_days', default: 0 })
  waitingPeriodDays!: number;

  // ---- Cost share ----

  /** Copay rule: {type: 'fixed'|'percentage', value: number} */
  @Column({ type: 'jsonb', nullable: true, default: { type: 'fixed', value: 0 } })
  copay!: CopayRule;

  /** Coinsurance rule: {type: 'percentage', value: number} */
  @Column({ type: 'jsonb', nullable: true, default: { type: 'percentage', value: 0 } })
  coinsurance!: CoinsuranceRule;

  @Column({ type: 'boolean', name: 'deductible_applies', default: true })
  deductibleApplies!: boolean;

  // ---- Visit limits ----

  @Column({ type: 'int', name: 'annual_visits', default: 0 })
  annualVisits!: number;

  @Column({ type: 'decimal', name: 'lifetime_limit', precision: 15, scale: 2, default: 0 })
  lifetimeLimit!: number;

  @Column({ type: 'decimal', name: 'per_event_cap', precision: 15, scale: 2, default: 0 })
  perEventCap!: number;

  // ---- Authorization ----

  @Column({ type: 'boolean', name: 'authorization_required', default: false })
  authorizationRequired!: boolean;

  @Column({ type: 'varchar', name: 'authorization_notes', length: 2000, default: '' })
  authorizationNotes!: string;

  // ---- Coding standards ----

  /** Array of coding standard strings, e.g. ["ICD-10", "CPT"] */
  @Column({ type: 'jsonb', name: 'coding_standards', default: ['ICD-10', 'CPT'] })
  codingStandards!: string[];

  // ---- Exclusions ----

  /** Array of exclusion strings */
  @Column({ type: 'jsonb', default: [] })
  exclusions!: string[];

  // ---- Custom parameters (extensibility) ----

  /** Array of {name, value, rule?, validation?} */
  @Column({ type: 'jsonb', name: 'custom_params', default: [] })
  customParams!: CustomParam[];

  // ---- Adjudication rules ----

  /** {rule_bundle_name, rule_bundle_id, custom_rules[]} */
  @Column({ type: 'jsonb', name: 'adjudication_rules', nullable: true, default: null })
  adjudicationRules!: AdjudicationRules | null;

  // ---- Plan-specific overrides (Step 7) ----

  /** Flexible overrides for this specific plan */
  @Column({ type: 'jsonb', nullable: true, default: null })
  overrides!: Record<string, unknown> | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ---- Relations ----

  @ManyToOne(() => ProductPlan, (plan) => plan.benefits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan!: ProductPlan;
}

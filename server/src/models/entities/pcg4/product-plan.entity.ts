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
import { ProductConfiguration } from './product-configuration.entity';
import { PlanBenefit } from './plan-benefit.entity';

/**
 * PCG4 Product Plan entity.
 * Represents a plan tier within a product configuration (e.g. Bronze, Silver, Gold).
 * Table: pcg4_plans, ID prefix: PLN-XXXX
 */
@Entity('pcg4_plans')
export class ProductPlan {
  /** Short hash identifier, e.g. PLN-B8C1 */
  @PrimaryColumn({ type: 'varchar', length: 12 })
  id!: string;

  @Column({ type: 'varchar', name: 'hash_id', length: 12 })
  hashId!: string;

  /** FK to pcg4_configurations */
  @Column({ type: 'varchar', name: 'configuration_id', length: 12 })
  @Index()
  configurationId!: string;

  @Column({ type: 'varchar', name: 'plan_name', length: 255 })
  planName!: string;

  /** Tier level: Bronze, Silver, Gold, Platinum, Basic, Premium, Comprehensive */
  @Column({ type: 'varchar', name: 'plan_tier', length: 50 })
  planTier!: string;

  /** Array of region strings, e.g. ["US", "EU", "APAC"] */
  @Column({ type: 'jsonb', default: [] })
  regions!: string[];

  /** ISO 4217 currency code */
  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency!: string;

  // ---- General rules (Step 4 - Base Plan Configuration) ----

  @Column({ type: 'decimal', name: 'annual_limit', precision: 15, scale: 2, default: 0 })
  annualLimit!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductible!: number;

  @Column({ type: 'decimal', name: 'out_of_pocket_max', precision: 15, scale: 2, default: 0 })
  outOfPocketMax!: number;

  /** In-Network, Out-of-Network, Both */
  @Column({ type: 'varchar', name: 'network_restrictions', length: 50, default: 'Both' })
  networkRestrictions!: string;

  @Column({ type: 'int', name: 'waiting_period_days', default: 0 })
  waitingPeriodDays!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ---- Relations ----

  @ManyToOne(() => ProductConfiguration, (config) => config.plans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration!: ProductConfiguration;

  @OneToMany(() => PlanBenefit, (benefit) => benefit.plan, {
    cascade: true,
    eager: false,
  })
  benefits!: PlanBenefit[];
}

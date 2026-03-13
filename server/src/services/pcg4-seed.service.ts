import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductConfiguration, ConfigurationStatus, ConfigurationStage } from '../models/entities/pcg4/product-configuration.entity';
import { ProductPlan } from '../models/entities/pcg4/product-plan.entity';
import { PlanBenefit, CopayRule, CoinsuranceRule } from '../models/entities/pcg4/plan-benefit.entity';
import { HashIdService } from './hash-id.service';

/**
 * Sample encounter definitions used for seed data.
 * Each entry corresponds to a real encounter type from the taxonomy.
 */
interface SeedEncounter {
  categoryId: string;
  category: string;
  typeId: string;
  type: string;
  description: string;
}

const SEED_ENCOUNTERS: SeedEncounter[] = [
  {
    categoryId: 'ambulatory_outpatient',
    category: 'Ambulatory / Outpatient Encounters',
    typeId: 'primary_care_visits',
    type: 'Primary Care Visits',
    description: 'General practitioner consultations and routine checkups',
  },
  {
    categoryId: 'emergency_encounters',
    category: 'Emergency Encounters',
    typeId: 'emergency_room_visits',
    type: 'Emergency Room (ER / A&E) Visits',
    description: 'Emergency department visits for acute medical conditions',
  },
  {
    categoryId: 'inpatient_hospital',
    category: 'Inpatient / Hospital Encounters',
    typeId: 'medical_admissions',
    type: 'Medical Admissions',
    description: 'Hospital stays for medical treatment and monitoring',
  },
  {
    categoryId: 'ancillary_supportive',
    category: 'Ancillary / Supportive Services',
    typeId: 'diagnostic_imaging',
    type: 'Diagnostic Imaging',
    description: 'X-rays, MRI, CT scans, and other imaging services',
  },
  {
    categoryId: 'ancillary_supportive',
    category: 'Ancillary / Supportive Services',
    typeId: 'pharmacy_encounters',
    type: 'Pharmacy Encounters',
    description: 'Prescription medications and pharmaceutical services',
  },
];

/**
 * Tier-specific benefit parameters for generating realistic seed data.
 */
interface TierProfile {
  planName: string;
  planTier: string;
  annualLimit: number;
  deductible: number;
  outOfPocketMax: number;
  waitingPeriodDays: number;
  benefits: {
    annualLimit: number;
    copay: CopayRule;
    coinsurance: CoinsuranceRule;
    deductibleApplies: boolean;
    annualVisits: number;
    lifetimeLimit: number;
    perEventCap: number;
    authorizationRequired: boolean;
  }[];
}

const TIER_PROFILES: TierProfile[] = [
  {
    planName: 'Bronze Plan',
    planTier: 'Bronze',
    annualLimit: 100000,
    deductible: 5000,
    outOfPocketMax: 15000,
    waitingPeriodDays: 90,
    benefits: [
      // Primary Care
      {
        annualLimit: 5000,
        copay: { type: 'fixed', value: 50 },
        coinsurance: { type: 'percentage', value: 40 },
        deductibleApplies: true,
        annualVisits: 6,
        lifetimeLimit: 250000,
        perEventCap: 500,
        authorizationRequired: false,
      },
      // ER
      {
        annualLimit: 25000,
        copay: { type: 'fixed', value: 500 },
        coinsurance: { type: 'percentage', value: 40 },
        deductibleApplies: true,
        annualVisits: 4,
        lifetimeLimit: 500000,
        perEventCap: 10000,
        authorizationRequired: false,
      },
      // Medical Admission
      {
        annualLimit: 50000,
        copay: { type: 'fixed', value: 1000 },
        coinsurance: { type: 'percentage', value: 40 },
        deductibleApplies: true,
        annualVisits: 2,
        lifetimeLimit: 500000,
        perEventCap: 25000,
        authorizationRequired: true,
      },
      // Diagnostic Imaging
      {
        annualLimit: 5000,
        copay: { type: 'fixed', value: 100 },
        coinsurance: { type: 'percentage', value: 40 },
        deductibleApplies: true,
        annualVisits: 6,
        lifetimeLimit: 100000,
        perEventCap: 2000,
        authorizationRequired: false,
      },
      // Pharmacy
      {
        annualLimit: 5000,
        copay: { type: 'fixed', value: 30 },
        coinsurance: { type: 'percentage', value: 40 },
        deductibleApplies: true,
        annualVisits: 12,
        lifetimeLimit: 100000,
        perEventCap: 500,
        authorizationRequired: false,
      },
    ],
  },
  {
    planName: 'Silver Plan',
    planTier: 'Silver',
    annualLimit: 500000,
    deductible: 2000,
    outOfPocketMax: 8000,
    waitingPeriodDays: 30,
    benefits: [
      // Primary Care
      {
        annualLimit: 15000,
        copay: { type: 'fixed', value: 30 },
        coinsurance: { type: 'percentage', value: 20 },
        deductibleApplies: true,
        annualVisits: 12,
        lifetimeLimit: 500000,
        perEventCap: 1000,
        authorizationRequired: false,
      },
      // ER
      {
        annualLimit: 75000,
        copay: { type: 'fixed', value: 250 },
        coinsurance: { type: 'percentage', value: 20 },
        deductibleApplies: true,
        annualVisits: 6,
        lifetimeLimit: 1000000,
        perEventCap: 25000,
        authorizationRequired: false,
      },
      // Medical Admission
      {
        annualLimit: 200000,
        copay: { type: 'fixed', value: 500 },
        coinsurance: { type: 'percentage', value: 20 },
        deductibleApplies: true,
        annualVisits: 4,
        lifetimeLimit: 1000000,
        perEventCap: 50000,
        authorizationRequired: true,
      },
      // Diagnostic Imaging
      {
        annualLimit: 15000,
        copay: { type: 'fixed', value: 50 },
        coinsurance: { type: 'percentage', value: 20 },
        deductibleApplies: true,
        annualVisits: 12,
        lifetimeLimit: 250000,
        perEventCap: 5000,
        authorizationRequired: false,
      },
      // Pharmacy
      {
        annualLimit: 15000,
        copay: { type: 'fixed', value: 15 },
        coinsurance: { type: 'percentage', value: 20 },
        deductibleApplies: false,
        annualVisits: 24,
        lifetimeLimit: 250000,
        perEventCap: 1000,
        authorizationRequired: false,
      },
    ],
  },
  {
    planName: 'Gold Plan',
    planTier: 'Gold',
    annualLimit: 2000000,
    deductible: 500,
    outOfPocketMax: 3000,
    waitingPeriodDays: 0,
    benefits: [
      // Primary Care
      {
        annualLimit: 50000,
        copay: { type: 'fixed', value: 10 },
        coinsurance: { type: 'percentage', value: 10 },
        deductibleApplies: false,
        annualVisits: 0, // unlimited
        lifetimeLimit: 2000000,
        perEventCap: 2000,
        authorizationRequired: false,
      },
      // ER
      {
        annualLimit: 250000,
        copay: { type: 'fixed', value: 100 },
        coinsurance: { type: 'percentage', value: 10 },
        deductibleApplies: false,
        annualVisits: 0,
        lifetimeLimit: 5000000,
        perEventCap: 100000,
        authorizationRequired: false,
      },
      // Medical Admission
      {
        annualLimit: 1000000,
        copay: { type: 'fixed', value: 200 },
        coinsurance: { type: 'percentage', value: 10 },
        deductibleApplies: false,
        annualVisits: 0,
        lifetimeLimit: 5000000,
        perEventCap: 250000,
        authorizationRequired: false,
      },
      // Diagnostic Imaging
      {
        annualLimit: 50000,
        copay: { type: 'fixed', value: 20 },
        coinsurance: { type: 'percentage', value: 10 },
        deductibleApplies: false,
        annualVisits: 0,
        lifetimeLimit: 1000000,
        perEventCap: 15000,
        authorizationRequired: false,
      },
      // Pharmacy
      {
        annualLimit: 50000,
        copay: { type: 'fixed', value: 5 },
        coinsurance: { type: 'percentage', value: 10 },
        deductibleApplies: false,
        annualVisits: 0,
        lifetimeLimit: 1000000,
        perEventCap: 2000,
        authorizationRequired: false,
      },
    ],
  },
];

/** Well-known seed configuration ID so seeding is idempotent */
const SEED_CONFIG_ID = 'PCG-SEED';

/**
 * Seeds a sample PCG4 product configuration on first boot.
 * Creates "Global Health Standard" with Bronze, Silver, Gold plans.
 * Idempotent: skips if SEED_CONFIG_ID already exists.
 */
@Injectable()
export class Pcg4SeedService implements OnModuleInit {
  private readonly logger = new Logger(Pcg4SeedService.name);

  constructor(
    @InjectRepository(ProductConfiguration)
    private readonly configRepo: Repository<ProductConfiguration>,
    @InjectRepository(ProductPlan)
    private readonly planRepo: Repository<ProductPlan>,
    @InjectRepository(PlanBenefit)
    private readonly benefitRepo: Repository<PlanBenefit>,
    private readonly hashIdService: HashIdService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSampleConfiguration();
  }

  async seedSampleConfiguration(): Promise<void> {
    const existing = await this.configRepo.findOne({
      where: { id: SEED_CONFIG_ID },
    });

    if (existing) {
      this.logger.log('PCG4 sample configuration already exists, skipping seed');
      return;
    }

    this.logger.log('Seeding PCG4 sample configuration: Global Health Standard');

    // 1. Create the configuration
    const config = this.configRepo.create({
      id: SEED_CONFIG_ID,
      hashId: SEED_CONFIG_ID,
      organizationHashId: 'O-SEED',
      insurerName: 'Zorbit Insurance Corp',
      insurerDescription: 'A demonstration insurer for the Zorbit platform product configurator.',
      insurerInternalCode: 'ZIC-001',
      insurerRegulatorCode: 'REG-ZIC-2024',
      productName: 'Global Health Standard v1.0',
      productDescription: 'A comprehensive global health insurance product with Bronze, Silver, and Gold tiers. Designed to demonstrate the full capabilities of the PCG4 configurator.',
      productInternalCode: 'GHS-100',
      productRegulatorCode: 'REG-GHS-2024',
      inheritedFromConfigId: null,
      inheritedFromPlanId: null,
      taxonomyId: 'default',
      currentStage: ConfigurationStage.REVIEW,
      status: ConfigurationStatus.DRAFT,
      deployments: [],
      editHistory: [
        {
          user_email: 'system@zorbit.dev',
          user_name: 'System Seed',
          user_role: 'admin',
          purpose_of_edit: 'Initial seed data creation',
          received_in_status: '',
          moved_to_status: 'draft',
          date_of_edit: new Date().toISOString(),
        },
      ],
      createdBy: 'system@zorbit.dev',
      lastModifiedBy: 'system@zorbit.dev',
    });

    await this.configRepo.save(config);
    this.logger.log(`Created configuration: ${SEED_CONFIG_ID}`);

    // 2. Create plans and benefits for each tier
    for (const tier of TIER_PROFILES) {
      const planId = this.hashIdService.generate('PLN');

      const plan = this.planRepo.create({
        id: planId,
        hashId: planId,
        configurationId: SEED_CONFIG_ID,
        planName: tier.planName,
        planTier: tier.planTier,
        regions: ['Global'],
        currency: 'USD',
        annualLimit: tier.annualLimit,
        deductible: tier.deductible,
        outOfPocketMax: tier.outOfPocketMax,
        networkRestrictions: 'Both',
        waitingPeriodDays: tier.waitingPeriodDays,
      });

      await this.planRepo.save(plan);
      this.logger.log(`  Created plan: ${planId} — ${tier.planName}`);

      // 3. Create benefits for each encounter type
      for (let i = 0; i < SEED_ENCOUNTERS.length; i++) {
        const encounter = SEED_ENCOUNTERS[i];
        const benefitData = tier.benefits[i];
        const benefitId = this.hashIdService.generate('BNF');

        const benefit = this.benefitRepo.create({
          id: benefitId,
          hashId: benefitId,
          planId: planId,
          encounterCategoryId: encounter.categoryId,
          encounterCategory: encounter.category,
          encounterTypeId: encounter.typeId,
          encounterType: encounter.type,
          encounterDescription: encounter.description,
          isCovered: true,
          annualLimit: benefitData.annualLimit,
          waitingPeriodDays: 0,
          copay: benefitData.copay,
          coinsurance: benefitData.coinsurance,
          deductibleApplies: benefitData.deductibleApplies,
          annualVisits: benefitData.annualVisits,
          lifetimeLimit: benefitData.lifetimeLimit,
          perEventCap: benefitData.perEventCap,
          authorizationRequired: benefitData.authorizationRequired,
          authorizationNotes: benefitData.authorizationRequired
            ? 'Pre-authorization required for hospital admissions'
            : '',
          codingStandards: ['ICD-10', 'CPT'],
          exclusions: [],
          customParams: [],
          adjudicationRules: null,
          overrides: null,
          sortOrder: i,
        });

        await this.benefitRepo.save(benefit);
      }

      this.logger.log(`    Seeded ${SEED_ENCOUNTERS.length} benefits for ${tier.planName}`);
    }

    this.logger.log('PCG4 seed complete: 1 configuration, 3 plans, 15 benefits');
  }
}

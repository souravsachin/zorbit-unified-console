import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ProductConfiguration,
  ConfigurationStatus,
  ConfigurationStage,
  EditHistoryEntry,
} from '../models/entities/pcg4/product-configuration.entity';
import { ProductPlan } from '../models/entities/pcg4/product-plan.entity';
import { PlanBenefit } from '../models/entities/pcg4/plan-benefit.entity';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { PCG4Events } from '../events/admin-console.events';
import { CreateConfigurationDto } from '../models/dto/pcg4/create-configuration.dto';
import { UpdateConfigurationStageDto } from '../models/dto/pcg4/update-configuration-stage.dto';

@Injectable()
export class PCG4ConfigurationService {
  private readonly logger = new Logger(PCG4ConfigurationService.name);

  constructor(
    @InjectRepository(ProductConfiguration)
    private readonly configRepo: Repository<ProductConfiguration>,
    @InjectRepository(ProductPlan)
    private readonly planRepo: Repository<ProductPlan>,
    @InjectRepository(PlanBenefit)
    private readonly benefitRepo: Repository<PlanBenefit>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Create a new product configuration in draft status.
   */
  async create(
    orgId: string,
    dto: CreateConfigurationDto,
    createdBy: string,
  ): Promise<ProductConfiguration> {
    const id = this.hashIdService.generate('PCG');

    const initialEdit: EditHistoryEntry = {
      user_email: createdBy,
      user_name: createdBy,
      user_role: '',
      purpose_of_edit: 'Initial creation',
      received_in_status: '',
      moved_to_status: ConfigurationStatus.DRAFT,
      date_of_edit: new Date().toISOString(),
    };

    const config = this.configRepo.create({
      id,
      hashId: id,
      organizationHashId: orgId,
      status: ConfigurationStatus.DRAFT,
      currentStage: ConfigurationStage.INSURER_DETAILS,
      insurerName: dto.insurerName ?? '',
      insurerDescription: dto.insurerDescription ?? '',
      insurerInternalCode: dto.insurerInternalCode ?? '',
      insurerRegulatorCode: dto.insurerRegulatorCode ?? '',
      productName: dto.productName ?? '',
      productDescription: dto.productDescription ?? '',
      productInternalCode: dto.productInternalCode ?? '',
      productRegulatorCode: dto.productRegulatorCode ?? '',
      taxonomyId: dto.taxonomyId ?? 'default',
      inheritedFromConfigId: dto.inheritedFromConfigId ?? null,
      inheritedFromPlanId: dto.inheritedFromPlanId ?? null,
      deployments: [],
      editHistory: [initialEdit],
      createdBy,
      lastModifiedBy: createdBy,
    });

    await this.configRepo.save(config);

    await this.eventPublisher.publish(
      PCG4Events.CONFIGURATION_CREATED,
      'O',
      orgId,
      { configId: config.id, createdBy },
    );

    this.logger.log(`Created PCG4 configuration ${config.id} in org ${orgId}`);
    return config;
  }

  /**
   * List configurations for an organization with optional status filter and pagination.
   */
  async findAll(
    orgId: string,
    filters?: { status?: string; page?: number; limit?: number },
  ): Promise<{ data: ProductConfiguration[]; total: number }> {
    const where: Record<string, any> = { organizationHashId: orgId };
    if (filters?.status) {
      where.status = filters.status;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const [data, total] = await this.configRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  /**
   * Get a single configuration with its plans and benefits (eager load).
   */
  async findOne(orgId: string, configId: string): Promise<ProductConfiguration> {
    const config = await this.configRepo.findOne({
      where: { id: configId, organizationHashId: orgId },
      relations: ['plans', 'plans.benefits'],
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configId} not found in organization ${orgId}`,
      );
    }

    return config;
  }

  /**
   * Update a specific wizard stage's data.
   * Merges the stage data into the configuration and updates currentStage.
   */
  async updateStage(
    orgId: string,
    configId: string,
    dto: UpdateConfigurationStageDto,
    modifiedBy: string,
  ): Promise<ProductConfiguration> {
    const config = await this.configRepo.findOne({
      where: { id: configId, organizationHashId: orgId },
      relations: ['plans', 'plans.benefits'],
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configId} not found in organization ${orgId}`,
      );
    }

    const { stage, data } = dto;
    const previousStage = config.currentStage;

    switch (stage) {
      case ConfigurationStage.INSURER_DETAILS:
        if (data.insurerName !== undefined) config.insurerName = data.insurerName as string;
        if (data.insurerDescription !== undefined) config.insurerDescription = data.insurerDescription as string;
        if (data.insurerInternalCode !== undefined) config.insurerInternalCode = data.insurerInternalCode as string;
        if (data.insurerRegulatorCode !== undefined) config.insurerRegulatorCode = data.insurerRegulatorCode as string;
        break;

      case ConfigurationStage.PRODUCT_DETAILS:
        if (data.productName !== undefined) config.productName = data.productName as string;
        if (data.productDescription !== undefined) config.productDescription = data.productDescription as string;
        if (data.productInternalCode !== undefined) config.productInternalCode = data.productInternalCode as string;
        if (data.productRegulatorCode !== undefined) config.productRegulatorCode = data.productRegulatorCode as string;
        break;

      case ConfigurationStage.TAXONOMY_SELECTION:
        if (data.taxonomyId !== undefined) config.taxonomyId = data.taxonomyId as string;
        break;

      case ConfigurationStage.BASE_PLAN_CONFIGURATION:
        // Update general rules for a specific plan
        if (data.planId) {
          const plan = await this.planRepo.findOne({
            where: { id: data.planId as string, configurationId: configId },
          });
          if (!plan) {
            throw new NotFoundException(`Plan ${data.planId} not found`);
          }
          if (data.annualLimit !== undefined) plan.annualLimit = data.annualLimit as number;
          if (data.deductible !== undefined) plan.deductible = data.deductible as number;
          if (data.outOfPocketMax !== undefined) plan.outOfPocketMax = data.outOfPocketMax as number;
          if (data.networkRestrictions !== undefined) plan.networkRestrictions = data.networkRestrictions as string;
          if (data.waitingPeriodDays !== undefined) plan.waitingPeriodDays = data.waitingPeriodDays as number;
          await this.planRepo.save(plan);
        }
        break;

      case ConfigurationStage.ENCOUNTER_BENEFITS:
        // Create/update PlanBenefit records for selected encounters
        if (data.planId && data.encounters && Array.isArray(data.encounters)) {
          const planId = data.planId as string;
          for (const enc of data.encounters as any[]) {
            const benefitId = this.hashIdService.generate('BNF');
            const benefit = this.benefitRepo.create({
              id: benefitId,
              hashId: benefitId,
              planId,
              encounterCategoryId: enc.encounterCategoryId ?? '',
              encounterCategory: enc.encounterCategory ?? '',
              encounterTypeId: enc.encounterTypeId ?? '',
              encounterType: enc.encounterType ?? '',
              encounterDescription: enc.encounterDescription ?? '',
              isCovered: true,
            });
            await this.benefitRepo.save(benefit);
          }
        }
        // Bulk update benefits
        if (data.benefits && Array.isArray(data.benefits)) {
          for (const benefitData of data.benefits as any[]) {
            if (benefitData.id) {
              const benefit = await this.benefitRepo.findOne({
                where: { id: benefitData.id },
              });
              if (benefit) {
                this.mergeBenefitData(benefit, benefitData);
                await this.benefitRepo.save(benefit);
              }
            }
          }
        }
        break;

      case ConfigurationStage.REVIEW:
      case ConfigurationStage.PUBLISH:
        // Optionally change status
        if (dto.status) {
          const validStatuses = Object.values(ConfigurationStatus);
          if (!validStatuses.includes(dto.status as ConfigurationStatus)) {
            throw new BadRequestException(`Invalid status: ${dto.status}`);
          }
          config.status = dto.status;
        }
        break;

      default:
        throw new BadRequestException(`Unknown stage: ${stage}`);
    }

    // Update current stage and audit trail
    config.currentStage = stage;
    config.lastModifiedBy = modifiedBy;

    const editEntry: EditHistoryEntry = {
      user_email: modifiedBy,
      user_name: modifiedBy,
      user_role: '',
      purpose_of_edit: dto.purposeOfEdit ?? `Updated ${stage} stage`,
      received_in_status: previousStage,
      moved_to_status: stage,
      date_of_edit: new Date().toISOString(),
    };
    config.editHistory = [...(config.editHistory ?? []), editEntry];

    await this.configRepo.save(config);

    await this.eventPublisher.publish(
      PCG4Events.CONFIGURATION_STAGE_UPDATED,
      'O',
      orgId,
      { configId: config.id, stage, modifiedBy },
    );

    this.logger.log(`Updated stage ${stage} for configuration ${config.id}`);

    // Reload with relations
    return this.findOne(orgId, configId);
  }

  /**
   * Delete a configuration. Only draft configurations can be deleted.
   */
  async delete(orgId: string, configId: string): Promise<void> {
    const config = await this.configRepo.findOne({
      where: { id: configId, organizationHashId: orgId },
      relations: ['plans', 'plans.benefits'],
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configId} not found in organization ${orgId}`,
      );
    }

    if (config.status !== ConfigurationStatus.DRAFT) {
      throw new BadRequestException('Only draft configurations can be deleted');
    }

    // Delete benefits and plans first (cascade should handle but being explicit)
    for (const plan of config.plans ?? []) {
      await this.benefitRepo.delete({ planId: plan.id });
    }
    await this.planRepo.delete({ configurationId: configId });
    await this.configRepo.remove(config);

    await this.eventPublisher.publish(
      PCG4Events.CONFIGURATION_DELETED,
      'O',
      orgId,
      { configId },
    );

    this.logger.log(`Deleted configuration ${configId} from org ${orgId}`);
  }

  /**
   * Get configurations that can be used as templates (approved, published, or draft).
   */
  async getTemplates(orgId: string): Promise<ProductConfiguration[]> {
    return this.configRepo.find({
      where: [
        { organizationHashId: orgId, status: ConfigurationStatus.APPROVED },
        { organizationHashId: orgId, status: ConfigurationStatus.PUBLISHED },
        { organizationHashId: orgId, status: ConfigurationStatus.DRAFT },
      ],
      relations: ['plans'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Deep clone a configuration (or a single plan from it) into a new draft.
   */
  async cloneFromTemplate(
    orgId: string,
    sourceConfigId: string,
    sourcePlanId: string | undefined,
    createdBy: string,
  ): Promise<ProductConfiguration> {
    const source = await this.configRepo.findOne({
      where: { id: sourceConfigId },
      relations: ['plans', 'plans.benefits'],
    });

    if (!source) {
      throw new NotFoundException(
        `Source configuration ${sourceConfigId} not found`,
      );
    }

    // Create new config
    const newConfigId = this.hashIdService.generate('PCG');

    const initialEdit: EditHistoryEntry = {
      user_email: createdBy,
      user_name: createdBy,
      user_role: '',
      purpose_of_edit: sourcePlanId
        ? `Cloned from config ${sourceConfigId}, plan ${sourcePlanId}`
        : `Cloned from config ${sourceConfigId}`,
      received_in_status: '',
      moved_to_status: ConfigurationStatus.DRAFT,
      date_of_edit: new Date().toISOString(),
    };

    const newConfig = this.configRepo.create({
      id: newConfigId,
      hashId: newConfigId,
      organizationHashId: orgId,
      status: ConfigurationStatus.DRAFT,
      currentStage: ConfigurationStage.INSURER_DETAILS,
      insurerName: source.insurerName,
      insurerDescription: source.insurerDescription,
      insurerInternalCode: source.insurerInternalCode,
      insurerRegulatorCode: source.insurerRegulatorCode,
      productName: source.productName,
      productDescription: source.productDescription,
      productInternalCode: source.productInternalCode,
      productRegulatorCode: source.productRegulatorCode,
      taxonomyId: source.taxonomyId,
      inheritedFromConfigId: sourceConfigId,
      inheritedFromPlanId: sourcePlanId ?? null,
      deployments: [],
      editHistory: [initialEdit],
      createdBy,
      lastModifiedBy: createdBy,
    });

    await this.configRepo.save(newConfig);

    // Determine which plans to clone
    const plansToClone = sourcePlanId
      ? (source.plans ?? []).filter((p) => p.id === sourcePlanId)
      : source.plans ?? [];

    for (const sourcePlan of plansToClone) {
      const newPlanId = this.hashIdService.generate('PLN');
      const newPlan = this.planRepo.create({
        id: newPlanId,
        hashId: newPlanId,
        configurationId: newConfigId,
        planName: sourcePlan.planName,
        planTier: sourcePlan.planTier,
        regions: [...sourcePlan.regions],
        currency: sourcePlan.currency,
        annualLimit: sourcePlan.annualLimit,
        deductible: sourcePlan.deductible,
        outOfPocketMax: sourcePlan.outOfPocketMax,
        networkRestrictions: sourcePlan.networkRestrictions,
        waitingPeriodDays: sourcePlan.waitingPeriodDays,
      });

      await this.planRepo.save(newPlan);

      // Clone benefits
      for (const sourceBenefit of sourcePlan.benefits ?? []) {
        const newBenefitId = this.hashIdService.generate('BNF');
        const newBenefit = this.benefitRepo.create({
          id: newBenefitId,
          hashId: newBenefitId,
          planId: newPlanId,
          encounterCategoryId: sourceBenefit.encounterCategoryId,
          encounterCategory: sourceBenefit.encounterCategory,
          encounterTypeId: sourceBenefit.encounterTypeId,
          encounterType: sourceBenefit.encounterType,
          encounterDescription: sourceBenefit.encounterDescription,
          isCovered: sourceBenefit.isCovered,
          annualLimit: sourceBenefit.annualLimit,
          waitingPeriodDays: sourceBenefit.waitingPeriodDays,
          copay: sourceBenefit.copay ? { ...sourceBenefit.copay } : { type: 'fixed', value: 0 },
          coinsurance: sourceBenefit.coinsurance ? { ...sourceBenefit.coinsurance } : { type: 'percentage', value: 0 },
          deductibleApplies: sourceBenefit.deductibleApplies,
          annualVisits: sourceBenefit.annualVisits,
          lifetimeLimit: sourceBenefit.lifetimeLimit,
          perEventCap: sourceBenefit.perEventCap,
          authorizationRequired: sourceBenefit.authorizationRequired,
          authorizationNotes: sourceBenefit.authorizationNotes,
          exclusions: [...(sourceBenefit.exclusions ?? [])],
          codingStandards: [...(sourceBenefit.codingStandards ?? [])],
          customParams: sourceBenefit.customParams ? [...sourceBenefit.customParams] : [],
          adjudicationRules: sourceBenefit.adjudicationRules
            ? { ...sourceBenefit.adjudicationRules }
            : null,
          overrides: sourceBenefit.overrides ? { ...sourceBenefit.overrides } : null,
          sortOrder: sourceBenefit.sortOrder,
        });
        await this.benefitRepo.save(newBenefit);
      }
    }

    await this.eventPublisher.publish(
      PCG4Events.CONFIGURATION_CLONED,
      'O',
      orgId,
      { configId: newConfigId, sourceConfigId, sourcePlanId, createdBy },
    );

    this.logger.log(
      `Cloned configuration ${sourceConfigId} -> ${newConfigId}`,
    );

    return this.findOne(orgId, newConfigId);
  }

  /**
   * Helper: merge partial benefit data onto a PlanBenefit entity.
   */
  private mergeBenefitData(benefit: PlanBenefit, data: any): void {
    if (data.isCovered !== undefined) benefit.isCovered = data.isCovered;
    if (data.annualLimit !== undefined) benefit.annualLimit = data.annualLimit;
    if (data.waitingPeriodDays !== undefined) benefit.waitingPeriodDays = data.waitingPeriodDays;
    if (data.copay !== undefined) benefit.copay = data.copay;
    if (data.coinsurance !== undefined) benefit.coinsurance = data.coinsurance;
    if (data.deductibleApplies !== undefined) benefit.deductibleApplies = data.deductibleApplies;
    if (data.annualVisits !== undefined) benefit.annualVisits = data.annualVisits;
    if (data.lifetimeLimit !== undefined) benefit.lifetimeLimit = data.lifetimeLimit;
    if (data.perEventCap !== undefined) benefit.perEventCap = data.perEventCap;
    if (data.authorizationRequired !== undefined) benefit.authorizationRequired = data.authorizationRequired;
    if (data.authorizationNotes !== undefined) benefit.authorizationNotes = data.authorizationNotes;
    if (data.exclusions !== undefined) benefit.exclusions = data.exclusions;
    if (data.codingStandards !== undefined) benefit.codingStandards = data.codingStandards;
    if (data.customParams !== undefined) benefit.customParams = data.customParams;
    if (data.adjudicationRules !== undefined) benefit.adjudicationRules = data.adjudicationRules;
    if (data.overrides !== undefined) benefit.overrides = data.overrides;
    if (data.sortOrder !== undefined) benefit.sortOrder = data.sortOrder;
  }
}

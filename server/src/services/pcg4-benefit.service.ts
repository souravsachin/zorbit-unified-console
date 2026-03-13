import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanBenefit } from '../models/entities/pcg4/plan-benefit.entity';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { PCG4Events } from '../events/admin-console.events';
import { CreatePlanBenefitDto } from '../models/dto/pcg4/create-plan-benefit.dto';
import { UpdatePlanBenefitDto } from '../models/dto/pcg4/update-plan-benefit.dto';

@Injectable()
export class PCG4BenefitService {
  private readonly logger = new Logger(PCG4BenefitService.name);

  constructor(
    @InjectRepository(PlanBenefit)
    private readonly benefitRepo: Repository<PlanBenefit>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Set benefits for a plan by creating benefit records for selected encounters.
   * Accepts an array of CreatePlanBenefitDto. Each becomes a new PlanBenefit row.
   */
  async setBenefits(
    orgId: string,
    planId: string,
    dtos: CreatePlanBenefitDto[],
  ): Promise<PlanBenefit[]> {
    // Remove existing benefits for this plan so we replace them cleanly
    await this.benefitRepo.delete({ planId });

    const benefits: PlanBenefit[] = [];

    for (const dto of dtos) {
      const id = this.hashIdService.generate('BNF');
      const benefit = this.benefitRepo.create({
        id,
        hashId: id,
        planId,
        encounterCategoryId: dto.encounterCategoryId,
        encounterCategory: dto.encounterCategory,
        encounterTypeId: dto.encounterTypeId,
        encounterType: dto.encounterType,
        encounterDescription: dto.encounterDescription ?? '',
        isCovered: dto.isCovered ?? true,
        annualLimit: dto.annualLimit ?? 0,
        waitingPeriodDays: dto.waitingPeriodDays ?? 0,
        copay: dto.copay ?? { type: 'fixed', value: 0 },
        coinsurance: dto.coinsurance ?? { type: 'percentage', value: 0 },
        deductibleApplies: dto.deductibleApplies ?? true,
        annualVisits: dto.annualVisits ?? 0,
        lifetimeLimit: dto.lifetimeLimit ?? 0,
        perEventCap: dto.perEventCap ?? 0,
        authorizationRequired: dto.authorizationRequired ?? false,
        authorizationNotes: dto.authorizationNotes ?? '',
        codingStandards: dto.codingStandards ?? ['ICD-10', 'CPT'],
        exclusions: dto.exclusions ?? [],
        customParams: dto.customParams ?? [],
        adjudicationRules: dto.adjudicationRules ?? null,
        overrides: dto.overrides ?? null,
        sortOrder: dto.sortOrder ?? 0,
      });

      await this.benefitRepo.save(benefit);
      benefits.push(benefit);
    }

    await this.eventPublisher.publish(
      PCG4Events.BENEFIT_UPDATED,
      'O',
      orgId,
      { planId, benefitCount: benefits.length, action: 'set' },
    );

    this.logger.log(`Set ${benefits.length} benefits for plan ${planId}`);
    return benefits;
  }

  /**
   * Update a specific benefit record.
   */
  async updateBenefit(
    orgId: string,
    benefitId: string,
    dto: UpdatePlanBenefitDto,
  ): Promise<PlanBenefit> {
    const benefit = await this.benefitRepo.findOne({
      where: { id: benefitId },
    });

    if (!benefit) {
      throw new NotFoundException(`Benefit ${benefitId} not found`);
    }

    if (dto.isCovered !== undefined) benefit.isCovered = dto.isCovered;
    if (dto.annualLimit !== undefined) benefit.annualLimit = dto.annualLimit;
    if (dto.waitingPeriodDays !== undefined) benefit.waitingPeriodDays = dto.waitingPeriodDays;
    if (dto.copay !== undefined) benefit.copay = dto.copay;
    if (dto.coinsurance !== undefined) benefit.coinsurance = dto.coinsurance;
    if (dto.deductibleApplies !== undefined) benefit.deductibleApplies = dto.deductibleApplies;
    if (dto.annualVisits !== undefined) benefit.annualVisits = dto.annualVisits;
    if (dto.lifetimeLimit !== undefined) benefit.lifetimeLimit = dto.lifetimeLimit;
    if (dto.perEventCap !== undefined) benefit.perEventCap = dto.perEventCap;
    if (dto.authorizationRequired !== undefined) benefit.authorizationRequired = dto.authorizationRequired;
    if (dto.authorizationNotes !== undefined) benefit.authorizationNotes = dto.authorizationNotes;
    if (dto.codingStandards !== undefined) benefit.codingStandards = dto.codingStandards;
    if (dto.exclusions !== undefined) benefit.exclusions = dto.exclusions;
    if (dto.customParams !== undefined) benefit.customParams = dto.customParams;
    if (dto.adjudicationRules !== undefined) benefit.adjudicationRules = dto.adjudicationRules;
    if (dto.overrides !== undefined) benefit.overrides = dto.overrides;
    if (dto.sortOrder !== undefined) benefit.sortOrder = dto.sortOrder;
    if (dto.encounterDescription !== undefined) benefit.encounterDescription = dto.encounterDescription;

    await this.benefitRepo.save(benefit);

    await this.eventPublisher.publish(
      PCG4Events.BENEFIT_UPDATED,
      'O',
      orgId,
      { benefitId: benefit.id, planId: benefit.planId, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated benefit ${benefit.id}`);
    return benefit;
  }

  /**
   * Get all benefits for a plan.
   */
  async getBenefitsByPlan(planId: string): Promise<PlanBenefit[]> {
    return this.benefitRepo.find({
      where: { planId },
      order: { sortOrder: 'ASC', encounterCategory: 'ASC', encounterType: 'ASC' },
    });
  }
}

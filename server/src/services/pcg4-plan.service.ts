import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPlan } from '../models/entities/pcg4/product-plan.entity';
import { PlanBenefit } from '../models/entities/pcg4/plan-benefit.entity';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { PCG4Events } from '../events/admin-console.events';
import { CreatePlanDto } from '../models/dto/pcg4/create-plan.dto';
import { UpdatePlanDto } from '../models/dto/pcg4/update-plan.dto';

@Injectable()
export class PCG4PlanService {
  private readonly logger = new Logger(PCG4PlanService.name);

  constructor(
    @InjectRepository(ProductPlan)
    private readonly planRepo: Repository<ProductPlan>,
    @InjectRepository(PlanBenefit)
    private readonly benefitRepo: Repository<PlanBenefit>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Create a new plan under a configuration.
   */
  async createPlan(
    orgId: string,
    configId: string,
    dto: CreatePlanDto,
  ): Promise<ProductPlan> {
    const id = this.hashIdService.generate('PLN');

    const plan = this.planRepo.create({
      id,
      hashId: id,
      configurationId: configId,
      planName: dto.planName,
      planTier: dto.planTier,
      regions: dto.regions ?? [],
      currency: dto.currency ?? 'USD',
      annualLimit: dto.annualLimit ?? 0,
      deductible: dto.deductible ?? 0,
      outOfPocketMax: dto.outOfPocketMax ?? 0,
      networkRestrictions: dto.networkRestrictions ?? 'Both',
      waitingPeriodDays: dto.waitingPeriodDays ?? 0,
    });

    await this.planRepo.save(plan);

    await this.eventPublisher.publish(
      PCG4Events.PLAN_CREATED,
      'O',
      orgId,
      { planId: plan.id, configId, planName: plan.planName },
    );

    this.logger.log(`Created plan ${plan.id} for config ${configId}`);
    return plan;
  }

  /**
   * Update a plan.
   */
  async updatePlan(
    orgId: string,
    configId: string,
    planId: string,
    dto: UpdatePlanDto,
  ): Promise<ProductPlan> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, configurationId: configId },
    });

    if (!plan) {
      throw new NotFoundException(
        `Plan ${planId} not found in configuration ${configId}`,
      );
    }

    if (dto.planName !== undefined) plan.planName = dto.planName;
    if (dto.planTier !== undefined) plan.planTier = dto.planTier;
    if (dto.regions !== undefined) plan.regions = dto.regions;
    if (dto.currency !== undefined) plan.currency = dto.currency;
    if (dto.annualLimit !== undefined) plan.annualLimit = dto.annualLimit;
    if (dto.deductible !== undefined) plan.deductible = dto.deductible;
    if (dto.outOfPocketMax !== undefined) plan.outOfPocketMax = dto.outOfPocketMax;
    if (dto.networkRestrictions !== undefined) plan.networkRestrictions = dto.networkRestrictions;
    if (dto.waitingPeriodDays !== undefined) plan.waitingPeriodDays = dto.waitingPeriodDays;

    await this.planRepo.save(plan);

    await this.eventPublisher.publish(
      PCG4Events.PLAN_UPDATED,
      'O',
      orgId,
      { planId: plan.id, configId, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated plan ${plan.id} in config ${configId}`);
    return plan;
  }

  /**
   * Delete a plan and its benefits.
   */
  async deletePlan(
    orgId: string,
    configId: string,
    planId: string,
  ): Promise<void> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, configurationId: configId },
    });

    if (!plan) {
      throw new NotFoundException(
        `Plan ${planId} not found in configuration ${configId}`,
      );
    }

    // Delete benefits first, then the plan
    await this.benefitRepo.delete({ planId });
    await this.planRepo.remove(plan);

    this.logger.log(`Deleted plan ${planId} from config ${configId}`);
  }

  /**
   * List all plans for a configuration with their benefits.
   */
  async findPlansByConfig(configId: string): Promise<ProductPlan[]> {
    return this.planRepo.find({
      where: { configurationId: configId },
      relations: ['benefits'],
      order: { createdAt: 'ASC' },
    });
  }
}

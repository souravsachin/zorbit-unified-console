import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductConfiguration } from '../models/entities/pcg4/product-configuration.entity';
import { ProductPlan } from '../models/entities/pcg4/product-plan.entity';
import { PlanBenefit } from '../models/entities/pcg4/plan-benefit.entity';
import { PCG4ConfigurationController } from '../controllers/pcg4-configuration.controller';
import { PCG4ConfigurationService } from '../services/pcg4-configuration.service';
import { PCG4PlanService } from '../services/pcg4-plan.service';
import { PCG4BenefitService } from '../services/pcg4-benefit.service';
import { HashIdService } from '../services/hash-id.service';
import { EventsModule } from './events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductConfiguration, ProductPlan, PlanBenefit]),
    EventsModule,
  ],
  controllers: [PCG4ConfigurationController],
  providers: [
    PCG4ConfigurationService,
    PCG4PlanService,
    PCG4BenefitService,
    HashIdService,
  ],
  exports: [PCG4ConfigurationService, PCG4PlanService, PCG4BenefitService],
})
export class PCG4Module {}

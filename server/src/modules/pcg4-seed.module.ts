import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductConfiguration } from '../models/entities/pcg4/product-configuration.entity';
import { ProductPlan } from '../models/entities/pcg4/product-plan.entity';
import { PlanBenefit } from '../models/entities/pcg4/plan-benefit.entity';
import { Pcg4SeedService } from '../services/pcg4-seed.service';
import { HashIdService } from '../services/hash-id.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductConfiguration, ProductPlan, PlanBenefit]),
  ],
  providers: [Pcg4SeedService, HashIdService],
})
export class Pcg4SeedModule {}

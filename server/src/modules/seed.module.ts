import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoSegment } from '../models/entities/demo-segment.entity';
import { WorkflowDefinition } from '../models/entities/workflow.entity';
import { Taxonomy } from '../models/entities/taxonomy.entity';
import { TaxonomyCategory } from '../models/entities/taxonomy-category.entity';
import { TaxonomyItem } from '../models/entities/taxonomy-item.entity';
import { SeedService } from '../seed/seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([DemoSegment, WorkflowDefinition, Taxonomy, TaxonomyCategory, TaxonomyItem])],
  providers: [SeedService],
})
export class SeedModule {}

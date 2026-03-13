import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxonomyController } from '../controllers/taxonomy.controller';
import { TaxonomyService } from '../services/taxonomy.service';
import { HashIdService } from '../services/hash-id.service';
import { Taxonomy } from '../models/entities/taxonomy.entity';
import { TaxonomyCategory } from '../models/entities/taxonomy-category.entity';
import { TaxonomyItem } from '../models/entities/taxonomy-item.entity';
import { EventsModule } from './events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Taxonomy, TaxonomyCategory, TaxonomyItem]),
    EventsModule,
  ],
  controllers: [TaxonomyController],
  providers: [TaxonomyService, HashIdService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}

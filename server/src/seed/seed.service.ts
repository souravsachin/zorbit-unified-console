import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemoSegment } from '../models/entities/demo-segment.entity';
import { WorkflowDefinition } from '../models/entities/workflow.entity';
import { Taxonomy } from '../models/entities/taxonomy.entity';
import { TaxonomyCategory } from '../models/entities/taxonomy-category.entity';
import { TaxonomyItem } from '../models/entities/taxonomy-item.entity';
import { builtinSegments } from './builtin-segments';
import { builtinWorkflowDefinitions } from './builtin-workflows';
import { builtinTaxonomies } from './builtin-taxonomies';

/**
 * Seeds builtin demo segments, workflow definitions, and taxonomies on first boot.
 * Only inserts records that don't already exist (idempotent).
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(DemoSegment)
    private readonly segmentRepository: Repository<DemoSegment>,
    @InjectRepository(WorkflowDefinition)
    private readonly workflowDefinitionRepository: Repository<WorkflowDefinition>,
    @InjectRepository(Taxonomy)
    private readonly taxonomyRepository: Repository<Taxonomy>,
    @InjectRepository(TaxonomyCategory)
    private readonly taxonomyCategoryRepository: Repository<TaxonomyCategory>,
    @InjectRepository(TaxonomyItem)
    private readonly taxonomyItemRepository: Repository<TaxonomyItem>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedBuiltinSegments();
    await this.seedBuiltinWorkflows();
    await this.seedBuiltinTaxonomies();
  }

  async seedBuiltinSegments(): Promise<void> {
    let inserted = 0;

    for (const seed of builtinSegments) {
      const existing = await this.segmentRepository.findOne({
        where: { id: seed.id },
      });

      if (!existing) {
        const segment = this.segmentRepository.create({
          ...seed,
          createdBy: null,
        });
        await this.segmentRepository.save(segment);
        inserted++;
        this.logger.log(`Seeded builtin segment: ${seed.id} — ${seed.title}`);
      }
    }

    if (inserted > 0) {
      this.logger.log(`Seeded ${inserted} builtin demo segments`);
    } else {
      this.logger.log('All builtin demo segments already exist, skipping seed');
    }
  }

  async seedBuiltinWorkflows(): Promise<void> {
    let inserted = 0;

    for (const seed of builtinWorkflowDefinitions) {
      const existing = await this.workflowDefinitionRepository.findOne({
        where: { id: seed.id },
      });

      if (!existing) {
        const definition = this.workflowDefinitionRepository.create(seed);
        await this.workflowDefinitionRepository.save(definition);
        inserted++;
        this.logger.log(`Seeded builtin workflow: ${seed.id} — ${seed.name}`);
      }
    }

    if (inserted > 0) {
      this.logger.log(`Seeded ${inserted} builtin workflow definitions`);
    } else {
      this.logger.log('All builtin workflow definitions already exist, skipping seed');
    }
  }

  async seedBuiltinTaxonomies(): Promise<void> {
    let taxonomiesInserted = 0;
    let categoriesInserted = 0;
    let itemsInserted = 0;

    for (const seedTax of builtinTaxonomies) {
      const existing = await this.taxonomyRepository.findOne({
        where: { id: seedTax.id },
      });

      if (!existing) {
        const taxonomy = this.taxonomyRepository.create({
          id: seedTax.id,
          hashId: seedTax.hashId,
          name: seedTax.name,
          description: seedTax.description,
          version: seedTax.version,
          status: seedTax.status as any,
          organizationHashId: seedTax.organizationHashId,
          createdBy: seedTax.createdBy,
        });
        await this.taxonomyRepository.save(taxonomy);
        taxonomiesInserted++;
        this.logger.log(`Seeded taxonomy: ${seedTax.id} — ${seedTax.name}`);

        for (const seedCat of seedTax.categories) {
          const category = this.taxonomyCategoryRepository.create({
            id: seedCat.id,
            hashId: seedCat.hashId,
            taxonomyId: seedCat.taxonomyId,
            name: seedCat.name,
            description: seedCat.description,
            sortOrder: seedCat.sortOrder,
            icon: seedCat.icon,
            metadata: seedCat.metadata,
          });
          await this.taxonomyCategoryRepository.save(category);
          categoriesInserted++;

          for (const seedItem of seedCat.items) {
            const item = this.taxonomyItemRepository.create({
              id: seedItem.id,
              hashId: seedItem.hashId,
              categoryId: seedItem.categoryId,
              name: seedItem.name,
              description: seedItem.description,
              sortOrder: seedItem.sortOrder,
              isActive: seedItem.isActive,
              metadata: seedItem.metadata,
            });
            await this.taxonomyItemRepository.save(item);
            itemsInserted++;
          }
        }
      }
    }

    if (taxonomiesInserted > 0) {
      this.logger.log(`Seeded ${taxonomiesInserted} taxonomies, ${categoriesInserted} categories, ${itemsInserted} items`);
    } else {
      this.logger.log('All builtin taxonomies already exist, skipping seed');
    }
  }
}

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxonomy, TaxonomyStatus } from '../models/entities/taxonomy.entity';
import { TaxonomyCategory } from '../models/entities/taxonomy-category.entity';
import { TaxonomyItem } from '../models/entities/taxonomy-item.entity';
import { CreateTaxonomyDto } from '../models/dto/create-taxonomy.dto';
import { UpdateTaxonomyDto } from '../models/dto/update-taxonomy.dto';
import { CreateTaxonomyCategoryDto, UpdateTaxonomyCategoryDto } from '../models/dto/create-taxonomy-category.dto';
import { CreateTaxonomyItemDto, UpdateTaxonomyItemDto } from '../models/dto/create-taxonomy-item.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { TaxonomyEvents } from '../events/admin-console.events';

@Injectable()
export class TaxonomyService {
  private readonly logger = new Logger(TaxonomyService.name);

  constructor(
    @InjectRepository(Taxonomy)
    private readonly taxonomyRepository: Repository<Taxonomy>,
    @InjectRepository(TaxonomyCategory)
    private readonly categoryRepository: Repository<TaxonomyCategory>,
    @InjectRepository(TaxonomyItem)
    private readonly itemRepository: Repository<TaxonomyItem>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  // ─── Taxonomy CRUD ──────────────────────────────────────────────

  async createTaxonomy(
    orgId: string,
    dto: CreateTaxonomyDto,
    createdBy: string,
  ): Promise<Taxonomy> {
    const id = this.hashIdService.generate('TXN');

    const taxonomy = this.taxonomyRepository.create({
      id,
      hashId: id,
      name: dto.name,
      description: dto.description ?? null,
      version: dto.version ?? '1.0.0',
      status: dto.status ?? TaxonomyStatus.DRAFT,
      organizationHashId: orgId,
      createdBy,
    });

    await this.taxonomyRepository.save(taxonomy);

    await this.eventPublisher.publish(
      TaxonomyEvents.TAXONOMY_CREATED,
      'O',
      orgId,
      { taxonomyId: taxonomy.id, name: taxonomy.name },
    );

    this.logger.log(`Created taxonomy ${taxonomy.id} — ${taxonomy.name}`);
    return taxonomy;
  }

  async findAll(orgId: string): Promise<Taxonomy[]> {
    return this.taxonomyRepository.find({
      where: { organizationHashId: orgId },
      order: { name: 'ASC', version: 'DESC' },
    });
  }

  async findOne(orgId: string, taxonomyId: string): Promise<Taxonomy> {
    const taxonomy = await this.taxonomyRepository.findOne({
      where: { id: taxonomyId, organizationHashId: orgId },
      relations: ['categories', 'categories.items'],
    });

    if (!taxonomy) {
      throw new NotFoundException(`Taxonomy ${taxonomyId} not found`);
    }

    // Sort categories and items by sortOrder
    if (taxonomy.categories) {
      taxonomy.categories.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const cat of taxonomy.categories) {
        if (cat.items) {
          cat.items.sort((a, b) => a.sortOrder - b.sortOrder);
        }
      }
    }

    return taxonomy;
  }

  async findByName(orgId: string, name: string): Promise<Taxonomy | null> {
    return this.taxonomyRepository.findOne({
      where: { organizationHashId: orgId, name, status: TaxonomyStatus.ACTIVE },
      relations: ['categories', 'categories.items'],
    });
  }

  async update(
    orgId: string,
    taxonomyId: string,
    dto: UpdateTaxonomyDto,
  ): Promise<Taxonomy> {
    const taxonomy = await this.taxonomyRepository.findOne({
      where: { id: taxonomyId, organizationHashId: orgId },
    });

    if (!taxonomy) {
      throw new NotFoundException(`Taxonomy ${taxonomyId} not found`);
    }

    if (dto.name !== undefined) taxonomy.name = dto.name;
    if (dto.description !== undefined) taxonomy.description = dto.description ?? null;
    if (dto.version !== undefined) taxonomy.version = dto.version;
    if (dto.status !== undefined) taxonomy.status = dto.status;

    await this.taxonomyRepository.save(taxonomy);

    await this.eventPublisher.publish(
      TaxonomyEvents.TAXONOMY_UPDATED,
      'O',
      orgId,
      { taxonomyId: taxonomy.id, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated taxonomy ${taxonomy.id}`);
    return taxonomy;
  }

  async remove(orgId: string, taxonomyId: string): Promise<void> {
    const taxonomy = await this.taxonomyRepository.findOne({
      where: { id: taxonomyId, organizationHashId: orgId },
    });

    if (!taxonomy) {
      throw new NotFoundException(`Taxonomy ${taxonomyId} not found`);
    }

    await this.taxonomyRepository.remove(taxonomy);

    await this.eventPublisher.publish(
      TaxonomyEvents.TAXONOMY_DELETED,
      'O',
      orgId,
      { taxonomyId },
    );

    this.logger.log(`Deleted taxonomy ${taxonomyId}`);
  }

  /**
   * Activate a taxonomy version.
   * Archives any previously active taxonomy with the same name.
   */
  async activateTaxonomy(orgId: string, taxonomyId: string): Promise<Taxonomy> {
    const taxonomy = await this.taxonomyRepository.findOne({
      where: { id: taxonomyId, organizationHashId: orgId },
    });

    if (!taxonomy) {
      throw new NotFoundException(`Taxonomy ${taxonomyId} not found`);
    }

    // Archive any currently active taxonomy with the same name
    const currentlyActive = await this.taxonomyRepository.find({
      where: {
        organizationHashId: orgId,
        name: taxonomy.name,
        status: TaxonomyStatus.ACTIVE,
      },
    });

    for (const active of currentlyActive) {
      if (active.id !== taxonomyId) {
        active.status = TaxonomyStatus.ARCHIVED;
        await this.taxonomyRepository.save(active);
        this.logger.log(`Archived taxonomy ${active.id} (v${active.version})`);
      }
    }

    taxonomy.status = TaxonomyStatus.ACTIVE;
    await this.taxonomyRepository.save(taxonomy);

    await this.eventPublisher.publish(
      TaxonomyEvents.TAXONOMY_ACTIVATED,
      'O',
      orgId,
      { taxonomyId: taxonomy.id, name: taxonomy.name, version: taxonomy.version },
    );

    this.logger.log(`Activated taxonomy ${taxonomy.id} — ${taxonomy.name} v${taxonomy.version}`);
    return taxonomy;
  }

  /**
   * Deep-clone a taxonomy with all categories and items.
   * The clone gets a new version and draft status.
   */
  async cloneTaxonomy(
    orgId: string,
    taxonomyId: string,
    newVersion: string,
    createdBy: string,
  ): Promise<Taxonomy> {
    const original = await this.findOne(orgId, taxonomyId);

    const newTaxId = this.hashIdService.generate('TXN');
    const clonedTaxonomy = this.taxonomyRepository.create({
      id: newTaxId,
      hashId: newTaxId,
      name: original.name,
      description: original.description,
      version: newVersion,
      status: TaxonomyStatus.DRAFT,
      organizationHashId: orgId,
      createdBy,
    });

    await this.taxonomyRepository.save(clonedTaxonomy);

    // Clone categories and items
    if (original.categories) {
      for (const origCat of original.categories) {
        const newCatId = this.hashIdService.generate('TXC');
        const clonedCat = this.categoryRepository.create({
          id: newCatId,
          hashId: newCatId,
          taxonomyId: clonedTaxonomy.id,
          name: origCat.name,
          description: origCat.description,
          sortOrder: origCat.sortOrder,
          icon: origCat.icon,
          metadata: origCat.metadata ? { ...origCat.metadata } : {},
        });

        await this.categoryRepository.save(clonedCat);

        if (origCat.items) {
          for (const origItem of origCat.items) {
            const newItemId = this.hashIdService.generate('TXI');
            const clonedItem = this.itemRepository.create({
              id: newItemId,
              hashId: newItemId,
              categoryId: clonedCat.id,
              name: origItem.name,
              description: origItem.description,
              sortOrder: origItem.sortOrder,
              isActive: origItem.isActive,
              metadata: origItem.metadata ? { ...origItem.metadata } : {},
            });
            await this.itemRepository.save(clonedItem);
          }
        }
      }
    }

    await this.eventPublisher.publish(
      TaxonomyEvents.TAXONOMY_CLONED,
      'O',
      orgId,
      { originalId: taxonomyId, cloneId: clonedTaxonomy.id, version: newVersion },
    );

    this.logger.log(`Cloned taxonomy ${taxonomyId} → ${clonedTaxonomy.id} (v${newVersion})`);
    return this.findOne(orgId, clonedTaxonomy.id);
  }

  // ─── Category CRUD ──────────────────────────────────────────────

  async findCategories(orgId: string, taxonomyId: string): Promise<TaxonomyCategory[]> {
    // Verify taxonomy exists and belongs to org
    await this.findOne(orgId, taxonomyId);

    return this.categoryRepository.find({
      where: { taxonomyId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createCategory(
    orgId: string,
    taxonomyId: string,
    dto: CreateTaxonomyCategoryDto,
  ): Promise<TaxonomyCategory> {
    // Verify taxonomy exists and belongs to org
    await this.findOne(orgId, taxonomyId);

    const id = this.hashIdService.generate('TXC');

    const category = this.categoryRepository.create({
      id,
      hashId: id,
      taxonomyId,
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      icon: dto.icon ?? null,
      metadata: dto.metadata ?? {},
    });

    await this.categoryRepository.save(category);

    await this.eventPublisher.publish(
      TaxonomyEvents.CATEGORY_CREATED,
      'O',
      orgId,
      { taxonomyId, categoryId: category.id, name: category.name },
    );

    this.logger.log(`Created category ${category.id} in taxonomy ${taxonomyId}`);
    return category;
  }

  async updateCategory(
    orgId: string,
    taxonomyId: string,
    categoryId: string,
    dto: UpdateTaxonomyCategoryDto,
  ): Promise<TaxonomyCategory> {
    await this.findOne(orgId, taxonomyId);

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, taxonomyId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found in taxonomy ${taxonomyId}`);
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description ?? null;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.icon !== undefined) category.icon = dto.icon ?? null;
    if (dto.metadata !== undefined) category.metadata = dto.metadata ?? {};

    await this.categoryRepository.save(category);

    await this.eventPublisher.publish(
      TaxonomyEvents.CATEGORY_UPDATED,
      'O',
      orgId,
      { taxonomyId, categoryId: category.id, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated category ${category.id}`);
    return category;
  }

  async removeCategory(
    orgId: string,
    taxonomyId: string,
    categoryId: string,
  ): Promise<void> {
    await this.findOne(orgId, taxonomyId);

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, taxonomyId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found in taxonomy ${taxonomyId}`);
    }

    await this.categoryRepository.remove(category);

    await this.eventPublisher.publish(
      TaxonomyEvents.CATEGORY_DELETED,
      'O',
      orgId,
      { taxonomyId, categoryId },
    );

    this.logger.log(`Deleted category ${categoryId}`);
  }

  // ─── Item CRUD ──────────────────────────────────────────────────

  async findItems(
    orgId: string,
    taxonomyId: string,
    categoryId: string,
  ): Promise<TaxonomyItem[]> {
    await this.findOne(orgId, taxonomyId);

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, taxonomyId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found in taxonomy ${taxonomyId}`);
    }

    return this.itemRepository.find({
      where: { categoryId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createItem(
    orgId: string,
    taxonomyId: string,
    categoryId: string,
    dto: CreateTaxonomyItemDto,
  ): Promise<TaxonomyItem> {
    await this.findOne(orgId, taxonomyId);

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, taxonomyId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found in taxonomy ${taxonomyId}`);
    }

    const id = this.hashIdService.generate('TXI');

    const item = this.itemRepository.create({
      id,
      hashId: id,
      categoryId,
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      metadata: dto.metadata ?? {},
    });

    await this.itemRepository.save(item);

    await this.eventPublisher.publish(
      TaxonomyEvents.ITEM_CREATED,
      'O',
      orgId,
      { taxonomyId, categoryId, itemId: item.id, name: item.name },
    );

    this.logger.log(`Created item ${item.id} in category ${categoryId}`);
    return item;
  }

  async updateItem(
    orgId: string,
    taxonomyId: string,
    categoryId: string,
    itemId: string,
    dto: UpdateTaxonomyItemDto,
  ): Promise<TaxonomyItem> {
    await this.findOne(orgId, taxonomyId);

    const item = await this.itemRepository.findOne({
      where: { id: itemId, categoryId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in category ${categoryId}`);
    }

    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description ?? null;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;
    if (dto.metadata !== undefined) item.metadata = dto.metadata ?? {};

    await this.itemRepository.save(item);

    await this.eventPublisher.publish(
      TaxonomyEvents.ITEM_UPDATED,
      'O',
      orgId,
      { taxonomyId, categoryId, itemId: item.id, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated item ${item.id}`);
    return item;
  }

  async removeItem(
    orgId: string,
    taxonomyId: string,
    categoryId: string,
    itemId: string,
  ): Promise<void> {
    await this.findOne(orgId, taxonomyId);

    const item = await this.itemRepository.findOne({
      where: { id: itemId, categoryId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in category ${categoryId}`);
    }

    await this.itemRepository.remove(item);

    await this.eventPublisher.publish(
      TaxonomyEvents.ITEM_DELETED,
      'O',
      orgId,
      { taxonomyId, categoryId, itemId },
    );

    this.logger.log(`Deleted item ${itemId}`);
  }
}

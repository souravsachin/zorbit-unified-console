import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemoSegment } from '../models/entities/demo-segment.entity';
import { CreateDemoSegmentDto } from '../models/dto/create-demo-segment.dto';
import { UpdateDemoSegmentDto } from '../models/dto/update-demo-segment.dto';
import { DemoSegmentResponseDto } from '../models/dto/demo-segment-response.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { DemoEvents } from '../events/admin-console.events';

@Injectable()
export class DemoSegmentService {
  private readonly logger = new Logger(DemoSegmentService.name);

  constructor(
    @InjectRepository(DemoSegment)
    private readonly segmentRepository: Repository<DemoSegment>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * List all demo segments (builtin + custom).
   */
  async findAll(): Promise<DemoSegmentResponseDto[]> {
    const segments = await this.segmentRepository.find({
      order: { builtin: 'DESC', category: 'ASC', title: 'ASC' },
    });
    return segments.map(this.toResponseDto);
  }

  /**
   * Get a single demo segment by ID.
   */
  async findOne(segmentId: string): Promise<DemoSegmentResponseDto> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Demo segment ${segmentId} not found`);
    }

    return this.toResponseDto(segment);
  }

  /**
   * Create a new custom demo segment.
   */
  async create(dto: CreateDemoSegmentDto, createdBy: string): Promise<DemoSegmentResponseDto> {
    const id = this.hashIdService.generate('DEM');

    const segment = this.segmentRepository.create({
      id,
      title: dto.title,
      description: dto.description ?? null,
      duration: dto.duration ?? null,
      type: dto.type,
      builtin: false,
      category: dto.category ?? null,
      steps: dto.steps ?? [],
      videoUrl: dto.videoUrl ?? null,
      ttsEnabled: dto.ttsEnabled ?? false,
      createdBy,
    });

    await this.segmentRepository.save(segment);

    await this.eventPublisher.publish(
      DemoEvents.SEGMENT_CREATED,
      'G',
      'G',
      { segmentId: segment.id, title: segment.title, type: segment.type },
    );

    this.logger.log(`Created demo segment ${segment.id}`);
    return this.toResponseDto(segment);
  }

  /**
   * Update a demo segment. Returns 403 if the segment is builtin.
   */
  async update(segmentId: string, dto: UpdateDemoSegmentDto): Promise<DemoSegmentResponseDto> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Demo segment ${segmentId} not found`);
    }

    if (segment.builtin) {
      throw new ForbiddenException(`Cannot modify builtin demo segment ${segmentId}. Duplicate it first.`);
    }

    if (dto.title !== undefined) segment.title = dto.title;
    if (dto.description !== undefined) segment.description = dto.description;
    if (dto.duration !== undefined) segment.duration = dto.duration;
    if (dto.type !== undefined) segment.type = dto.type;
    if (dto.category !== undefined) segment.category = dto.category;
    if (dto.steps !== undefined) segment.steps = dto.steps;
    if (dto.videoUrl !== undefined) segment.videoUrl = dto.videoUrl;
    if (dto.ttsEnabled !== undefined) segment.ttsEnabled = dto.ttsEnabled;

    await this.segmentRepository.save(segment);

    await this.eventPublisher.publish(
      DemoEvents.SEGMENT_UPDATED,
      'G',
      'G',
      { segmentId: segment.id, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated demo segment ${segment.id}`);
    return this.toResponseDto(segment);
  }

  /**
   * Delete a demo segment. Returns 403 if the segment is builtin.
   */
  async remove(segmentId: string): Promise<void> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Demo segment ${segmentId} not found`);
    }

    if (segment.builtin) {
      throw new ForbiddenException(`Cannot delete builtin demo segment ${segmentId}. Duplicate it first.`);
    }

    await this.segmentRepository.remove(segment);

    await this.eventPublisher.publish(
      DemoEvents.SEGMENT_DELETED,
      'G',
      'G',
      { segmentId },
    );

    this.logger.log(`Deleted demo segment ${segmentId}`);
  }

  /**
   * Duplicate a demo segment (works for both builtin and custom).
   * Creates a new non-builtin copy with a new ID.
   */
  async duplicate(segmentId: string, createdBy: string): Promise<DemoSegmentResponseDto> {
    const original = await this.segmentRepository.findOne({
      where: { id: segmentId },
    });

    if (!original) {
      throw new NotFoundException(`Demo segment ${segmentId} not found`);
    }

    const newId = this.hashIdService.generate('DEM');

    const duplicate = this.segmentRepository.create({
      id: newId,
      title: `${original.title} (Copy)`,
      description: original.description,
      duration: original.duration,
      type: original.type,
      builtin: false,
      category: original.category,
      steps: original.steps ? [...original.steps] : [],
      videoUrl: original.videoUrl,
      ttsEnabled: original.ttsEnabled,
      createdBy,
    });

    await this.segmentRepository.save(duplicate);

    await this.eventPublisher.publish(
      DemoEvents.SEGMENT_DUPLICATED,
      'G',
      'G',
      { originalId: segmentId, duplicateId: duplicate.id, title: duplicate.title },
    );

    this.logger.log(`Duplicated demo segment ${segmentId} → ${duplicate.id}`);
    return this.toResponseDto(duplicate);
  }

  private toResponseDto(segment: DemoSegment): DemoSegmentResponseDto {
    return {
      id: segment.id,
      title: segment.title,
      description: segment.description,
      duration: segment.duration,
      type: segment.type,
      builtin: segment.builtin,
      category: segment.category,
      steps: segment.steps,
      videoUrl: segment.videoUrl,
      ttsEnabled: segment.ttsEnabled,
      createdBy: segment.createdBy,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    };
  }
}

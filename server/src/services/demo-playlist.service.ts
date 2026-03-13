import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemoPlaylist } from '../models/entities/demo-playlist.entity';
import { CreateDemoPlaylistDto } from '../models/dto/create-demo-playlist.dto';
import { UpdateDemoPlaylistDto } from '../models/dto/update-demo-playlist.dto';
import { DemoPlaylistResponseDto } from '../models/dto/demo-playlist-response.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { DemoEvents } from '../events/admin-console.events';

@Injectable()
export class DemoPlaylistService {
  private readonly logger = new Logger(DemoPlaylistService.name);

  constructor(
    @InjectRepository(DemoPlaylist)
    private readonly playlistRepository: Repository<DemoPlaylist>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * List all playlists for a given user.
   * Enforces user namespace isolation.
   */
  async findAll(userId: string): Promise<DemoPlaylistResponseDto[]> {
    const playlists = await this.playlistRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });
    return playlists.map(this.toResponseDto);
  }

  /**
   * Create a new demo playlist for a user.
   */
  async create(userId: string, dto: CreateDemoPlaylistDto): Promise<DemoPlaylistResponseDto> {
    const id = this.hashIdService.generate('DPL');

    const playlist = this.playlistRepository.create({
      id,
      title: dto.title,
      description: dto.description ?? null,
      segments: (dto.segments ?? []).map((s) => ({
        segment_id: s.segment_id,
        seq: s.seq,
        auto_play: s.auto_play ?? false,
      })),
      createdBy: userId,
    });

    await this.playlistRepository.save(playlist);

    await this.eventPublisher.publish(
      DemoEvents.PLAYLIST_CREATED,
      'U',
      userId,
      { playlistId: playlist.id, title: playlist.title },
    );

    this.logger.log(`Created demo playlist ${playlist.id} for user ${userId}`);
    return this.toResponseDto(playlist);
  }

  /**
   * Update a demo playlist.
   */
  async update(userId: string, playlistId: string, dto: UpdateDemoPlaylistDto): Promise<DemoPlaylistResponseDto> {
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId, createdBy: userId },
    });

    if (!playlist) {
      throw new NotFoundException(`Demo playlist ${playlistId} not found for user ${userId}`);
    }

    if (dto.title !== undefined) playlist.title = dto.title;
    if (dto.description !== undefined) playlist.description = dto.description;
    if (dto.segments !== undefined) {
      playlist.segments = dto.segments.map((s) => ({
        segment_id: s.segment_id,
        seq: s.seq,
        auto_play: s.auto_play ?? false,
      }));
    }

    await this.playlistRepository.save(playlist);

    await this.eventPublisher.publish(
      DemoEvents.PLAYLIST_UPDATED,
      'U',
      userId,
      { playlistId: playlist.id, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated demo playlist ${playlist.id} for user ${userId}`);
    return this.toResponseDto(playlist);
  }

  /**
   * Delete a demo playlist.
   */
  async remove(userId: string, playlistId: string): Promise<void> {
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId, createdBy: userId },
    });

    if (!playlist) {
      throw new NotFoundException(`Demo playlist ${playlistId} not found for user ${userId}`);
    }

    await this.playlistRepository.remove(playlist);

    await this.eventPublisher.publish(
      DemoEvents.PLAYLIST_DELETED,
      'U',
      userId,
      { playlistId },
    );

    this.logger.log(`Deleted demo playlist ${playlistId} for user ${userId}`);
  }

  private toResponseDto(playlist: DemoPlaylist): DemoPlaylistResponseDto {
    return {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      segments: playlist.segments,
      createdBy: playlist.createdBy,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }
}

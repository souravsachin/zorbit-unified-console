import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DemoPlaylistService } from '../src/services/demo-playlist.service';
import { DemoPlaylist } from '../src/models/entities/demo-playlist.entity';
import { HashIdService } from '../src/services/hash-id.service';
import { EventPublisherService } from '../src/events/event-publisher.service';

describe('DemoPlaylistService', () => {
  let service: DemoPlaylistService;
  let playlistRepo: jest.Mocked<Repository<DemoPlaylist>>;
  let hashIdService: jest.Mocked<HashIdService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  const mockPlaylist: DemoPlaylist = {
    id: 'DPL-A1B2',
    title: 'Onboarding Playlist',
    description: 'A playlist for new users',
    segments: [
      { segment_id: 'DEM-0001', seq: 1, auto_play: true },
      { segment_id: 'DEM-0010', seq: 2, auto_play: false },
    ],
    createdBy: 'U-81F3',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoPlaylistService,
        {
          provide: getRepositoryToken(DemoPlaylist),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: HashIdService,
          useValue: { generate: jest.fn() },
        },
        {
          provide: EventPublisherService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DemoPlaylistService>(DemoPlaylistService);
    playlistRepo = module.get(getRepositoryToken(DemoPlaylist));
    hashIdService = module.get(HashIdService);
    eventPublisher = module.get(EventPublisherService);
  });

  describe('findAll', () => {
    it('should return playlists for a user', async () => {
      playlistRepo.find.mockResolvedValue([mockPlaylist]);
      const result = await service.findAll('U-81F3');
      expect(result).toHaveLength(1);
      expect(result[0].createdBy).toBe('U-81F3');
      expect(playlistRepo.find).toHaveBeenCalledWith({
        where: { createdBy: 'U-81F3' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a playlist with generated hash ID', async () => {
      hashIdService.generate.mockReturnValue('DPL-NEW1');
      playlistRepo.create.mockReturnValue(mockPlaylist);
      playlistRepo.save.mockResolvedValue(mockPlaylist);
      eventPublisher.publish.mockResolvedValue(undefined);

      const dto = {
        title: 'Onboarding Playlist',
        segments: [{ segment_id: 'DEM-0001', seq: 1, auto_play: true }],
      };

      const result = await service.create('U-81F3', dto);
      expect(hashIdService.generate).toHaveBeenCalledWith('DPL');
      expect(playlistRepo.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a playlist', async () => {
      playlistRepo.findOne.mockResolvedValue({ ...mockPlaylist });
      playlistRepo.save.mockResolvedValue({ ...mockPlaylist, title: 'Updated' });
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.update('U-81F3', 'DPL-A1B2', { title: 'Updated' });
      expect(playlistRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if playlist not owned by user', async () => {
      playlistRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('U-81F3', 'DPL-NOPE', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a playlist', async () => {
      playlistRepo.findOne.mockResolvedValue(mockPlaylist);
      playlistRepo.remove.mockResolvedValue(mockPlaylist);
      eventPublisher.publish.mockResolvedValue(undefined);

      await service.remove('U-81F3', 'DPL-A1B2');
      expect(playlistRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent playlist', async () => {
      playlistRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('U-81F3', 'DPL-NOPE')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DemoSegmentService } from '../src/services/demo-segment.service';
import { DemoSegment, DemoSegmentType } from '../src/models/entities/demo-segment.entity';
import { HashIdService } from '../src/services/hash-id.service';
import { EventPublisherService } from '../src/events/event-publisher.service';

describe('DemoSegmentService', () => {
  let service: DemoSegmentService;
  let segmentRepo: jest.Mocked<Repository<DemoSegment>>;
  let hashIdService: jest.Mocked<HashIdService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  const mockSegment: DemoSegment = {
    id: 'DEM-A1B2',
    title: 'Test Segment',
    description: 'A test segment',
    duration: '2:00',
    type: DemoSegmentType.INTERACTIVE,
    builtin: false,
    category: 'onboarding',
    steps: [
      { seq: 1, action: 'info' as any, target: '', value: 'Hello', delay_ms: 1000, narration: 'Hello' },
    ],
    videoUrl: null,
    ttsEnabled: true,
    createdBy: 'U-81F3',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const builtinSegment: DemoSegment = {
    ...mockSegment,
    id: 'DEM-0001',
    title: 'Builtin Segment',
    builtin: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoSegmentService,
        {
          provide: getRepositoryToken(DemoSegment),
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

    service = module.get<DemoSegmentService>(DemoSegmentService);
    segmentRepo = module.get(getRepositoryToken(DemoSegment));
    hashIdService = module.get(HashIdService);
    eventPublisher = module.get(EventPublisherService);
  });

  describe('findAll', () => {
    it('should return all segments sorted by builtin first', async () => {
      segmentRepo.find.mockResolvedValue([builtinSegment, mockSegment]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].builtin).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a segment by ID', async () => {
      segmentRepo.findOne.mockResolvedValue(mockSegment);
      const result = await service.findOne('DEM-A1B2');
      expect(result.id).toBe('DEM-A1B2');
    });

    it('should throw NotFoundException for non-existent segment', async () => {
      segmentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('DEM-NOPE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a custom segment with builtin=false', async () => {
      hashIdService.generate.mockReturnValue('DEM-NEW1');
      segmentRepo.create.mockReturnValue(mockSegment);
      segmentRepo.save.mockResolvedValue(mockSegment);
      eventPublisher.publish.mockResolvedValue(undefined);

      const dto = {
        title: 'Test Segment',
        type: DemoSegmentType.INTERACTIVE,
      };

      const result = await service.create(dto, 'U-81F3');
      expect(hashIdService.generate).toHaveBeenCalledWith('DEM');
      expect(segmentRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a custom segment', async () => {
      segmentRepo.findOne.mockResolvedValue({ ...mockSegment });
      segmentRepo.save.mockResolvedValue({ ...mockSegment, title: 'Updated' });
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.update('DEM-A1B2', { title: 'Updated' });
      expect(segmentRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for builtin segment', async () => {
      segmentRepo.findOne.mockResolvedValue(builtinSegment);
      await expect(
        service.update('DEM-0001', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent segment', async () => {
      segmentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('DEM-NOPE', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a custom segment', async () => {
      segmentRepo.findOne.mockResolvedValue(mockSegment);
      segmentRepo.remove.mockResolvedValue(mockSegment);
      eventPublisher.publish.mockResolvedValue(undefined);

      await service.remove('DEM-A1B2');
      expect(segmentRepo.remove).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for builtin segment', async () => {
      segmentRepo.findOne.mockResolvedValue(builtinSegment);
      await expect(service.remove('DEM-0001')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('duplicate', () => {
    it('should duplicate any segment as a custom copy', async () => {
      segmentRepo.findOne.mockResolvedValue(builtinSegment);
      hashIdService.generate.mockReturnValue('DEM-COPY');
      const duplicated = {
        ...builtinSegment,
        id: 'DEM-COPY',
        title: 'Builtin Segment (Copy)',
        builtin: false,
        createdBy: 'U-81F3',
      };
      segmentRepo.create.mockReturnValue(duplicated);
      segmentRepo.save.mockResolvedValue(duplicated);
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.duplicate('DEM-0001', 'U-81F3');
      expect(result.id).toBe('DEM-COPY');
      expect(result.builtin).toBe(false);
      expect(result.title).toContain('(Copy)');
    });

    it('should throw NotFoundException for non-existent segment', async () => {
      segmentRepo.findOne.mockResolvedValue(null);
      await expect(service.duplicate('DEM-NOPE', 'U-81F3')).rejects.toThrow(NotFoundException);
    });
  });
});

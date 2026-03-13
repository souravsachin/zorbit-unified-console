import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DashboardService } from '../src/services/dashboard.service';
import { Widget, WidgetType } from '../src/models/entities/widget.entity';
import { HashIdService } from '../src/services/hash-id.service';
import { EventPublisherService } from '../src/events/event-publisher.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let widgetRepo: jest.Mocked<Repository<Widget>>;
  let hashIdService: jest.Mocked<HashIdService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  const mockWidget: Widget = {
    id: 'WDG-A1B2',
    title: 'Total Customers',
    type: WidgetType.COUNT,
    metricQuery: '/api/v1/O/{{org_id}}/customers/count',
    config: {},
    roles: ['super_admin'],
    positionX: 0,
    positionY: 0,
    positionW: 4,
    positionH: 3,
    orgId: 'O-92AF',
    createdBy: 'U-81F3',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Widget),
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

    service = module.get<DashboardService>(DashboardService);
    widgetRepo = module.get(getRepositoryToken(Widget));
    hashIdService = module.get(HashIdService);
    eventPublisher = module.get(EventPublisherService);
  });

  describe('findAll', () => {
    it('should return all widgets for an org', async () => {
      widgetRepo.find.mockResolvedValue([mockWidget]);
      const result = await service.findAll('O-92AF');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('WDG-A1B2');
      expect(widgetRepo.find).toHaveBeenCalledWith({
        where: { orgId: 'O-92AF' },
        order: { positionY: 'ASC', positionX: 'ASC' },
      });
    });
  });

  describe('getUserView', () => {
    it('should filter widgets by user roles', async () => {
      const publicWidget = { ...mockWidget, id: 'WDG-PUB1', roles: [] };
      const adminWidget = { ...mockWidget, id: 'WDG-ADM1', roles: ['super_admin'] };
      const managerWidget = { ...mockWidget, id: 'WDG-MGR1', roles: ['manager'] };

      widgetRepo.find.mockResolvedValue([publicWidget, adminWidget, managerWidget]);

      const result = await service.getUserView('O-92AF', ['super_admin']);
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.id)).toEqual(['WDG-PUB1', 'WDG-ADM1']);
    });

    it('should include widgets with empty roles for all users', async () => {
      const publicWidget = { ...mockWidget, roles: [] };
      widgetRepo.find.mockResolvedValue([publicWidget]);

      const result = await service.getUserView('O-92AF', []);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a widget with generated hash ID', async () => {
      hashIdService.generate.mockReturnValue('WDG-NEW1');
      widgetRepo.create.mockReturnValue(mockWidget);
      widgetRepo.save.mockResolvedValue(mockWidget);
      eventPublisher.publish.mockResolvedValue(undefined);

      const dto = {
        title: 'Total Customers',
        type: WidgetType.COUNT,
        metricQuery: '/api/v1/O/{{org_id}}/customers/count',
      };

      const result = await service.create('O-92AF', dto, 'U-81F3');
      expect(hashIdService.generate).toHaveBeenCalledWith('WDG');
      expect(widgetRepo.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
      expect(result.id).toBe('WDG-A1B2');
    });
  });

  describe('update', () => {
    it('should update widget fields', async () => {
      widgetRepo.findOne.mockResolvedValue({ ...mockWidget });
      widgetRepo.save.mockResolvedValue({ ...mockWidget, title: 'Updated Title' });
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.update('O-92AF', 'WDG-A1B2', { title: 'Updated Title' });
      expect(widgetRepo.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent widget', async () => {
      widgetRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('O-92AF', 'WDG-NOPE', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a widget', async () => {
      widgetRepo.findOne.mockResolvedValue(mockWidget);
      widgetRepo.remove.mockResolvedValue(mockWidget);
      eventPublisher.publish.mockResolvedValue(undefined);

      await service.remove('O-92AF', 'WDG-A1B2');
      expect(widgetRepo.remove).toHaveBeenCalledWith(mockWidget);
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent widget', async () => {
      widgetRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('O-92AF', 'WDG-NOPE')).rejects.toThrow(NotFoundException);
    });
  });
});

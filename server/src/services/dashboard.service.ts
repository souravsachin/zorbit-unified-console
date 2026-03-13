import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Widget } from '../models/entities/widget.entity';
import { CreateWidgetDto } from '../models/dto/create-widget.dto';
import { UpdateWidgetDto } from '../models/dto/update-widget.dto';
import { WidgetResponseDto } from '../models/dto/widget-response.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { DashboardEvents } from '../events/admin-console.events';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Widget)
    private readonly widgetRepository: Repository<Widget>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * List all widgets for an organization (designer mode — no role filtering).
   */
  async findAll(orgId: string): Promise<WidgetResponseDto[]> {
    const widgets = await this.widgetRepository.find({
      where: { orgId },
      order: { positionY: 'ASC', positionX: 'ASC' },
    });
    return widgets.map(this.toResponseDto);
  }

  /**
   * Get the designer view — returns all widgets for the org (unfiltered).
   * Requires dashboard.designer.write privilege (enforced in controller).
   */
  async getDesignerView(orgId: string): Promise<WidgetResponseDto[]> {
    return this.findAll(orgId);
  }

  /**
   * Get the user view — returns widgets filtered by the user's roles.
   * A widget is visible if its roles array is empty (visible to all) or
   * contains at least one role matching the user's roles.
   */
  async getUserView(orgId: string, userRoles: string[]): Promise<WidgetResponseDto[]> {
    const allWidgets = await this.widgetRepository.find({
      where: { orgId },
      order: { positionY: 'ASC', positionX: 'ASC' },
    });

    const filtered = allWidgets.filter((w) => {
      // Empty roles array means visible to all
      if (!w.roles || w.roles.length === 0) return true;
      // Otherwise check if any of the user's roles match
      return w.roles.some((role) => userRoles.includes(role));
    });

    return filtered.map(this.toResponseDto);
  }

  /**
   * Create a new dashboard widget.
   */
  async create(orgId: string, dto: CreateWidgetDto, createdBy: string): Promise<WidgetResponseDto> {
    const id = this.hashIdService.generate('WDG');

    const widget = this.widgetRepository.create({
      id,
      title: dto.title,
      type: dto.type,
      metricQuery: dto.metricQuery ?? null,
      config: dto.config ?? {},
      roles: dto.roles ?? [],
      positionX: dto.positionX ?? 0,
      positionY: dto.positionY ?? 0,
      positionW: dto.positionW ?? 4,
      positionH: dto.positionH ?? 3,
      orgId,
      createdBy,
    });

    await this.widgetRepository.save(widget);

    await this.eventPublisher.publish(
      DashboardEvents.WIDGET_CREATED,
      'O',
      orgId,
      { widgetId: widget.id, title: widget.title, type: widget.type },
    );

    this.logger.log(`Created widget ${widget.id} in org ${orgId}`);
    return this.toResponseDto(widget);
  }

  /**
   * Update an existing dashboard widget.
   */
  async update(orgId: string, widgetId: string, dto: UpdateWidgetDto): Promise<WidgetResponseDto> {
    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, orgId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found in organization ${orgId}`);
    }

    if (dto.title !== undefined) widget.title = dto.title;
    if (dto.type !== undefined) widget.type = dto.type;
    if (dto.metricQuery !== undefined) widget.metricQuery = dto.metricQuery;
    if (dto.config !== undefined) widget.config = dto.config;
    if (dto.roles !== undefined) widget.roles = dto.roles;
    if (dto.positionX !== undefined) widget.positionX = dto.positionX;
    if (dto.positionY !== undefined) widget.positionY = dto.positionY;
    if (dto.positionW !== undefined) widget.positionW = dto.positionW;
    if (dto.positionH !== undefined) widget.positionH = dto.positionH;

    await this.widgetRepository.save(widget);

    await this.eventPublisher.publish(
      DashboardEvents.WIDGET_UPDATED,
      'O',
      orgId,
      { widgetId: widget.id, updatedFields: Object.keys(dto) },
    );

    this.logger.log(`Updated widget ${widget.id} in org ${orgId}`);
    return this.toResponseDto(widget);
  }

  /**
   * Delete a dashboard widget.
   */
  async remove(orgId: string, widgetId: string): Promise<void> {
    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, orgId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found in organization ${orgId}`);
    }

    await this.widgetRepository.remove(widget);

    await this.eventPublisher.publish(
      DashboardEvents.WIDGET_DELETED,
      'O',
      orgId,
      { widgetId },
    );

    this.logger.log(`Deleted widget ${widgetId} from org ${orgId}`);
  }

  private toResponseDto(widget: Widget): WidgetResponseDto {
    return {
      id: widget.id,
      title: widget.title,
      type: widget.type,
      metricQuery: widget.metricQuery,
      config: widget.config,
      roles: widget.roles,
      positionX: widget.positionX,
      positionY: widget.positionY,
      positionW: widget.positionW,
      positionH: widget.positionH,
      orgId: widget.orgId,
      createdBy: widget.createdBy,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    };
  }
}

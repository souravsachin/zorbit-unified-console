import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition, WorkflowTransition } from '../models/entities/workflow.entity';
import { WorkflowInstance, WorkflowHistoryEntry } from '../models/entities/workflow-instance.entity';
import { CreateWorkflowDefinitionDto } from '../models/dto/create-workflow-definition.dto';
import { CreateWorkflowInstanceDto } from '../models/dto/create-workflow-instance.dto';
import { TransitionWorkflowDto } from '../models/dto/transition-workflow.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { WorkflowEvents } from '../events/admin-console.events';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly definitionRepository: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepository: Repository<WorkflowInstance>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  // ─── Definition CRUD ───────────────────────────────────────────────

  async createDefinition(
    orgId: string,
    dto: CreateWorkflowDefinitionDto,
  ): Promise<WorkflowDefinition> {
    const id = this.hashIdService.generate('WFL');

    const definition = this.definitionRepository.create({
      id,
      hashId: id,
      name: dto.name,
      description: dto.description ?? '',
      states: dto.states,
      transitions: dto.transitions,
      organizationHashId: orgId,
      isActive: dto.isActive ?? true,
    });

    await this.definitionRepository.save(definition);

    await this.eventPublisher.publish(
      WorkflowEvents.DEFINITION_CREATED,
      'O',
      orgId,
      { definitionId: definition.id, name: definition.name },
    );

    this.logger.log(`Created workflow definition ${definition.id} "${definition.name}" in org ${orgId}`);
    return definition;
  }

  async findAllDefinitions(orgId: string): Promise<WorkflowDefinition[]> {
    return this.definitionRepository.find({
      where: { organizationHashId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findDefinition(orgId: string, id: string): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepository.findOne({
      where: { id, organizationHashId: orgId },
    });

    if (!definition) {
      throw new NotFoundException(`Workflow definition ${id} not found in organization ${orgId}`);
    }

    return definition;
  }

  // ─── Instance CRUD ─────────────────────────────────────────────────

  async createInstance(
    orgId: string,
    dto: CreateWorkflowInstanceDto,
    createdBy: string,
  ): Promise<WorkflowInstance> {
    // Validate workflow definition exists
    const definition = await this.findDefinition(orgId, dto.workflowDefinitionId);

    if (!definition.isActive) {
      throw new BadRequestException(`Workflow definition ${definition.id} is not active`);
    }

    if (!definition.states || definition.states.length === 0) {
      throw new BadRequestException(`Workflow definition ${definition.id} has no states defined`);
    }

    const initialState = definition.states[0];
    const id = this.hashIdService.generate('WFI');

    const instance = this.instanceRepository.create({
      id,
      hashId: id,
      workflowDefinitionId: dto.workflowDefinitionId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      currentState: initialState.id,
      history: [],
      assignedTo: dto.assignedTo ?? null,
      organizationHashId: orgId,
      createdBy,
    });

    await this.instanceRepository.save(instance);

    await this.eventPublisher.publish(
      WorkflowEvents.INSTANCE_CREATED,
      'O',
      orgId,
      {
        instanceId: instance.id,
        definitionId: definition.id,
        entityType: instance.entityType,
        entityId: instance.entityId,
        initialState: initialState.id,
      },
    );

    this.logger.log(`Created workflow instance ${instance.id} for ${instance.entityType}/${instance.entityId} in org ${orgId}`);
    return instance;
  }

  async findInstance(orgId: string, id: string): Promise<WorkflowInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id, organizationHashId: orgId },
    });

    if (!instance) {
      throw new NotFoundException(`Workflow instance ${id} not found in organization ${orgId}`);
    }

    return instance;
  }

  async getInstanceByEntity(
    orgId: string,
    entityType: string,
    entityId: string,
  ): Promise<WorkflowInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { organizationHashId: orgId, entityType, entityId },
    });

    if (!instance) {
      throw new NotFoundException(
        `Workflow instance not found for ${entityType}/${entityId} in organization ${orgId}`,
      );
    }

    return instance;
  }

  // ─── Transitions ───────────────────────────────────────────────────

  async transition(
    orgId: string,
    instanceId: string,
    dto: TransitionWorkflowDto,
    performedBy: string,
    userRoles: string[],
  ): Promise<WorkflowInstance> {
    const instance = await this.findInstance(orgId, instanceId);
    const definition = await this.findDefinition(orgId, instance.workflowDefinitionId);

    // Find the matching transition
    const transition = definition.transitions.find(
      (t: WorkflowTransition) =>
        (t.from === instance.currentState || t.from === '*') &&
        t.action === dto.action,
    );

    if (!transition) {
      throw new BadRequestException(
        `Transition "${dto.action}" is not allowed from state "${instance.currentState}"`,
      );
    }

    // Check role authorization
    if (!userRoles.includes(transition.requiredRole) && !userRoles.includes('admin')) {
      throw new ForbiddenException(
        `Role "${transition.requiredRole}" is required to perform "${dto.action}"`,
      );
    }

    // Check comment requirement
    if (transition.requiresComment && !dto.comment) {
      throw new BadRequestException(
        `A comment is required for transition "${dto.action}"`,
      );
    }

    const previousState = instance.currentState;

    // Build history entry
    const historyEntry: WorkflowHistoryEntry = {
      from: previousState,
      to: transition.to,
      action: dto.action,
      performedBy,
      performedAt: new Date().toISOString(),
      ...(dto.comment ? { comment: dto.comment } : {}),
    };

    // Handle wildcard "from" — keep original from in history
    instance.currentState = transition.to;
    instance.history = [...instance.history, historyEntry];

    await this.instanceRepository.save(instance);

    await this.eventPublisher.publish(
      WorkflowEvents.INSTANCE_TRANSITIONED,
      'O',
      orgId,
      {
        instanceId: instance.id,
        entityType: instance.entityType,
        entityId: instance.entityId,
        from: previousState,
        to: transition.to,
        action: dto.action,
        performedBy,
      },
    );

    this.logger.log(
      `Transitioned instance ${instance.id} from "${previousState}" to "${transition.to}" via "${dto.action}"`,
    );

    return instance;
  }

  async getAvailableActions(
    orgId: string,
    instanceId: string,
    userRoles: string[],
  ): Promise<WorkflowTransition[]> {
    const instance = await this.findInstance(orgId, instanceId);
    const definition = await this.findDefinition(orgId, instance.workflowDefinitionId);

    return definition.transitions.filter(
      (t: WorkflowTransition) =>
        (t.from === instance.currentState || t.from === '*') &&
        (userRoles.includes(t.requiredRole) || userRoles.includes('admin')),
    );
  }

  async getHistory(orgId: string, instanceId: string): Promise<WorkflowHistoryEntry[]> {
    const instance = await this.findInstance(orgId, instanceId);
    return instance.history;
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WorkflowService } from '../services/workflow.service';
import { CreateWorkflowDefinitionDto } from '../models/dto/create-workflow-definition.dto';
import { CreateWorkflowInstanceDto } from '../models/dto/create-workflow-instance.dto';
import { TransitionWorkflowDto } from '../models/dto/transition-workflow.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

/**
 * Workflow management endpoints, scoped to an organization namespace.
 * All routes enforce JWT authentication and namespace isolation via orgId.
 */
@ApiTags('workflows')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // ─── Workflow Definitions ──────────────────────────────────────────

  @Post('workflows')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create workflow definition', description: 'Create a new workflow definition with states and transitions.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Workflow definition created successfully.' })
  async createDefinition(
    @Param('orgId') orgId: string,
    @Body() dto: CreateWorkflowDefinitionDto,
  ) {
    return this.workflowService.createDefinition(orgId, dto);
  }

  @Get('workflows')
  @ApiOperation({ summary: 'List workflow definitions', description: 'List all workflow definitions for an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'List of workflow definitions returned.' })
  async findAllDefinitions(@Param('orgId') orgId: string) {
    return this.workflowService.findAllDefinitions(orgId);
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow definition', description: 'Get a specific workflow definition by ID.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Workflow definition ID', example: 'WFL-A1B2' })
  @ApiResponse({ status: 200, description: 'Workflow definition returned.' })
  @ApiResponse({ status: 404, description: 'Workflow definition not found.' })
  async findDefinition(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.workflowService.findDefinition(orgId, id);
  }

  // ─── Workflow Instances ────────────────────────────────────────────

  @Post('workflow-instances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create workflow instance', description: 'Create a new workflow instance for an entity.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Workflow instance created successfully.' })
  async createInstance(
    @Param('orgId') orgId: string,
    @Body() dto: CreateWorkflowInstanceDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.workflowService.createInstance(orgId, dto, req.user.sub);
  }

  @Get('workflow-instances/:id')
  @ApiOperation({ summary: 'Get workflow instance', description: 'Get a specific workflow instance by ID.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Workflow instance ID', example: 'WFI-A1B2' })
  @ApiResponse({ status: 200, description: 'Workflow instance returned.' })
  @ApiResponse({ status: 404, description: 'Workflow instance not found.' })
  async findInstance(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.workflowService.findInstance(orgId, id);
  }

  @Get('workflow-instances/entity/:type/:entityId')
  @ApiOperation({ summary: 'Get workflow instance by entity', description: 'Look up a workflow instance by entity type and ID.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'type', description: 'Entity type', example: 'product_configuration' })
  @ApiParam({ name: 'entityId', description: 'Entity ID', example: 'PCF-92AF' })
  @ApiResponse({ status: 200, description: 'Workflow instance returned.' })
  @ApiResponse({ status: 404, description: 'Workflow instance not found.' })
  async getInstanceByEntity(
    @Param('orgId') orgId: string,
    @Param('type') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.workflowService.getInstanceByEntity(orgId, entityType, entityId);
  }

  @Post('workflow-instances/:id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform workflow transition', description: 'Transition a workflow instance to a new state.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Workflow instance ID', example: 'WFI-A1B2' })
  @ApiResponse({ status: 200, description: 'Transition performed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid transition.' })
  @ApiResponse({ status: 403, description: 'Insufficient role for transition.' })
  async transition(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: TransitionWorkflowDto,
    @Req() req: { user: JwtPayload },
  ) {
    const userRoles = req.user.privileges ?? [];
    return this.workflowService.transition(orgId, id, dto, req.user.sub, userRoles);
  }

  @Get('workflow-instances/:id/actions')
  @ApiOperation({ summary: 'Get available actions', description: 'Get available workflow transitions based on current state and user role.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Workflow instance ID', example: 'WFI-A1B2' })
  @ApiResponse({ status: 200, description: 'Available transitions returned.' })
  async getAvailableActions(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ) {
    const userRoles = req.user.privileges ?? [];
    return this.workflowService.getAvailableActions(orgId, id, userRoles);
  }

  @Get('workflow-instances/:id/history')
  @ApiOperation({ summary: 'Get workflow history', description: 'Get the transition history for a workflow instance.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Workflow instance ID', example: 'WFI-A1B2' })
  @ApiResponse({ status: 200, description: 'Workflow history returned.' })
  async getHistory(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.workflowService.getHistory(orgId, id);
  }
}

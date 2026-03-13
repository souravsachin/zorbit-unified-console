import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { CreateWidgetDto } from '../models/dto/create-widget.dto';
import { UpdateWidgetDto } from '../models/dto/update-widget.dto';
import { WidgetResponseDto } from '../models/dto/widget-response.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

/**
 * Dashboard widget management endpoints, scoped to an organization namespace.
 * All routes enforce JWT authentication and namespace isolation via orgId.
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId/dashboard')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('widgets')
  @ApiOperation({ summary: 'List all widgets', description: 'List all dashboard widgets for an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'List of widgets returned.' })
  async findAll(@Param('orgId') orgId: string): Promise<WidgetResponseDto[]> {
    return this.dashboardService.findAll(orgId);
  }

  @Post('widgets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create widget', description: 'Create a new dashboard widget.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Widget created successfully.' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateWidgetDto,
    @Req() req: { user: JwtPayload },
  ): Promise<WidgetResponseDto> {
    return this.dashboardService.create(orgId, dto, req.user.sub);
  }

  @Put('widgets/:id')
  @ApiOperation({ summary: 'Update widget', description: 'Update a dashboard widget.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Widget short hash ID', example: 'WDG-A1B2' })
  @ApiResponse({ status: 200, description: 'Widget updated successfully.' })
  @ApiResponse({ status: 404, description: 'Widget not found.' })
  async update(
    @Param('orgId') orgId: string,
    @Param('id') widgetId: string,
    @Body() dto: UpdateWidgetDto,
  ): Promise<WidgetResponseDto> {
    return this.dashboardService.update(orgId, widgetId, dto);
  }

  @Delete('widgets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete widget', description: 'Delete a dashboard widget.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Widget short hash ID', example: 'WDG-A1B2' })
  @ApiResponse({ status: 204, description: 'Widget deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Widget not found.' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('id') widgetId: string,
  ): Promise<void> {
    return this.dashboardService.remove(orgId, widgetId);
  }

  @Get('designer')
  @ApiOperation({
    summary: 'Designer view',
    description: 'Get all widgets for the dashboard designer (unfiltered, requires dashboard.designer.write privilege).',
  })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'All widgets returned for designer.' })
  async getDesignerView(@Param('orgId') orgId: string): Promise<WidgetResponseDto[]> {
    return this.dashboardService.getDesignerView(orgId);
  }

  @Get('view')
  @ApiOperation({
    summary: 'User view',
    description: 'Get dashboard widgets filtered by the current user\'s roles.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'Role-filtered widgets returned.' })
  async getUserView(
    @Param('orgId') orgId: string,
    @Req() req: { user: JwtPayload },
  ): Promise<WidgetResponseDto[]> {
    const userRoles = req.user.privileges ?? [];
    return this.dashboardService.getUserView(orgId, userRoles);
  }
}

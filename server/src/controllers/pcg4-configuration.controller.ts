import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';
import { PCG4ConfigurationService } from '../services/pcg4-configuration.service';
import { PCG4PlanService } from '../services/pcg4-plan.service';
import { PCG4BenefitService } from '../services/pcg4-benefit.service';
import { CreateConfigurationDto } from '../models/dto/pcg4/create-configuration.dto';
import { UpdateConfigurationStageDto } from '../models/dto/pcg4/update-configuration-stage.dto';
import { CreatePlanDto } from '../models/dto/pcg4/create-plan.dto';
import { UpdatePlanDto } from '../models/dto/pcg4/update-plan.dto';
import { CreatePlanBenefitDto } from '../models/dto/pcg4/create-plan-benefit.dto';
import { UpdatePlanBenefitDto } from '../models/dto/pcg4/update-plan-benefit.dto';

/**
 * PCG4 Product Configuration endpoints, scoped to an organization namespace.
 * Manages configurations, plans, and plan benefits for healthcare insurance products.
 */
@ApiTags('pcg4')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId/pcg4')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class PCG4ConfigurationController {
  constructor(
    private readonly configService: PCG4ConfigurationService,
    private readonly planService: PCG4PlanService,
    private readonly benefitService: PCG4BenefitService,
  ) {}

  // ====================== CONFIGURATIONS ======================

  @Post('configurations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create configuration', description: 'Create a new product configuration in draft status.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Configuration created.' })
  async createConfiguration(
    @Param('orgId') orgId: string,
    @Body() dto: CreateConfigurationDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.configService.create(orgId, dto, req.user.sub);
  }

  @Get('configurations')
  @ApiOperation({ summary: 'List configurations', description: 'List all product configurations for an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (draft, in_review, approved, published, archived)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 50 })
  @ApiResponse({ status: 200, description: 'List of configurations.' })
  async listConfigurations(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.configService.findAll(orgId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('configurations/templates')
  @ApiOperation({ summary: 'Get templates', description: 'Get configurations that can be used as templates for inheritance.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'List of template configurations.' })
  async getTemplates(@Param('orgId') orgId: string) {
    return this.configService.getTemplates(orgId);
  }

  @Get('configurations/:configId')
  @ApiOperation({ summary: 'Get configuration', description: 'Get a single configuration with plans and benefits.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiResponse({ status: 200, description: 'Configuration with plans and benefits.' })
  @ApiResponse({ status: 404, description: 'Configuration not found.' })
  async getConfiguration(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
  ) {
    return this.configService.findOne(orgId, configId);
  }

  @Put('configurations/:configId/stage')
  @ApiOperation({ summary: 'Update stage', description: 'Update a specific wizard stage data for a configuration.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiResponse({ status: 200, description: 'Configuration stage updated.' })
  @ApiResponse({ status: 404, description: 'Configuration not found.' })
  async updateStage(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Body() dto: UpdateConfigurationStageDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.configService.updateStage(orgId, configId, dto, req.user.sub);
  }

  @Delete('configurations/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete configuration', description: 'Delete a draft configuration.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiResponse({ status: 204, description: 'Configuration deleted.' })
  @ApiResponse({ status: 400, description: 'Only draft configurations can be deleted.' })
  @ApiResponse({ status: 404, description: 'Configuration not found.' })
  async deleteConfiguration(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
  ) {
    return this.configService.delete(orgId, configId);
  }

  @Post('configurations/:configId/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone configuration', description: 'Deep clone a configuration (or a single plan) into a new draft.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Source configuration ID to clone from', example: 'PCG-A3F2' })
  @ApiResponse({ status: 201, description: 'Configuration cloned.' })
  @ApiResponse({ status: 404, description: 'Source configuration not found.' })
  async cloneConfiguration(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Body() body: { sourcePlanId?: string },
    @Req() req: { user: JwtPayload },
  ) {
    return this.configService.cloneFromTemplate(
      orgId,
      configId,
      body.sourcePlanId,
      req.user.sub,
    );
  }

  // ====================== PLANS ======================

  @Get('configurations/:configId/plans')
  @ApiOperation({ summary: 'List plans', description: 'List all plans for a configuration.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiResponse({ status: 200, description: 'List of plans.' })
  async listPlans(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
  ) {
    return this.planService.findPlansByConfig(configId);
  }

  @Post('configurations/:configId/plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create plan', description: 'Create a new plan under a configuration.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiResponse({ status: 201, description: 'Plan created.' })
  async createPlan(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Body() dto: CreatePlanDto,
  ) {
    return this.planService.createPlan(orgId, configId, dto);
  }

  @Put('configurations/:configId/plans/:planId')
  @ApiOperation({ summary: 'Update plan', description: 'Update a plan.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiParam({ name: 'planId', description: 'Plan short hash ID', example: 'PLN-B8C1' })
  @ApiResponse({ status: 200, description: 'Plan updated.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async updatePlan(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.planService.updatePlan(orgId, configId, planId, dto);
  }

  @Delete('configurations/:configId/plans/:planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete plan', description: 'Delete a plan and its benefits.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiParam({ name: 'planId', description: 'Plan short hash ID', example: 'PLN-B8C1' })
  @ApiResponse({ status: 204, description: 'Plan deleted.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async deletePlan(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Param('planId') planId: string,
  ) {
    return this.planService.deletePlan(orgId, configId, planId);
  }

  // ====================== BENEFITS ======================

  @Get('configurations/:configId/plans/:planId/benefits')
  @ApiOperation({ summary: 'List benefits', description: 'List all benefits for a plan.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiParam({ name: 'planId', description: 'Plan short hash ID', example: 'PLN-B8C1' })
  @ApiResponse({ status: 200, description: 'List of benefits.' })
  async listBenefits(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Param('planId') planId: string,
  ) {
    return this.benefitService.getBenefitsByPlan(planId);
  }

  @Post('configurations/:configId/plans/:planId/benefits')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Set benefits', description: 'Bulk set benefits for a plan (replaces existing).' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiParam({ name: 'planId', description: 'Plan short hash ID', example: 'PLN-B8C1' })
  @ApiResponse({ status: 201, description: 'Benefits set.' })
  async setBenefits(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Param('planId') planId: string,
    @Body() dtos: CreatePlanBenefitDto[],
  ) {
    return this.benefitService.setBenefits(orgId, planId, dtos);
  }

  @Put('configurations/:configId/plans/:planId/benefits/:benId')
  @ApiOperation({ summary: 'Update benefit', description: 'Update a specific benefit record.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'configId', description: 'Configuration short hash ID', example: 'PCG-A3F2' })
  @ApiParam({ name: 'planId', description: 'Plan short hash ID', example: 'PLN-B8C1' })
  @ApiParam({ name: 'benId', description: 'Benefit short hash ID', example: 'BNF-92AF' })
  @ApiResponse({ status: 200, description: 'Benefit updated.' })
  @ApiResponse({ status: 404, description: 'Benefit not found.' })
  async updateBenefit(
    @Param('orgId') orgId: string,
    @Param('configId') configId: string,
    @Param('planId') planId: string,
    @Param('benId') benId: string,
    @Body() dto: UpdatePlanBenefitDto,
  ) {
    return this.benefitService.updateBenefit(orgId, benId, dto);
  }
}

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
import { DemoSegmentService } from '../services/demo-segment.service';
import { CreateDemoSegmentDto } from '../models/dto/create-demo-segment.dto';
import { UpdateDemoSegmentDto } from '../models/dto/update-demo-segment.dto';
import { DemoSegmentResponseDto } from '../models/dto/demo-segment-response.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

/**
 * Demo segment management endpoints (Global namespace).
 * All routes enforce JWT authentication.
 * Builtin segments cannot be edited or deleted (403), but can be duplicated.
 */
@ApiTags('demo-segments')
@ApiBearerAuth()
@Controller('api/v1/G/demo/segments')
@UseGuards(JwtAuthGuard)
export class DemoSegmentController {
  constructor(private readonly demoSegmentService: DemoSegmentService) {}

  @Get()
  @ApiOperation({ summary: 'List all segments', description: 'List all demo segments (builtin + custom).' })
  @ApiResponse({ status: 200, description: 'List of segments returned.' })
  async findAll(): Promise<DemoSegmentResponseDto[]> {
    return this.demoSegmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get segment', description: 'Get a demo segment by ID.' })
  @ApiParam({ name: 'id', description: 'Demo segment short hash ID', example: 'DEM-A1B2' })
  @ApiResponse({ status: 200, description: 'Segment returned.' })
  @ApiResponse({ status: 404, description: 'Segment not found.' })
  async findOne(@Param('id') segmentId: string): Promise<DemoSegmentResponseDto> {
    return this.demoSegmentService.findOne(segmentId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create segment', description: 'Create a new custom demo segment.' })
  @ApiResponse({ status: 201, description: 'Segment created successfully.' })
  async create(
    @Body() dto: CreateDemoSegmentDto,
    @Req() req: { user: JwtPayload },
  ): Promise<DemoSegmentResponseDto> {
    return this.demoSegmentService.create(dto, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update segment', description: 'Update a demo segment. Returns 403 if builtin.' })
  @ApiParam({ name: 'id', description: 'Demo segment short hash ID', example: 'DEM-A1B2' })
  @ApiResponse({ status: 200, description: 'Segment updated successfully.' })
  @ApiResponse({ status: 403, description: 'Cannot modify builtin segment.' })
  @ApiResponse({ status: 404, description: 'Segment not found.' })
  async update(
    @Param('id') segmentId: string,
    @Body() dto: UpdateDemoSegmentDto,
  ): Promise<DemoSegmentResponseDto> {
    return this.demoSegmentService.update(segmentId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete segment', description: 'Delete a demo segment. Returns 403 if builtin.' })
  @ApiParam({ name: 'id', description: 'Demo segment short hash ID', example: 'DEM-A1B2' })
  @ApiResponse({ status: 204, description: 'Segment deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Cannot delete builtin segment.' })
  @ApiResponse({ status: 404, description: 'Segment not found.' })
  async remove(@Param('id') segmentId: string): Promise<void> {
    return this.demoSegmentService.remove(segmentId);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate segment', description: 'Duplicate a demo segment (works for builtin and custom).' })
  @ApiParam({ name: 'id', description: 'Demo segment short hash ID to duplicate', example: 'DEM-A1B2' })
  @ApiResponse({ status: 201, description: 'Segment duplicated successfully.' })
  @ApiResponse({ status: 404, description: 'Segment not found.' })
  async duplicate(
    @Param('id') segmentId: string,
    @Req() req: { user: JwtPayload },
  ): Promise<DemoSegmentResponseDto> {
    return this.demoSegmentService.duplicate(segmentId, req.user.sub);
  }
}

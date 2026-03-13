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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DemoPlaylistService } from '../services/demo-playlist.service';
import { CreateDemoPlaylistDto } from '../models/dto/create-demo-playlist.dto';
import { UpdateDemoPlaylistDto } from '../models/dto/update-demo-playlist.dto';
import { DemoPlaylistResponseDto } from '../models/dto/demo-playlist-response.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';

/**
 * Demo playlist management endpoints (User namespace).
 * All routes enforce JWT authentication and user namespace isolation.
 */
@ApiTags('demo-playlists')
@ApiBearerAuth()
@Controller('api/v1/U/:userId/demo/playlists')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class DemoPlaylistController {
  constructor(private readonly demoPlaylistService: DemoPlaylistService) {}

  @Get()
  @ApiOperation({ summary: 'List playlists', description: 'List all demo playlists for a user.' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-81F3' })
  @ApiResponse({ status: 200, description: 'List of playlists returned.' })
  async findAll(@Param('userId') userId: string): Promise<DemoPlaylistResponseDto[]> {
    return this.demoPlaylistService.findAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create playlist', description: 'Create a new demo playlist.' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-81F3' })
  @ApiResponse({ status: 201, description: 'Playlist created successfully.' })
  async create(
    @Param('userId') userId: string,
    @Body() dto: CreateDemoPlaylistDto,
  ): Promise<DemoPlaylistResponseDto> {
    return this.demoPlaylistService.create(userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update playlist', description: 'Update a demo playlist.' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-81F3' })
  @ApiParam({ name: 'id', description: 'Playlist short hash ID', example: 'DPL-A1B2' })
  @ApiResponse({ status: 200, description: 'Playlist updated successfully.' })
  @ApiResponse({ status: 404, description: 'Playlist not found.' })
  async update(
    @Param('userId') userId: string,
    @Param('id') playlistId: string,
    @Body() dto: UpdateDemoPlaylistDto,
  ): Promise<DemoPlaylistResponseDto> {
    return this.demoPlaylistService.update(userId, playlistId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete playlist', description: 'Delete a demo playlist.' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-81F3' })
  @ApiParam({ name: 'id', description: 'Playlist short hash ID', example: 'DPL-A1B2' })
  @ApiResponse({ status: 204, description: 'Playlist deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Playlist not found.' })
  async remove(
    @Param('userId') userId: string,
    @Param('id') playlistId: string,
  ): Promise<void> {
    return this.demoPlaylistService.remove(userId, playlistId);
  }
}

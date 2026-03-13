import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PreferencesService } from '../services/preferences.service';
import { UpsertPreferencesDto } from '../models/dto/upsert-preferences.dto';
import { JwtPayload } from '../middleware/jwt.strategy';

@ApiTags('preferences')
@ApiBearerAuth()
@Controller('api/v1/U/:userId/preferences')
@UseGuards(AuthGuard('jwt'))
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-0113' })
  @ApiResponse({ status: 200, description: 'Preferences returned (empty object if none saved).' })
  async get(
    @Param('userId') userId: string,
    @Req() req: Request,
  ): Promise<Record<string, unknown>> {
    this.enforceOwnership(req, userId);
    return this.preferencesService.get(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Save user preferences (full replace)' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-0113' })
  @ApiResponse({ status: 200, description: 'Preferences saved.' })
  async upsert(
    @Param('userId') userId: string,
    @Body() dto: UpsertPreferencesDto,
    @Req() req: Request,
  ): Promise<Record<string, unknown>> {
    const user = req.user as JwtPayload;
    this.enforceOwnership(req, userId);
    return this.preferencesService.upsert(userId, user.org, dto.preferences);
  }

  /**
   * Users can only read/write their own preferences.
   */
  private enforceOwnership(req: Request, userId: string) {
    const user = req.user as JwtPayload;
    if (user.sub !== userId) {
      throw new ForbiddenException('Cannot access another user\'s preferences');
    }
  }
}

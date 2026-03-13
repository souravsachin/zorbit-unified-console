import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaylistEntryDto {
  @ApiProperty({ description: 'Segment ID', example: 'DEM-A1B2' })
  @IsString()
  @IsNotEmpty()
  segment_id!: string;

  @ApiProperty({ description: 'Sequence number', example: 1 })
  @IsInt()
  seq!: number;

  @ApiPropertyOptional({ description: 'Auto-play this segment', example: true })
  @IsBoolean()
  @IsOptional()
  auto_play?: boolean;
}

export class CreateDemoPlaylistDto {
  @ApiProperty({ description: 'Playlist title', example: 'New User Onboarding' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Playlist description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Ordered segment entries', type: [PlaylistEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistEntryDto)
  @IsOptional()
  segments?: PlaylistEntryDto[];
}

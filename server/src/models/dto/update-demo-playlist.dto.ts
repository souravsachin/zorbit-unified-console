import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlaylistEntryDto } from './create-demo-playlist.dto';

export class UpdateDemoPlaylistDto {
  @ApiPropertyOptional({ description: 'Playlist title' })
  @IsString()
  @IsOptional()
  title?: string;

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

import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DemoSegmentType } from '../entities/demo-segment.entity';
import { DemoStepDto } from './create-demo-segment.dto';

export class UpdateDemoSegmentDto {
  @ApiPropertyOptional({ description: 'Segment title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Segment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Duration display string' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({ description: 'Segment type', enum: DemoSegmentType })
  @IsEnum(DemoSegmentType)
  @IsOptional()
  type?: DemoSegmentType;

  @ApiPropertyOptional({ description: 'Category for filtering' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Interactive steps', type: [DemoStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DemoStepDto)
  @IsOptional()
  steps?: DemoStepDto[];

  @ApiPropertyOptional({ description: 'Video URL for video-type segments' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Enable TTS narration' })
  @IsBoolean()
  @IsOptional()
  ttsEnabled?: boolean;
}

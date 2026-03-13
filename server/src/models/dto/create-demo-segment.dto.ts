import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DemoSegmentType, StepAction } from '../entities/demo-segment.entity';

export class DemoStepDto {
  @ApiProperty({ description: 'Step sequence number', example: 1 })
  seq!: number;

  @ApiProperty({ description: 'Step action', enum: StepAction, example: StepAction.NAVIGATE })
  @IsEnum(StepAction)
  action!: StepAction;

  @ApiProperty({ description: 'CSS selector or route target', example: '/dashboard' })
  @IsString()
  target!: string;

  @ApiPropertyOptional({ description: 'Text to type, info message, etc.', example: 'Welcome to Zorbit!' })
  @IsString()
  @IsOptional()
  value!: string;

  @ApiPropertyOptional({ description: 'Wait duration in milliseconds', example: 1000 })
  @IsOptional()
  delay_ms!: number;

  @ApiPropertyOptional({ description: 'TTS narration text', example: 'This is the main dashboard.' })
  @IsString()
  @IsOptional()
  narration!: string;
}

export class CreateDemoSegmentDto {
  @ApiProperty({ description: 'Segment title', example: 'Login & Dashboard Overview' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Segment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Duration display string', example: '3:00' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiProperty({ description: 'Segment type', enum: DemoSegmentType, example: DemoSegmentType.INTERACTIVE })
  @IsEnum(DemoSegmentType)
  type!: DemoSegmentType;

  @ApiPropertyOptional({ description: 'Category for filtering', example: 'onboarding' })
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

  @ApiPropertyOptional({ description: 'Enable TTS narration', example: true })
  @IsBoolean()
  @IsOptional()
  ttsEnabled?: boolean;
}

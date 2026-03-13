import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigurationStageDto {
  @ApiProperty({
    description: 'Stage name to update',
    example: 'product_details',
    enum: [
      'insurer_details',
      'product_details',
      'taxonomy_selection',
      'base_plan_configuration',
      'encounter_benefits',
      'review',
      'publish',
    ],
  })
  @IsString()
  @IsNotEmpty()
  stage!: string;

  @ApiProperty({ description: 'Stage-specific data payload' })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'New status (e.g. in_review, approved)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Purpose of this edit for audit trail' })
  @IsString()
  @IsOptional()
  purposeOfEdit?: string;
}

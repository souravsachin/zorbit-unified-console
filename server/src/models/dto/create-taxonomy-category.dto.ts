import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxonomyCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Ambulatory / Outpatient Encounters' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'medical-bag' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Flexible metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateTaxonomyCategoryDto {
  @ApiPropertyOptional({ description: 'Category name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Icon identifier' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Flexible metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

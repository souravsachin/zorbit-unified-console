import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxonomyItemDto {
  @ApiProperty({ description: 'Item name', example: 'Primary Care Visits' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the item is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Flexible metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateTaxonomyItemDto {
  @ApiPropertyOptional({ description: 'Item name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the item is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Flexible metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

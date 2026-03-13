import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxonomyStatus } from '../entities/taxonomy.entity';

export class CreateTaxonomyDto {
  @ApiProperty({ description: 'Taxonomy name', example: 'Healthcare Encounter Types' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Taxonomy description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Semantic version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Taxonomy status', enum: TaxonomyStatus, example: TaxonomyStatus.DRAFT })
  @IsEnum(TaxonomyStatus)
  @IsOptional()
  status?: TaxonomyStatus;
}

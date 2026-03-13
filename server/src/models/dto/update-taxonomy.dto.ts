import {
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaxonomyStatus } from '../entities/taxonomy.entity';

export class UpdateTaxonomyDto {
  @ApiPropertyOptional({ description: 'Taxonomy name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Taxonomy description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Semantic version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Taxonomy status', enum: TaxonomyStatus })
  @IsEnum(TaxonomyStatus)
  @IsOptional()
  status?: TaxonomyStatus;
}

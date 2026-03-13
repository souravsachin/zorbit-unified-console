import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConfigurationDto {
  @ApiProperty({ description: 'Insurer name', example: 'Zorbit Insurance Corp' })
  @IsString()
  @IsNotEmpty()
  insurerName!: string;

  @ApiPropertyOptional({ description: 'Insurer description' })
  @IsString()
  @IsOptional()
  insurerDescription?: string;

  @ApiPropertyOptional({ description: 'Insurer internal code', example: 'ZIC-001' })
  @IsString()
  @IsOptional()
  insurerInternalCode?: string;

  @ApiPropertyOptional({ description: 'Insurer regulator-assigned code' })
  @IsString()
  @IsOptional()
  insurerRegulatorCode?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Global Health Standard v1.0' })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional({ description: 'Product internal code' })
  @IsString()
  @IsOptional()
  productInternalCode?: string;

  @ApiPropertyOptional({ description: 'Product regulator-assigned code' })
  @IsString()
  @IsOptional()
  productRegulatorCode?: string;

  @ApiPropertyOptional({ description: 'Taxonomy ID to use', example: 'default' })
  @IsString()
  @IsOptional()
  taxonomyId?: string;

  @ApiPropertyOptional({ description: 'Configuration ID to inherit from' })
  @IsString()
  @IsOptional()
  inheritedFromConfigId?: string;

  @ApiPropertyOptional({ description: 'Plan ID to inherit from' })
  @IsString()
  @IsOptional()
  inheritedFromPlanId?: string;
}

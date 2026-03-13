import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Plan name', example: 'Gold Plan' })
  @IsString()
  @IsOptional()
  planName?: string;

  @ApiPropertyOptional({ description: 'Plan tier', example: 'Gold' })
  @IsString()
  @IsOptional()
  planTier?: string;

  @ApiPropertyOptional({ description: 'Regions', example: ['US', 'EU'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  regions?: string[];

  @ApiPropertyOptional({ description: 'ISO 4217 currency code', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Annual limit', example: 500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiPropertyOptional({ description: 'Deductible', example: 2000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deductible?: number;

  @ApiPropertyOptional({ description: 'Out-of-pocket maximum', example: 10000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  outOfPocketMax?: number;

  @ApiPropertyOptional({ description: 'Network restrictions', example: 'Both' })
  @IsString()
  @IsOptional()
  networkRestrictions?: string;

  @ApiPropertyOptional({ description: 'Waiting period in days', example: 30 })
  @IsInt()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number;
}

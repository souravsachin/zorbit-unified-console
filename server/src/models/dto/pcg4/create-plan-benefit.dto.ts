import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CopayRule, CoinsuranceRule, CustomParam, AdjudicationRules } from '../../entities/pcg4/plan-benefit.entity';

export class CreatePlanBenefitDto {
  @ApiProperty({ description: 'Parent plan ID', example: 'PLN-B8C1' })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiProperty({ description: 'Encounter category ID', example: 'ambulatory_outpatient' })
  @IsString()
  @IsNotEmpty()
  encounterCategoryId!: string;

  @ApiProperty({ description: 'Encounter category display name', example: 'Ambulatory / Outpatient Encounters' })
  @IsString()
  @IsNotEmpty()
  encounterCategory!: string;

  @ApiProperty({ description: 'Encounter type ID', example: 'primary_care_visits' })
  @IsString()
  @IsNotEmpty()
  encounterTypeId!: string;

  @ApiProperty({ description: 'Encounter type display name', example: 'Primary Care Visits' })
  @IsString()
  @IsNotEmpty()
  encounterType!: string;

  @ApiPropertyOptional({ description: 'Encounter description' })
  @IsString()
  @IsOptional()
  encounterDescription?: string;

  @ApiPropertyOptional({ description: 'Is this encounter covered?', default: true })
  @IsBoolean()
  @IsOptional()
  isCovered?: boolean;

  @ApiPropertyOptional({ description: 'Annual limit for this benefit', example: 50000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiPropertyOptional({ description: 'Waiting period in days', example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number;

  @ApiPropertyOptional({ description: 'Copay rule', example: { type: 'fixed', value: 30 } })
  @IsObject()
  @IsOptional()
  copay?: CopayRule;

  @ApiPropertyOptional({ description: 'Coinsurance rule', example: { type: 'percentage', value: 20 } })
  @IsObject()
  @IsOptional()
  coinsurance?: CoinsuranceRule;

  @ApiPropertyOptional({ description: 'Whether deductible applies', default: true })
  @IsBoolean()
  @IsOptional()
  deductibleApplies?: boolean;

  @ApiPropertyOptional({ description: 'Annual visit limit', example: 12 })
  @IsInt()
  @Min(0)
  @IsOptional()
  annualVisits?: number;

  @ApiPropertyOptional({ description: 'Lifetime limit', example: 1000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lifetimeLimit?: number;

  @ApiPropertyOptional({ description: 'Per-event cap', example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perEventCap?: number;

  @ApiPropertyOptional({ description: 'Authorization required?', default: false })
  @IsBoolean()
  @IsOptional()
  authorizationRequired?: boolean;

  @ApiPropertyOptional({ description: 'Authorization notes' })
  @IsString()
  @IsOptional()
  authorizationNotes?: string;

  @ApiPropertyOptional({ description: 'Coding standards', example: ['ICD-10', 'CPT'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  codingStandards?: string[];

  @ApiPropertyOptional({ description: 'Exclusions', example: ['Cosmetic procedures'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exclusions?: string[];

  @ApiPropertyOptional({ description: 'Custom parameters for extensibility' })
  @IsArray()
  @IsOptional()
  customParams?: CustomParam[];

  @ApiPropertyOptional({ description: 'Adjudication rules' })
  @IsObject()
  @IsOptional()
  adjudicationRules?: AdjudicationRules;

  @ApiPropertyOptional({ description: 'Plan-specific overrides' })
  @IsObject()
  @IsOptional()
  overrides?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

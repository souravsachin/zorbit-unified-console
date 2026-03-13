import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CopayRule, CoinsuranceRule, CustomParam, AdjudicationRules } from '../../entities/pcg4/plan-benefit.entity';

export class UpdatePlanBenefitDto {
  @ApiPropertyOptional({ description: 'Is this encounter covered?' })
  @IsBoolean()
  @IsOptional()
  isCovered?: boolean;

  @ApiPropertyOptional({ description: 'Annual limit for this benefit', example: 50000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiPropertyOptional({ description: 'Waiting period in days' })
  @IsInt()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number;

  @ApiPropertyOptional({ description: 'Copay rule' })
  @IsObject()
  @IsOptional()
  copay?: CopayRule;

  @ApiPropertyOptional({ description: 'Coinsurance rule' })
  @IsObject()
  @IsOptional()
  coinsurance?: CoinsuranceRule;

  @ApiPropertyOptional({ description: 'Whether deductible applies' })
  @IsBoolean()
  @IsOptional()
  deductibleApplies?: boolean;

  @ApiPropertyOptional({ description: 'Annual visit limit' })
  @IsInt()
  @Min(0)
  @IsOptional()
  annualVisits?: number;

  @ApiPropertyOptional({ description: 'Lifetime limit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lifetimeLimit?: number;

  @ApiPropertyOptional({ description: 'Per-event cap' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perEventCap?: number;

  @ApiPropertyOptional({ description: 'Authorization required?' })
  @IsBoolean()
  @IsOptional()
  authorizationRequired?: boolean;

  @ApiPropertyOptional({ description: 'Authorization notes' })
  @IsString()
  @IsOptional()
  authorizationNotes?: string;

  @ApiPropertyOptional({ description: 'Coding standards' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  codingStandards?: string[];

  @ApiPropertyOptional({ description: 'Exclusions' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exclusions?: string[];

  @ApiPropertyOptional({ description: 'Custom parameters' })
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

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Encounter description' })
  @IsString()
  @IsOptional()
  encounterDescription?: string;
}

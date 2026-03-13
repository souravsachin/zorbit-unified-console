import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WorkflowStateDto {
  @ApiProperty({ description: 'State identifier', example: 'draft' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'Display label', example: 'Draft' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ description: 'Hex color for badge', example: '#6B7280' })
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ description: 'Icon name', example: 'file-edit' })
  @IsString()
  @IsNotEmpty()
  icon!: string;

  @ApiProperty({ description: 'Whether this is a final state', example: false })
  @IsBoolean()
  isFinal!: boolean;

  @ApiPropertyOptional({ description: 'Role needed for this state actions', example: 'drafter' })
  @IsString()
  @IsOptional()
  requiredRole?: string;
}

export class WorkflowTransitionDto {
  @ApiProperty({ description: 'Source state id', example: 'draft' })
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({ description: 'Target state id', example: 'in_review' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({ description: 'Action identifier', example: 'submit_for_review' })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiProperty({ description: 'Display label', example: 'Submit for Review' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ description: 'Role required to perform this transition', example: 'drafter' })
  @IsString()
  @IsNotEmpty()
  requiredRole!: string;

  @ApiPropertyOptional({ description: 'Whether a comment is required', example: false })
  @IsBoolean()
  @IsOptional()
  requiresComment?: boolean;
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ description: 'Workflow name', example: 'product-configuration' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Workflow description', example: 'Product configuration approval workflow' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Workflow states', type: [WorkflowStateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStateDto)
  states!: WorkflowStateDto[];

  @ApiProperty({ description: 'Workflow transitions', type: [WorkflowTransitionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowTransitionDto)
  transitions!: WorkflowTransitionDto[];

  @ApiPropertyOptional({ description: 'Whether the workflow is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

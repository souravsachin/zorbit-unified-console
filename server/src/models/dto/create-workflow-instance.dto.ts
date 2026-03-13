import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowInstanceDto {
  @ApiProperty({ description: 'Workflow definition ID', example: 'WFL-A1B2' })
  @IsString()
  @IsNotEmpty()
  workflowDefinitionId!: string;

  @ApiProperty({ description: 'Entity type being tracked', example: 'product_configuration' })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiProperty({ description: 'Entity ID being tracked', example: 'PCF-92AF' })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiPropertyOptional({ description: 'User assigned to the instance', example: 'U-81F3' })
  @IsString()
  @IsOptional()
  assignedTo?: string;
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransitionWorkflowDto {
  @ApiProperty({ description: 'Transition action to perform', example: 'submit_for_review' })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiPropertyOptional({ description: 'Optional comment for the transition', example: 'Looks good, submitting for review.' })
  @IsString()
  @IsOptional()
  comment?: string;
}

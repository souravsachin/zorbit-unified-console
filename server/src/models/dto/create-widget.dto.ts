import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetType } from '../entities/widget.entity';

export class CreateWidgetDto {
  @ApiProperty({ description: 'Widget title', example: 'Total Customers' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Widget type', enum: WidgetType, example: WidgetType.COUNT })
  @IsEnum(WidgetType)
  type!: WidgetType;

  @ApiPropertyOptional({
    description: 'API path template for metric data',
    example: '/api/v1/O/{{org_id}}/customers/count',
  })
  @IsString()
  @IsOptional()
  metricQuery?: string;

  @ApiPropertyOptional({ description: 'Type-specific configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Role codes that can see this widget', example: ['super_admin', 'manager'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({ description: 'Grid position X', example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Grid position Y', example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  positionY?: number;

  @ApiPropertyOptional({ description: 'Grid width', example: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  positionW?: number;

  @ApiPropertyOptional({ description: 'Grid height', example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  positionH?: number;
}

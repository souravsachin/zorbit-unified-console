import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetType } from '../entities/widget.entity';

export class UpdateWidgetDto {
  @ApiPropertyOptional({ description: 'Widget title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Widget type', enum: WidgetType })
  @IsEnum(WidgetType)
  @IsOptional()
  type?: WidgetType;

  @ApiPropertyOptional({ description: 'API path template for metric data' })
  @IsString()
  @IsOptional()
  metricQuery?: string;

  @ApiPropertyOptional({ description: 'Type-specific configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Role codes that can see this widget' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({ description: 'Grid position X' })
  @IsInt()
  @Min(0)
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional({ description: 'Grid position Y' })
  @IsInt()
  @Min(0)
  @IsOptional()
  positionY?: number;

  @ApiPropertyOptional({ description: 'Grid width' })
  @IsInt()
  @Min(1)
  @IsOptional()
  positionW?: number;

  @ApiPropertyOptional({ description: 'Grid height' })
  @IsInt()
  @Min(1)
  @IsOptional()
  positionH?: number;
}

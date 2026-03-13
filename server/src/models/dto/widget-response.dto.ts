import { WidgetType } from '../entities/widget.entity';

export interface WidgetResponseDto {
  id: string;
  title: string;
  type: WidgetType;
  metricQuery: string | null;
  config: Record<string, unknown>;
  roles: string[];
  positionX: number;
  positionY: number;
  positionW: number;
  positionH: number;
  orgId: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

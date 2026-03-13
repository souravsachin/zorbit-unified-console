import { DemoSegmentType, DemoStep } from '../entities/demo-segment.entity';

export interface DemoSegmentResponseDto {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  type: DemoSegmentType;
  builtin: boolean;
  category: string | null;
  steps: DemoStep[];
  videoUrl: string | null;
  ttsEnabled: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

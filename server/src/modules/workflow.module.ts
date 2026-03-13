import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowController } from '../controllers/workflow.controller';
import { WorkflowService } from '../services/workflow.service';
import { HashIdService } from '../services/hash-id.service';
import { WorkflowDefinition } from '../models/entities/workflow.entity';
import { WorkflowInstance } from '../models/entities/workflow-instance.entity';
import { EventsModule } from './events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowDefinition, WorkflowInstance]),
    EventsModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService, HashIdService],
  exports: [WorkflowService],
})
export class WorkflowModule {}

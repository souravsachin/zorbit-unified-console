import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { HashIdService } from '../services/hash-id.service';
import { Widget } from '../models/entities/widget.entity';
import { EventsModule } from './events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Widget]), EventsModule],
  controllers: [DashboardController],
  providers: [DashboardService, HashIdService],
  exports: [DashboardService],
})
export class DashboardModule {}

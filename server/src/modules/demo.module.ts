import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoSegmentController } from '../controllers/demo-segment.controller';
import { DemoPlaylistController } from '../controllers/demo-playlist.controller';
import { DemoSegmentService } from '../services/demo-segment.service';
import { DemoPlaylistService } from '../services/demo-playlist.service';
import { HashIdService } from '../services/hash-id.service';
import { DemoSegment } from '../models/entities/demo-segment.entity';
import { DemoPlaylist } from '../models/entities/demo-playlist.entity';
import { EventsModule } from './events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DemoSegment, DemoPlaylist]),
    EventsModule,
  ],
  controllers: [DemoSegmentController, DemoPlaylistController],
  providers: [DemoSegmentService, DemoPlaylistService, HashIdService],
  exports: [DemoSegmentService, DemoPlaylistService],
})
export class DemoModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from '../models/entities/user-preference.entity';
import { PreferencesService } from '../services/preferences.service';
import { PreferencesController } from '../controllers/preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreference])],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}

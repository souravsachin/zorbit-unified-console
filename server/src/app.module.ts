import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardModule } from './modules/dashboard.module';
import { DemoModule } from './modules/demo.module';
import { AuthModule } from './modules/auth.module';
import { EventsModule } from './modules/events.module';
import { Widget } from './models/entities/widget.entity';
import { DemoSegment } from './models/entities/demo-segment.entity';
import { DemoPlaylist } from './models/entities/demo-playlist.entity';
import { WorkflowDefinition } from './models/entities/workflow.entity';
import { WorkflowInstance } from './models/entities/workflow-instance.entity';
import { Taxonomy } from './models/entities/taxonomy.entity';
import { TaxonomyCategory } from './models/entities/taxonomy-category.entity';
import { TaxonomyItem } from './models/entities/taxonomy-item.entity';
import { ProductConfiguration } from './models/entities/pcg4/product-configuration.entity';
import { ProductPlan } from './models/entities/pcg4/product-plan.entity';
import { PlanBenefit } from './models/entities/pcg4/plan-benefit.entity';
import { HealthController } from './controllers/health.controller';
import { SeedModule } from './modules/seed.module';
import { Pcg4SeedModule } from './modules/pcg4-seed.module';
import { WorkflowModule } from './modules/workflow.module';
import { TaxonomyModule } from './modules/taxonomy.module';
import { PCG4Module } from './modules/pcg4.module';
import { PreferencesModule } from './modules/preferences.module';
import { UserPreference } from './models/entities/user-preference.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5440),
        database: config.get<string>('DATABASE_NAME', 'admin_console'),
        username: config.get<string>('DATABASE_USER', 'zorbit'),
        password: config.get<string>('DATABASE_PASSWORD', 'zorbit_dev'),
        entities: [Widget, DemoSegment, DemoPlaylist, WorkflowDefinition, WorkflowInstance, Taxonomy, TaxonomyCategory, TaxonomyItem, ProductConfiguration, ProductPlan, PlanBenefit, UserPreference],
        synchronize: config.get<string>('DATABASE_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    EventsModule,
    DashboardModule,
    DemoModule,
    WorkflowModule,
    TaxonomyModule,
    PCG4Module,
    PreferencesModule,
    SeedModule,
    Pcg4SeedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

import { DataSource } from 'typeorm';
import { Widget } from '../models/entities/widget.entity';
import { DemoSegment } from '../models/entities/demo-segment.entity';
import { DemoPlaylist } from '../models/entities/demo-playlist.entity';

/**
 * TypeORM data source for CLI migrations.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5440', 10),
  database: process.env.DATABASE_NAME || 'admin_console',
  username: process.env.DATABASE_USER || 'zorbit',
  password: process.env.DATABASE_PASSWORD || 'zorbit_dev',
  entities: [Widget, DemoSegment, DemoPlaylist],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});

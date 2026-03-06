import { DataSource } from 'typeorm';
import { Position } from './position/domain/position.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'orga_structure',
  entities: [Position],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});

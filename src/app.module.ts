import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Position } from './position/domain/position.entity';
import { PositionModule } from './position/position.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'root'),
        database: config.get<string>('DB_DATABASE', 'orga_structure'),
        entities: [Position],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    PositionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {
    console.log('Database connected:', dataSource.isInitialized);
  }
}

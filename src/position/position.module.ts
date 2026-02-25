import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Position } from './domain/position.entity';
import { PositionController } from './presentation/position.controller';

// Command Handlers
import {
  CreatePositionHandler,
  UpdatePositionHandler,
  DeletePositionHandler,
} from './application/commands';

// Query Handlers
import {
  GetPositionHandler,
  GetPositionTreeHandler,
  GetPositionChildrenHandler,
} from './application/queries';

const CommandHandlers = [
  CreatePositionHandler,
  UpdatePositionHandler,
  DeletePositionHandler,
];

const QueryHandlers = [
  GetPositionHandler,
  GetPositionTreeHandler,
  GetPositionChildrenHandler,
];

@Module({
  imports: [TypeOrmModule.forFeature([Position]), CqrsModule],
  controllers: [PositionController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class PositionModule {}

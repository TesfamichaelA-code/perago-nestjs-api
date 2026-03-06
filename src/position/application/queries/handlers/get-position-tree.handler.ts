import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';

import { GetPositionTreeQuery } from '../get-position-tree.query';
import { Position } from '../../../domain/position.entity';

@QueryHandler(GetPositionTreeQuery)
export class GetPositionTreeHandler implements IQueryHandler<GetPositionTreeQuery> {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: TreeRepository<Position>,
  ) {}

  async execute(_query: GetPositionTreeQuery): Promise<Position[]> {
    return this.positionRepository.findTrees();
  }
}

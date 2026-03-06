import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { GetPositionQuery } from '../get-position.query';
import { Position } from '../../../domain/position.entity';

@QueryHandler(GetPositionQuery)
export class GetPositionHandler implements IQueryHandler<GetPositionQuery> {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: TreeRepository<Position>,
  ) {}

  async execute(query: GetPositionQuery): Promise<Position> {
    const position = await this.positionRepository.findOne({
      where: { id: query.id },
      relations: ['parent'],
    });

    if (!position) {
      throw new NotFoundException(`Position with ID "${query.id}" not found`);
    }

    return position;
  }
}

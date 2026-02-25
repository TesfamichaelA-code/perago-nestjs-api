import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { GetPositionChildrenQuery } from '../get-position-children.query';
import { Position } from '../../../domain/position.entity';

@QueryHandler(GetPositionChildrenQuery)
export class GetPositionChildrenHandler
  implements IQueryHandler<GetPositionChildrenQuery>
{
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: TreeRepository<Position>,
  ) {}

  async execute(query: GetPositionChildrenQuery): Promise<Position> {
    const position = await this.positionRepository.findOne({
      where: { id: query.id },
    });

    if (!position) {
      throw new NotFoundException(
        `Position with ID "${query.id}" not found`,
      );
    }

    return this.positionRepository.findDescendantsTree(position);
  }
}

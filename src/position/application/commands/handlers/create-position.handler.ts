import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { CreatePositionCommand } from '../create-position.command';
import { Position } from '../../../domain/position.entity';

@CommandHandler(CreatePositionCommand)
export class CreatePositionHandler
  implements ICommandHandler<CreatePositionCommand>
{
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: TreeRepository<Position>,
  ) {}

  async execute(command: CreatePositionCommand): Promise<Position> {
    const { name, description, parentId } = command;

    let parent: Position | null = null;

    if (parentId) {
      parent = await this.positionRepository.findOne({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent position with ID "${parentId}" not found`,
        );
      }
    }

    const position = this.positionRepository.create({
      name,
      description,
      parentId,
      parent,
    });

    return this.positionRepository.save(position);
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { UpdatePositionCommand } from '../update-position.command';
import { Position } from '../../../domain/position.entity';

@CommandHandler(UpdatePositionCommand)
export class UpdatePositionHandler implements ICommandHandler<UpdatePositionCommand> {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: TreeRepository<Position>,
  ) {}

  async execute(command: UpdatePositionCommand): Promise<Position> {
    const { id, name, description, parentId } = command;

    const position = await this.positionRepository.findOne({
      where: { id },
    });

    if (!position) {
      throw new NotFoundException(`Position with ID "${id}" not found`);
    }

    if (name !== undefined) {
      position.name = name;
    }

    if (description !== undefined) {
      position.description = description;
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        position.parent = null;
        position.parentId = null;
      } else {
        const parent = await this.positionRepository.findOne({
          where: { id: parentId },
        });

        if (!parent) {
          throw new NotFoundException(
            `Parent position with ID "${parentId}" not found`,
          );
        }

        position.parent = parent;
        position.parentId = parentId;
      }
    }

    return this.positionRepository.save(position);
  }
}

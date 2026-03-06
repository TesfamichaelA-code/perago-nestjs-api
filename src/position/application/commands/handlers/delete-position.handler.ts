import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { DeletePositionCommand } from '../delete-position.command';
import { Position } from '../../../domain/position.entity';

@CommandHandler(DeletePositionCommand)
export class DeletePositionHandler implements ICommandHandler<DeletePositionCommand> {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: TreeRepository<Position>,
  ) {}

  async execute(command: DeletePositionCommand): Promise<void> {
    const { id } = command;

    const position = await this.positionRepository.findOne({
      where: { id },
    });

    if (!position) {
      throw new NotFoundException(`Position with ID "${id}" not found`);
    }

    // Check if the position has children — prevent deletion if so.
    // This is a guarded-deletion strategy: the consumer must explicitly
    // reassign or remove child positions before deleting a parent.
    const children = await this.positionRepository.find({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new ConflictException(
        `Cannot delete position "${position.name}" because it has ${children.length} child position(s). ` +
          `Reassign or remove all child positions before deleting this one.`,
      );
    }

    await this.positionRepository.remove(position);
  }
}

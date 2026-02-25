import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { PositionController } from './position.controller';
import { CreatePositionDto, UpdatePositionDto } from '../application/dtos';
import { CreatePositionCommand } from '../application/commands/create-position.command';
import { UpdatePositionCommand } from '../application/commands/update-position.command';
import { DeletePositionCommand } from '../application/commands/delete-position.command';
import { GetPositionQuery } from '../application/queries/get-position.query';
import { GetPositionTreeQuery } from '../application/queries/get-position-tree.query';
import { GetPositionChildrenQuery } from '../application/queries/get-position-children.query';

describe('PositionController', () => {
  let controller: PositionController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockPosition = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'CEO',
    description: 'Chief Executive Officer',
    parentId: null,
    children: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockChildPosition = {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'CTO',
    description: 'Chief Technology Officer',
    parentId: mockPosition.id,
    children: [],
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  };

  const mockTree = [
    {
      ...mockPosition,
      children: [mockChildPosition],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PositionController>(PositionController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a root position (CEO) with no parent', async () => {
      const dto: CreatePositionDto = {
        name: 'CEO',
        description: 'Chief Executive Officer',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(mockPosition);

      const result = await controller.create(dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreatePositionCommand('CEO', 'Chief Executive Officer', null),
      );
      expect(result).toEqual(mockPosition);
    });

    it('should create a child position with a parentId', async () => {
      const dto: CreatePositionDto = {
        name: 'CTO',
        description: 'Chief Technology Officer',
        parentId: mockPosition.id,
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(mockChildPosition);

      const result = await controller.create(dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreatePositionCommand(
          'CTO',
          'Chief Technology Officer',
          mockPosition.id,
        ),
      );
      expect(result).toEqual(mockChildPosition);
    });

    it('should propagate NotFoundException when parent does not exist', async () => {
      const dto: CreatePositionDto = {
        name: 'CTO',
        description: 'Chief Technology Officer',
        parentId: 'non-existent-uuid-0000-000000000000',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new NotFoundException('Parent position not found'));

      await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── GET TREE ─────────────────────────────────────────────────────────────

  describe('getTree', () => {
    it('should return the full position hierarchy tree', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockTree);

      const result = await controller.getTree();

      expect(queryBus.execute).toHaveBeenCalledWith(new GetPositionTreeQuery());
      expect(result).toEqual(mockTree);
      expect(result[0].children).toHaveLength(1);
    });

    it('should return an empty array when no positions exist', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue([]);

      const result = await controller.getTree();

      expect(result).toEqual([]);
    });
  });

  // ─── GET ONE ──────────────────────────────────────────────────────────────

  describe('getOne', () => {
    it('should return a single position by ID', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockPosition);

      const result = await controller.getOne(mockPosition.id);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetPositionQuery(mockPosition.id),
      );
      expect(result).toEqual(mockPosition);
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.getOne('non-existent-uuid-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── GET CHILDREN ─────────────────────────────────────────────────────────

  describe('getChildren', () => {
    it('should return descendants tree of a position', async () => {
      const descendantsTree = {
        ...mockPosition,
        children: [mockChildPosition],
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(descendantsTree);

      const result = await controller.getChildren(mockPosition.id);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetPositionChildrenQuery(mockPosition.id),
      );
      expect(result).toEqual(descendantsTree);
    });

    it('should throw NotFoundException for non-existent position', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.getChildren('non-existent-uuid-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a position name and description', async () => {
      const dto: UpdatePositionDto = {
        name: 'Chief Executive Officer',
        description: 'Updated CEO description',
      };

      const updatedPosition = {
        ...mockPosition,
        name: dto.name,
        description: dto.description,
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(updatedPosition);

      const result = await controller.update(mockPosition.id, dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdatePositionCommand(
          mockPosition.id,
          dto.name,
          dto.description,
          undefined,
        ),
      );
      expect(result.name).toBe('Chief Executive Officer');
    });

    it('should update parent (reassign position in hierarchy)', async () => {
      const newParentId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
      const dto: UpdatePositionDto = { parentId: newParentId };

      const updatedPosition = { ...mockChildPosition, parentId: newParentId };
      jest.spyOn(commandBus, 'execute').mockResolvedValue(updatedPosition);

      const result = await controller.update(mockChildPosition.id, dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdatePositionCommand(
          mockChildPosition.id,
          undefined,
          undefined,
          newParentId,
        ),
      );
      expect(result.parentId).toBe(newParentId);
    });

    it('should throw NotFoundException when position does not exist', async () => {
      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('non-existent-uuid-0000-000000000000', {
          name: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete a leaf position (no children)', async () => {
      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.delete(mockChildPosition.id);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new DeletePositionCommand(mockChildPosition.id),
      );
    });

    it('should throw ConflictException when deleting a position with children', async () => {
      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(
          new ConflictException('Position has child positions'),
        );

      await expect(controller.delete(mockPosition.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when position does not exist', async () => {
      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.delete('non-existent-uuid-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

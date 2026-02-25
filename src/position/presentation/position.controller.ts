import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreatePositionDto, UpdatePositionDto, PositionResponseDto } from '../application/dtos';
import { CreatePositionCommand } from '../application/commands/create-position.command';
import { UpdatePositionCommand } from '../application/commands/update-position.command';
import { DeletePositionCommand } from '../application/commands/delete-position.command';
import { GetPositionQuery } from '../application/queries/get-position.query';
import { GetPositionTreeQuery } from '../application/queries/get-position-tree.query';
import { GetPositionChildrenQuery } from '../application/queries/get-position-children.query';

@ApiTags('Positions')
@Controller('positions')
export class PositionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new position/role in the organizational hierarchy.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new position',
    description:
      'Creates a new employee position/role. Set parentId to null for the root (CEO) position.',
  })
  @ApiCreatedResponse({
    description: 'Position created successfully.',
    type: PositionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Parent position not found.',
  })
  async create(
    @Body() dto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.commandBus.execute(
      new CreatePositionCommand(dto.name, dto.description, dto.parentId ?? null),
    );
  }

  /**
   * Get the full organizational tree from all roots down.
   */
  @Get('tree')
  @ApiOperation({
    summary: 'Get full position hierarchy tree',
    description:
      'Returns all positions structured as a nested JSON tree starting from root (CEO) down to the lowest level.',
  })
  @ApiOkResponse({
    description: 'Position tree retrieved successfully.',
    type: [PositionResponseDto],
  })
  async getTree(): Promise<PositionResponseDto[]> {
    return this.queryBus.execute(new GetPositionTreeQuery());
  }

  /**
   * Get a single position by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single position',
    description: 'Retrieves the details of a specific position by its UUID.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the position', type: String })
  @ApiOkResponse({
    description: 'Position retrieved successfully.',
    type: PositionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Position not found.' })
  async getOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PositionResponseDto> {
    return this.queryBus.execute(new GetPositionQuery(id));
  }

  /**
   * Get all children/descendants of a specific position as a tree.
   */
  @Get(':id/children')
  @ApiOperation({
    summary: 'Get all descendants of a position',
    description:
      'Returns the position and all its children/descendants structured as a nested tree.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the parent position', type: String })
  @ApiOkResponse({
    description: 'Descendants retrieved successfully.',
    type: PositionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Position not found.' })
  async getChildren(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PositionResponseDto> {
    return this.queryBus.execute(new GetPositionChildrenQuery(id));
  }

  /**
   * Update an existing position.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a position',
    description:
      'Updates the name, description, or parent of an existing position.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the position to update', type: String })
  @ApiOkResponse({
    description: 'Position updated successfully.',
    type: PositionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Position or parent position not found.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.commandBus.execute(
      new UpdatePositionCommand(id, dto.name, dto.description, dto.parentId),
    );
  }

  /**
   * Delete a position by ID.
   * Deletion is blocked if the position has child positions.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a position',
    description:
      'Deletes a position. Fails with 409 Conflict if the position has child positions — reassign or remove children first.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the position to delete', type: String })
  @ApiOkResponse({ description: 'Position deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Position not found.' })
  @ApiConflictResponse({
    description: 'Position has children and cannot be deleted.',
  })
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeletePositionCommand(id));
  }
}

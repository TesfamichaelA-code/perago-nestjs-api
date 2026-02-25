import { ApiProperty } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({ description: 'Unique identifier (UUID)' })
  id: string;

  @ApiProperty({ description: 'Name of the position/role' })
  name: string;

  @ApiProperty({ description: 'Description of the position/role' })
  description: string;

  @ApiProperty({
    description: 'UUID of the parent position',
    nullable: true,
  })
  parentId: string | null;

  @ApiProperty({
    description: 'Nested child positions',
    type: () => [PositionResponseDto],
    required: false,
  })
  children?: PositionResponseDto[];
}

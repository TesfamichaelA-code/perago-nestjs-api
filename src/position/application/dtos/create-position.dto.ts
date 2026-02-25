import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Name of the position/role',
    example: 'CTO',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the position/role',
    example: 'Chief Technology Officer responsible for technology strategy',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'UUID of the parent position this role reports to. Null for root (CEO).',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

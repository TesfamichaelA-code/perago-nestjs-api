import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePositionDto {
  @ApiProperty({
    description: 'Updated name of the position/role',
    example: 'Chief Technology Officer',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Updated description of the position/role',
    example: 'Leads all technology and engineering teams',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'UUID of the new parent position this role reports to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

export class GuessOwnerDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the owner',
    format: 'uuid',
  })
  @IsUUID()
  id: string

  @ApiProperty({ example: 'Harry', description: 'First name of the user' })
  @IsString()
  firstName: string

  @ApiProperty({ example: 'Potter', description: 'Last name of the user' })
  @IsString()
  lastName: string

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL to the users avatar image' })
  @IsString()
  @IsOptional()
  avatarUrl?: string
}

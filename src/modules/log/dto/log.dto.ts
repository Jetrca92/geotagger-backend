import { ApiProperty } from '@nestjs/swagger'
import { ComponentType, UserActionType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { GuessOwnerDto } from 'modules/guess/dto/guess-owner.dto'

export class LogDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the log',
    format: 'uuid',
  })
  @IsUUID()
  id: string

  @ApiProperty({
    type: () => GuessOwnerDto,
    description: 'Owner details of the log',
  })
  user: GuessOwnerDto

  @ApiProperty({ example: 'CLICK', description: 'User action' })
  @IsEnum(UserActionType)
  @IsNotEmpty()
  action: UserActionType

  @ApiProperty({ example: 'BUTTON', description: 'Component type, null if action was scroll' })
  @IsOptional()
  @IsEnum(ComponentType)
  componentType?: ComponentType

  @ApiProperty({ example: 'Bled', description: 'New user imput' })
  @IsOptional()
  @IsString()
  newValue?: string

  @ApiProperty({ example: 'location/edit', description: 'Location of the action (URL)' })
  @IsString()
  location: string
}

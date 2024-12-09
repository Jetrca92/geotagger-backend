import { ApiProperty } from '@nestjs/swagger'
import { ComponentType, UserActionType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateLogDto {
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

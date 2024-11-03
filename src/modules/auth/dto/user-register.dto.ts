import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UserRegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  firstName: string

  @ApiProperty()
  @IsString()
  lastName: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string
}

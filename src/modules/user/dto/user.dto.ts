import { IsEmail, IsString } from 'class-validator'

export class UserDto {
  @IsString()
  id: string

  @IsEmail()
  email: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string
}

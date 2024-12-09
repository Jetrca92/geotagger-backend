import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @ApiProperty({
    example: 'password123',
    description: 'New password. Must be at least 6 characters long.',
  })
  @IsString()
  @MinLength(6)
  newPassword: string
}

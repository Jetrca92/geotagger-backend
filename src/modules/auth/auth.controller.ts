import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserLoginDto } from './dto/user-login.dto'
import { UserDto } from './dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: UserRegisterDto): Promise<UserDto> {
    return this.authService.register(dto.username, dto.password)
  }

  @Post('login')
  async login(@Body() dto: UserLoginDto): Promise<{ access_token: string }> {
    const user: UserDto = await this.authService.validateUser(dto.username, dto.password)
    return this.authService.login(user)
  }
}

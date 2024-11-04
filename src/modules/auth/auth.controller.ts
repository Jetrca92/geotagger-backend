import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserLoginDto } from './dto/user-login.dto'
import { UserDto } from '../user/dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { ConfigService } from '@nestjs/config'
import { EnvVars } from 'common/constants/env-vars.constant'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: UserRegisterDto): Promise<UserDto> {
    return this.authService.register(dto)
  }

  @Post('login')
  async login(@Body() dto: UserLoginDto): Promise<{ access_token: string }> {
    const user: UserDto = await this.authService.validateUser(dto.email, dto.password)
    return this.authService.login(user)
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const { access_token } = await this.authService.login(req.user)
    const baseUrl = this.configService.get<string>(EnvVars.DATABASE_HOST)
    return res.redirect(`http://${baseUrl}:8080/dashboard?token=${access_token}`)
  }

  @Post('forgot-password')
  async forgotPassword(@Body() { email }: { email: string }): Promise<void> {
    return this.authService.forgotPassword(email)
  }
}

import { Controller, Post, Body, Get, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserLoginDto } from './dto/user-login.dto'
import { UserDto } from '../user/dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { ConfigService } from '@nestjs/config'
import { EnvVars } from 'common/constants/env-vars.constant'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ForgotPasswordDto } from './dto/forgot-password.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Post('register')
  async register(@Body() dto: UserRegisterDto): Promise<UserDto> {
    return this.authService.register(dto)
  }

  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: String })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post('login')
  async login(@Body() dto: UserLoginDto): Promise<{ access_token: string }> {
    const user: UserDto = await this.authService.validateUser(dto.email, dto.password)
    return this.authService.login(user)
  }

  @ApiOperation({ summary: 'Redirect to Google for login' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @ApiOperation({ summary: 'Google login callback' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const { access_token } = await this.authService.login(req.user)
    const baseUrl = this.configService.get<string>(EnvVars.DATABASE_HOST)
    return res.redirect(`http://${baseUrl}:3000/dashboard?token=${access_token}`)
  }

  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiResponse({ status: 400, description: 'Invalid email address.' })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto.email)
  }
}

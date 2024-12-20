import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'utils/bcrypt'
import { DatabaseService } from 'modules/database/database.service'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { UserDto } from '../user/dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { UserService } from 'modules/user/user.service'
import { EmailService } from 'modules/email/email.service'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private jwtService: JwtService,
    private userService: UserService,
    private emailService: EmailService,
  ) {}

  async register(dto: UserRegisterDto): Promise<UserDto> {
    const hashedPassword = await bcrypt.hash(dto.password)
    return this.userService.create({
      ...dto,
      password: hashedPassword,
    })
  }

  async login(user: UserDto): Promise<{ access_token: string }> {
    const payload: JwtPayloadDto = { email: user.email, sub: user.id }
    Logger.log(`User with id ${user.id} successfully logged in`)
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        avatarUrl: true,
        points: true,
        isAdmin: true,
      },
    })

    if (!user) {
      Logger.warn(`User with email ${email} not found`)
      throw new NotFoundException(`User with email ${email} not found`)
    }

    const isMatch = await bcrypt.compareHash(password, user.password)
    if (!isMatch) {
      Logger.warn('Passwords do not match')
      throw new BadRequestException('Passwords do not match')
    }

    delete user.password // Remove password from the returned user
    Logger.log(`User with email ${email} validated.`)
    return user
  }

  async validateGoogleUser(googleUser: UserRegisterDto) {
    const user = await this.prisma.user.findUnique({ where: { email: googleUser.email } })
    if (user) return user
    const hashedPassword = await bcrypt.hash(googleUser.password, 10)
    return this.userService.create({
      ...googleUser,
      password: hashedPassword,
    })
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      Logger.warn(`No user found with email: ${email}`)
      throw new NotFoundException(`No user found for with email: ${email}`)
    }
    Logger.log(`Sent password reset link to email ${email}`)
    await this.emailService.sendResetPasswordLink(user)
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      Logger.warn(`User with ID ${id} not found.`)
      throw new BadRequestException('User not found')
    }

    const hashedOldPassword = await bcrypt.hash(user.password)
    const hashedNewPassword = await bcrypt.hash(resetPasswordDto.newPassword)
    if (!hashedNewPassword && !hashedOldPassword) {
      Logger.error('Error hashing passwords.')
      throw new InternalServerErrorException('Failed to update password')
    }

    if (hashedOldPassword === hashedNewPassword) {
      Logger.warn('New password cannot be the same as the current password.')
      throw new BadRequestException('New password cannot be the same as the current password')
    }

    const updatedUser = (await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
      },
    })) as UserDto

    Logger.log(`Password reset successfully for use id ${id}`)
    return updatedUser
  }
}

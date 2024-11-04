import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'utils/bcrypt'
import { DatabaseService } from 'modules/database/database.service'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { UserDto } from '../user/dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { hash } from 'utils/bcrypt'
import { UserService } from 'modules/user/user.service'
import { EmailService } from 'modules/email/email.service'

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private jwtService: JwtService,
    private userService: UserService,
    private emailService: EmailService,
  ) {}

  async register(dto: UserRegisterDto): Promise<UserDto> {
    const hashedPassword = await hash(dto.password, 10)
    return this.userService.create({
      ...dto,
      password: hashedPassword,
    })
  }

  async login(user: UserDto): Promise<{ access_token: string }> {
    const payload: JwtPayloadDto = { email: user.email, sub: user.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, password: true },
    })

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`)
    }

    const isMatch = await bcrypt.compareHash(password, user.password)
    if (!isMatch) {
      throw new BadRequestException('Passwords do not match')
    }

    delete user.password // Remove password from the returned user
    return user
  }

  async validateGoogleUser(googleUser: UserRegisterDto) {
    const user = await this.prisma.user.findUnique({ where: { email: googleUser.email } })
    if (user) return user
    const hashedPassword = await hash(googleUser.password, 10)
    return this.userService.create({
      ...googleUser,
      password: hashedPassword,
    })
  }

  async forgotPassword(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      Logger.log(`No user found with id: ${id}`)
      throw new NotFoundException(`No user found for with id: ${id}`)
    }
    await this.emailService.sendResetPasswordLink(user.email)
  }
}

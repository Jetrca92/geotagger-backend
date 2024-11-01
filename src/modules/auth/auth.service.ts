import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { DatabaseService } from 'modules/database/database.service'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { UserDto } from './dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { hash } from 'utils/bcrypt'
import { UserService } from 'modules/user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService, // Use PrismaService instead of InjectRepository
    private jwtService: JwtService,
    private userService: UserService,
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

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      throw new BadRequestException('Passwords do not match')
    }

    delete user.password // Remove password from the returned user

    return user
  }
}

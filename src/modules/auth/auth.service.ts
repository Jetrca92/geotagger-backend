import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { DatabaseService } from 'modules/database/database.service'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { UserDto } from './dto/user.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService, // Use PrismaService instead of InjectRepository
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string): Promise<UserDto> {
    const userExists = await this.prisma.user.findUnique({
      where: { username },
    })

    if (userExists) {
      throw new BadRequestException(`${username} is already taken`)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    })

    delete user.password
    return user as UserDto
  }

  async login(user: UserDto): Promise<{ access_token: string }> {
    const payload: JwtPayloadDto = { username: user.username, sub: user.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, password: true },
    })

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`)
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      throw new BadRequestException('Passwords do not match')
    }

    delete user.password // Remove password from the returned user

    return user
  }
}

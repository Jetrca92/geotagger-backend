import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { UserDto } from 'modules/auth/dto/user.dto'
import { DatabaseService } from 'modules/database/database.service'

@Injectable()
export class UserService {
  constructor(private prisma: DatabaseService) {}

  async create(createUserDto: UserRegisterDto): Promise<UserDto> {
    if (!createUserDto.email || !createUserDto.password) {
      Logger.log('Email and password are required for creating user.')
      throw new BadRequestException('Email and password are required.')
    }
    const user = await this.prisma.user.findUnique({ where: { email: createUserDto.email } })
    if (user) {
      Logger.log('User with that email already exists')
      throw new BadRequestException('User with that email already exists.')
    }
    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: createUserDto.password,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
      })

      delete newUser.password
      return newUser as UserDto
    } catch (error) {
      Logger.log(error)
      throw new InternalServerErrorException('Something went wrong while creating a new user.')
    }
  }
}

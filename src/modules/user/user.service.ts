import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { UserDto } from 'modules/user/dto/user.dto'
import { DatabaseService } from 'modules/database/database.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdatePasswordDto } from './dto/update-password.dto'

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
          avatarUrl: createUserDto.avatarUrl,
        },
      })

      delete newUser.password
      return newUser as UserDto
    } catch (error) {
      Logger.log(error)
      throw new InternalServerErrorException('Something went wrong while creating a new user.')
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = (await this.prisma.user.findUnique({ where: { id } })) as UserDto
    const updates: Partial<UserDto> = {}

    if (user.email !== updateUserDto.email && updateUserDto.email) {
      updates.email = updateUserDto.email
    }

    if (updateUserDto.firstName) updates.firstName = updateUserDto.firstName
    if (updateUserDto.lastName) updates.lastName = updateUserDto.lastName

    if (Object.keys(updates).length === 0) {
      Logger.log('No fields to update')
      throw new BadRequestException('No fields to update')
    }

    return this.prisma.user.update({
      where: { id },
      data: updates,
    })
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserDto> {
    const user = (await this.prisma.user.findUnique({ where: { id } })) as UserDto
    // compare pws
    if (!updatePasswordDto.newPassword) {
      Logger.log('New password must be provided')
      throw new BadRequestException('New password must be provided')
    }
    if (updatePasswordDto.newPassword.length < 6) {
      Logger.log('Password must be at least 6 characters long')
      throw new BadRequestException('Password must be at least 6 characters long')
    }
    

  }
}

import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { DatabaseService } from 'modules/database/database.service'
import { UserRegisterDto } from 'modules/auth/dto/user-register.dto'
import { BadRequestException } from '@nestjs/common'
import { S3Service } from 'modules/s3service/s3service.service'
import { EmailModule } from 'modules/email/email.module'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

describe('UserService', () => {
  let service: UserService
  const createdUser = {
    id: '044740a9-2f5d-4e97-9afb-dc48f400164a',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: 'http://exapmle.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    points: 10,
    password: 'password',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmailModule, ConfigModule],
      providers: [
        S3Service,
        UserService,
        JwtService,
        {
          provide: DatabaseService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(createdUser),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: UserRegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      }

      const result = await service.create(createUserDto)
      expect(result).toEqual(createdUser)
    })

    it('should throw BadRequestException if email or password is missing', async () => {
      const createUserDto: UserRegisterDto = { email: '', password: '', firstName: 'John', lastName: 'Doe' }
      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException)
    })
  })
})

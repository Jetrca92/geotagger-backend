import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { DatabaseService } from 'modules/database/database.service'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { UserDto } from './dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UpdatePasswordDto } from './dto/update-password.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { S3Service } from 'modules/s3service/s3service.service'
import * as multer from 'multer'

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private prisma: DatabaseService,
    private s3Service: S3Service,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/upload/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.memoryStorage(), // Store file in memory
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Param('id') userId: string): Promise<UserDto> {
    if (!file) {
      Logger.warn('File must be uploaded')
      throw new BadRequestException('File must be uploaded')
    }
    const imageUrl = await this.s3Service.uploadFile(file)
    return this.userService.updateUser(userId, { avatarUrl: imageUrl })
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'The current user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async findCurrentUser(@GetCurrentUserById() userId: string): Promise<UserDto> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, points: true },
    })
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: 200, description: 'The updated user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/update-user')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUser(@Body() updateUserDto: UpdateUserDto, @GetCurrentUserById() userId: string): Promise<UserDto> {
    return this.userService.updateUser(userId, updateUserDto)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user password' })
  @ApiResponse({ status: 200, description: 'The updated user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/update-password')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetCurrentUserById() userId: string,
  ): Promise<UserDto> {
    return this.userService.updatePassword(userId, updatePasswordDto)
  }
}

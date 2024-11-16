import {
  BadRequestException,
  Body,
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
import { MapsService } from 'modules/maps/maps.service'
import { LocationService } from './location.service'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { CreateLocationDto } from './dto/create-location.dto'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { LocationDto } from './dto/location.dto'
import { DatabaseService } from 'modules/database/database.service'
import { UpdateLocationDto } from './dto/update-location.dto'
import { AuthGuard } from '@nestjs/passport'
import { FileInterceptor } from '@nestjs/platform-express'
import * as multer from 'multer'
import { S3Service } from 'modules/s3service/s3service.service'

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(
    private readonly googleMapsService: MapsService,
    private readonly locationService: LocationService,
    private prisma: DatabaseService,
    private s3Service: S3Service,
  ) {}

  @ApiOperation({ summary: 'Return list of latest locations' })
  @ApiResponse({ status: 200, description: 'List of latest locations', type: LocationDto })
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getLocations(): Promise<LocationDto[]> {
    return this.prisma.location.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @ApiOperation({ summary: 'Return a random location' })
  @ApiResponse({ status: 200, description: 'Random location', type: LocationDto })
  @Get('/random')
  @HttpCode(HttpStatus.OK)
  async getRandomLocation(): Promise<LocationDto> {
    return this.locationService.getRandomLocation()
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return a list of users locations' })
  @ApiResponse({ status: 200, description: 'List of latest user locations', type: LocationDto })
  @UseGuards(AuthGuard('jwt'))
  @Get('/user-locations')
  @HttpCode(HttpStatus.OK)
  async getUserLocations(@GetCurrentUserById() userId: string): Promise<LocationDto[]> {
    return this.prisma.location.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  async addLocation(
    @GetCurrentUserById() userId: string,
    @Body() locationDto: CreateLocationDto,
  ): Promise<LocationDto> {
    return this.locationService.createLocation(locationDto, userId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update location information' })
  @ApiResponse({ status: 200, description: 'Updated location' })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/:id')
  async updateLocation(
    @Param('id') locationId: string,
    @GetCurrentUserById() userId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<LocationDto> {
    return this.locationService.updateLocation(userId, locationId, updateLocationDto)
  }

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
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') locationId: string,
    @GetCurrentUserById() userId: string,
  ): Promise<LocationDto> {
    if (!file) {
      Logger.warn('File must be uploaded')
      throw new BadRequestException('File must be uploaded')
    }
    const imageUrl = await this.s3Service.uploadFile(file)
    return this.locationService.updateLocation(locationId, userId, { imageUrl: imageUrl })
  }
}

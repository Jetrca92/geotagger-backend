import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async addLocation(
    @GetCurrentUserById() userId: string,
    @Body() locationDto: CreateLocationDto,
  ): Promise<LocationDto> {
    return this.locationService.createLocation(locationDto, userId)
  }

  @ApiOperation({ summary: 'Return a location based on id' })
  @ApiResponse({ status: 200, description: 'Location', type: LocationDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiParam({
    name: 'locationId',
    description: 'The ID of the location',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Get('/location/:locationId')
  @HttpCode(HttpStatus.OK)
  async getLocationById(@Param('locationId', ParseUUIDPipe) locationId: string): Promise<LocationDto> {
    return this.locationService.getLocationById(locationId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update location information' })
  @ApiResponse({ status: 200, description: 'Updated location', type: LocationDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({
    name: 'locationId',
    description: 'The ID of the location',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/location/:locationId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateLocation(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @GetCurrentUserById() userId: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<LocationDto> {
    return this.locationService.updateLocation(userId, locationId, updateLocationDto)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete location' })
  @ApiResponse({ status: 200, description: 'Deleted location' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({
    name: 'locationId',
    description: 'The ID of the location',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @Delete('/location/:locationId')
  @HttpCode(HttpStatus.OK)
  async deleteLocation(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @GetCurrentUserById() userId: string,
  ): Promise<LocationDto> {
    return this.locationService.deleteLocation(userId, locationId)
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
  @ApiParam({
    name: 'locationId',
    description: 'The ID of the location',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/upload/:locationId')
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
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @GetCurrentUserById() userId: string,
  ): Promise<LocationDto> {
    if (!file) {
      Logger.warn('File must be uploaded')
      throw new BadRequestException('File must be uploaded')
    }
    const imageUrl = await this.s3Service.uploadFile(file)
    return this.locationService.updateLocation(userId, locationId, { imageUrl: imageUrl })
  }
}

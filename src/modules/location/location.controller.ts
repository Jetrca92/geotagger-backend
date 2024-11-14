import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { MapsService } from 'modules/maps/maps.service'
import { LocationService } from './location.service'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { CreateLocationDto } from './dto/create-location.dto'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LocationDto } from './dto/location.dto'
import { DatabaseService } from 'modules/database/database.service'
import { UpdateLocationDto } from './dto/update-location.dto'
import { AuthGuard } from '@nestjs/passport'

@Controller('location')
export class LocationController {
  constructor(
    private readonly googleMapsService: MapsService,
    private readonly locationService: LocationService,
    private prisma: DatabaseService,
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
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
}

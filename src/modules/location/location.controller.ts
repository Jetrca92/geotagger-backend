import { Body, Controller, Get, Post } from '@nestjs/common'
import { MapsService } from 'modules/maps/maps.service'
import { LocationService } from './location.service'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { CreateLocationDto } from './dto/create-location.dto'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LocationDto } from './dto/location.dto'

@Controller('location')
export class LocationController {
  constructor(
    private readonly googleMapsService: MapsService,
    private readonly locationService: LocationService,
  ) {}

  @ApiOperation({ summary: 'Return list of latest locations' })
  @ApiResponse({ status: 200, description: 'List of latest locations', type: LocationDto })
  @Get('')
  @Post('')
  async addLocation(
    @GetCurrentUserById() userId: string,
    @Body() locationDto: CreateLocationDto,
  ): Promise<LocationDto> {
    return this.locationService.createLocation(locationDto, userId)
  }
}

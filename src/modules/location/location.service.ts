import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { DatabaseService } from 'modules/database/database.service'
import { CreateLocationDto } from './dto/create-location.dto'
import { LocationDto } from './dto/location.dto'

@Injectable()
export class LocationService {
  constructor(private readonly prisma: DatabaseService) {}

  async createLocation(locationDto: CreateLocationDto, userId: string) {
    try {
      const newLocation = await this.prisma.location.create({
        data: {
          latitude: locationDto.latitude,
          longitude: locationDto.longitude,
          imageUrl: locationDto.imageUrl,
          address: locationDto.address,
          ownerId: userId,
        },
      })
      Logger.log(`Location successfully created for user ${userId}`)
      return newLocation as LocationDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to create location')
    }
  }
}

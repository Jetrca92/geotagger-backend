import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { DatabaseService } from 'modules/database/database.service'
import { CreateLocationDto } from './dto/create-location.dto'
import { LocationDto } from './dto/location.dto'
import { UpdateLocationDto } from './dto/update-location.dto'

@Injectable()
export class LocationService {
  constructor(private readonly prisma: DatabaseService) {}

  async createLocation(locationDto: CreateLocationDto, userId: string): Promise<LocationDto> {
    if (!userId) {
      Logger.warn('UserId not provided while creating a new location')
      throw new UnauthorizedException('User must be authenticated to create a new location')
    }
    try {
      const newLocation = await this.prisma.location.create({
        data: {
          latitude: locationDto.latitude,
          longitude: locationDto.longitude,
          address: locationDto.address,
          owner: {
            connect: { id: userId },
          },
        },
      })
      Logger.log(`Location successfully created for user ${userId}`)
      return newLocation as LocationDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to create location')
    }
  }

  async updateLocation(locationId: string, userId: string, updateLocationDto: UpdateLocationDto): Promise<LocationDto> {
    const location = (await this.prisma.location.findUnique({ where: { id: locationId } })) as LocationDto

    if (!location) {
      Logger.warn('Location not found')
      throw new BadRequestException('Location not found')
    }

    if (location.ownerId !== userId) {
      Logger.warn('You are not the owner of location')
      throw new UnauthorizedException('You are not the owner.')
    }

    const updates: Partial<LocationDto> = {}
    if (updateLocationDto.address) updates.address = updateLocationDto.address
    if (updateLocationDto.imageUrl) updates.imageUrl = updateLocationDto.imageUrl
    if (updateLocationDto.latitude) updates.latitude = updateLocationDto.latitude
    if (updateLocationDto.longitude) updates.longitude = updateLocationDto.longitude

    if (Object.keys(updates).length === 0) {
      Logger.warn('No fields to update.')
      throw new BadRequestException('No fields to update.')
    }

    Logger.log(`Location updated successfully.`)
    return this.prisma.location.update({
      where: { id: locationId },
      data: updates,
      select: { id: true, latitude: true, longitude: true, imageUrl: true, address: true, ownerId: true },
    })
  }

  async getRandomLocation(): Promise<LocationDto> {
    const count = await this.prisma.location.count()

    if (count === 0) {
      Logger.warn('No locations found')
      throw new NotFoundException('No locations found')
    }

    const randomOffset = Math.floor(Math.random() * count)
    const [location] = await this.prisma.location.findMany({
      take: 1,
      skip: randomOffset,
    })

    return {
      id: location.id,
      latitude: location.latitude,
      longitude: location.longitude,
      imageUrl: location.imageUrl,
      address: location.address,
      ownerId: location.ownerId,
    }
  }
}

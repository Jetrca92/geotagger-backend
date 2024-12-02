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
import { S3Service } from 'modules/s3service/s3service.service'
import { UserService } from 'modules/user/user.service'
import { points } from 'common/constants/points.constant'

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly userService: UserService,
    private s3Service: S3Service,
  ) {}

  async createLocation(locationDto: CreateLocationDto, userId: string): Promise<LocationDto> {
    if (!userId) {
      Logger.warn('UserId not provided while creating a new location.')
      throw new UnauthorizedException('User must be authenticated to create a new location.')
    }
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const newLocation = await prisma.location.create({
          data: {
            latitude: locationDto.latitude,
            longitude: locationDto.longitude,
            address: locationDto.address,
            owner: {
              connect: { id: userId },
            },
          },
        })

        this.userService.updateUserPoints(points.UPLOAD_LOCATION, userId)

        return newLocation
      })

      Logger.log(`Location successfully created for user ${userId}`)
      return result as LocationDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to create location.')
    }
  }

  async getLocationById(locationId: string): Promise<LocationDto> {
    const location = (await this.prisma.location.findUnique({
      where: {
        id: locationId,
      },
    })) as LocationDto

    if (!location) {
      Logger.warn('Location not found.')
      throw new NotFoundException('Location not found.')
    }

    return location
  }
  async updateLocation(userId: string, locationId: string, updateLocationDto: UpdateLocationDto): Promise<LocationDto> {
    const location = (await this.prisma.location.findUnique({ where: { id: locationId } })) as LocationDto

    if (!location) {
      Logger.warn('Location not found.')
      throw new NotFoundException('Location not found.')
    }

    if (location.ownerId !== userId) {
      Logger.warn('You are not the owner of location.')
      throw new UnauthorizedException('You are not the owner.')
    }

    const updates: Partial<LocationDto> = {}
    if (updateLocationDto.address) updates.address = updateLocationDto.address
    if (updateLocationDto.latitude) updates.latitude = updateLocationDto.latitude
    if (updateLocationDto.longitude) updates.longitude = updateLocationDto.longitude

    if (updateLocationDto.imageUrl) {
      if (location.imageUrl) {
        try {
          await this.s3Service.deleteFile(location.imageUrl)
          Logger.log(`Old image at ${location.imageUrl} deleted successfully.`)
        } catch (error) {
          Logger.error('Failed to delete old image from S3:', error.message)
          throw new InternalServerErrorException('Failed to delete old image from S3.')
        }
      }
      updates.imageUrl = updateLocationDto.imageUrl
    }

    if (Object.keys(updates).length === 0) {
      Logger.warn('No fields to update.')
      throw new BadRequestException('No fields to update.')
    }

    try {
      const updatedLocation = await this.prisma.location.update({
        where: { id: locationId },
        data: updates,
        select: {
          id: true,
          latitude: true,
          longitude: true,
          imageUrl: true,
          address: true,
          ownerId: true,
        },
      })

      Logger.log(`Location with ID ${locationId} updated successfully.`)
      return updatedLocation
    } catch (error) {
      Logger.error('Failed to update location:', error.message)
      throw new InternalServerErrorException('Failed to update location.')
    }
  }

  async deleteLocation(userId: string, locationId: string): Promise<LocationDto> {
    const location = (await this.prisma.location.findUnique({ where: { id: locationId } })) as LocationDto

    if (!location) {
      Logger.warn('Location not found.')
      throw new BadRequestException('Location not found.')
    }

    if (location.ownerId !== userId) {
      Logger.warn('You are not the owner of location')
      throw new UnauthorizedException('You are not the owner.')
    }

    return await this.prisma.$transaction(async (transaction) => {
      if (location.imageUrl) {
        try {
          await this.s3Service.deleteFile(location.imageUrl)
        } catch (error) {
          Logger.error('Failed to delete file from S3:', error.message)
          throw new InternalServerErrorException('Failed to delete location file from S3.')
        }
      }

      const response = await transaction.location.delete({
        where: { id: locationId },
      })
      Logger.log(`Location with id ${location.id} deleted.`)
      return response
    })
  }

  async getRandomLocation(): Promise<LocationDto> {
    const count = await this.prisma.location.count()

    if (count === 0) {
      Logger.warn('No locations found.')
      throw new NotFoundException('No locations found.')
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

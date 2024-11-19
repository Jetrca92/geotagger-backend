import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { DatabaseService } from 'modules/database/database.service'
import { GuessDto } from './dto/guess.dto'
import { LocationDto } from 'modules/location/dto/location.dto'
import { calculateErrorDistance } from 'utils/calculateDistance'
import { CreateLocationDto } from 'modules/location/dto/create-location.dto'

@Injectable()
export class GuessService {
  constructor(private readonly prisma: DatabaseService) {}

  async createGuess(locationId: string, guessDto: CreateLocationDto, userId: string): Promise<GuessDto> {
    if (!userId) {
      Logger.warn('UserId not provided while creating a new guess.')
      throw new UnauthorizedException('User must be authenticated to create a new location.')
    }

    if (!locationId) {
      Logger.warn('LocationId not provided while creating a new guess.')
      throw new BadRequestException('LocationId missing from the request.')
    }

    const location = (await this.prisma.location.findUnique({ where: { id: locationId } })) as LocationDto

    if (!location) {
      Logger.warn('Location not found.')
      throw new BadRequestException('Location not found.')
    }

    if (location.ownerId === userId) {
      Logger.warn('User guessing on his location.')
      throw new UnauthorizedException('You cant guess on your location.')
    }

    const errorDistance = calculateErrorDistance(location, guessDto)
    try {
      const newGuess = await this.prisma.guess.create({
        data: {
          guessedLatitude: guessDto.latitude,
          guessedLongitude: guessDto.longitude,
          address: guessDto.address,
          errorDistance: errorDistance,
          owner: {
            connect: { id: userId },
          },
          location: {
            connect: { id: locationId },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      })
      Logger.log(`Guess successfully created for user ${userId} and location ${locationId}.`)
      return newGuess as GuessDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to create guess.')
    }
  }

  async getGuesses(locationId: string): Promise<GuessDto[]> {
    const count = await this.prisma.guess.count()

    if (count === 0) {
      Logger.warn('No guesses found.')
      throw new NotFoundException('No guesses found.')
    }

    return await this.prisma.guess.findMany({
      where: { locationId },
      orderBy: {
        errorDistance: 'asc',
      },
      take: 13,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })
  }
}

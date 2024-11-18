import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { DatabaseService } from 'modules/database/database.service'
import { CreateGuessDto } from './dto/create-guess.dto'
import { GuessDto } from './dto/guess.dto'
import { LocationDto } from 'modules/location/dto/location.dto'

@Injectable()
export class GuessService {
  constructor(private readonly prisma: DatabaseService) {}

  async createGuess(locationId: string, guessDto: CreateGuessDto, userId: string): Promise<GuessDto> {
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

    try {
      const newGuess = await this.prisma.guess.create({
        data: {
          guessedLatitude: guessDto.guessedLatitude,
          guessedLongitude: guessDto.guessedLongitude,
          errorDistance: 5, //TODO,
          owner: {
            connect: { id: userId },
          },
          location: {
            connect: { id: locationId },
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
}

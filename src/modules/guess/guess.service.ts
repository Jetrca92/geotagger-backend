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
import { UserService } from 'modules/user/user.service'
import { points } from 'common/constants/points.constant'
import { UserDto } from 'modules/user/dto/user.dto'

@Injectable()
export class GuessService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly userService: UserService,
  ) {}

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
    const user = (await this.prisma.user.findUnique({ where: { id: userId } })) as UserDto

    if (!location) {
      Logger.warn('Location not found while creating a guess.')
      throw new NotFoundException('Location not found.')
    }

    if (!user) {
      Logger.warn('User not found while creating a guess.')
      throw new BadRequestException('User not found')
    }

    if (location.ownerId === userId) {
      Logger.warn('User guessing on his location.')
      throw new UnauthorizedException('You cant guess on your location.')
    }

    const errorDistance = calculateErrorDistance(location, guessDto)
    const guessCount = await this.calculateGuessCount(locationId, userId)
    const pointsToDeduct =
      guessCount === 0 ? points.FIRST_GUESS : guessCount === 1 ? points.SECOND_GUESS : points.THIRD_GUESS

    if (Math.abs(pointsToDeduct) > user.points) {
      Logger.warn('Insufficient points for a new guess')
      throw new BadRequestException('Insufficient points for creating a new guess.')
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const newGuess = await prisma.guess.create({
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

        this.userService.updateUserPoints(pointsToDeduct, userId)
        return newGuess
      })

      Logger.log(`Guess successfully created for user ${userId} and location ${locationId}.`)
      return result as GuessDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to create guess.')
    }
  }

  private async calculateGuessCount(locationId: string, userId: string): Promise<number> {
    return await this.prisma.guess.count({
      where: {
        locationId,
        ownerId: userId,
      },
    })
  }

  async getGuesses(locationId: string): Promise<GuessDto[]> {
    const guesses = await this.prisma.guess.findMany({
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

    if (guesses.length === 0) {
      Logger.warn('No guesses found.')
      throw new NotFoundException('No guesses found.')
    }

    return guesses
  }

  async getUserGuesses(userId: string): Promise<GuessDto[]> {
    const guesses = await this.prisma.guess.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
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

    if (guesses.length === 0) {
      Logger.warn('No guesses found.')
      throw new NotFoundException('No guesses found.')
    }

    return guesses
  }
}

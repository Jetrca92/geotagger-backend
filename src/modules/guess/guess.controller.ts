import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { GuessService } from './guess.service'
import { DatabaseService } from 'modules/database/database.service'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { GuessDto } from './dto/guess.dto'
import { CreateLocationDto } from 'modules/location/dto/create-location.dto'

@ApiTags('location/guess')
@Controller('location/guess')
export class GuessController {
  constructor(
    private readonly guessService: GuessService,
    private readonly prisma: DatabaseService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return a list of users guesses' })
  @ApiResponse({ status: 200, description: 'List of latest user guesses', type: GuessDto })
  @UseGuards(AuthGuard('jwt'))
  @Get('/user-guesses')
  @HttpCode(HttpStatus.OK)
  async getUserLocations(@GetCurrentUserById() userId: string): Promise<GuessDto[]> {
    return this.prisma.guess.findMany({
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
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Guess the location lat/long' })
  @ApiResponse({ status: 201, description: 'Guess successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiParam({
    name: 'locationId',
    description: 'The ID of the location',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @Post('/:locationId')
  async addGuess(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @GetCurrentUserById() userId: string,
    @Body() guessDto: CreateLocationDto,
  ): Promise<GuessDto> {
    return this.guessService.createGuess(locationId, guessDto, userId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return a list of guesses for specific location' })
  @ApiResponse({ status: 200, description: 'List of latest guesses for specific location', type: GuessDto })
  @ApiParam({
    name: 'locationId',
    description: 'The ID of the location',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Get('/:locationId')
  async getGuesses(@Param('locationId', ParseUUIDPipe) locationId: string): Promise<GuessDto[]> {
    return this.guessService.getGuesses(locationId)
  }
}

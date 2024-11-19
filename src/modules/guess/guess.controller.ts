import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { GuessService } from './guess.service'
import { DatabaseService } from 'modules/database/database.service'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
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
  @ApiOperation({ summary: 'Guess the location lat/long' })
  @ApiResponse({ status: 201, description: 'Guess successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('/:id')
  async addGuess(
    @Param('id') locationId: string,
    @GetCurrentUserById() userId: string,
    @Body() guessDto: CreateLocationDto,
  ): Promise<GuessDto> {
    return this.guessService.createGuess(locationId, guessDto, userId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return a list of guesses for specific location' })
  @ApiResponse({ status: 200, description: 'List of latest guesses for specific location', type: GuessDto })
  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  async getGuesses(@Param('id') locationId: string): Promise<GuessDto[]> {
    return this.guessService.getGuesses(locationId)
  }
}

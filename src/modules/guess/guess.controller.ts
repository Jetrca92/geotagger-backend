import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { GuessService } from './guess.service'
import { DatabaseService } from 'modules/database/database.service'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { CreateGuessDto } from './dto/create-guess.dto'
import { GuessDto } from './dto/guess.dto'

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
    @Body() guessDto: CreateGuessDto,
  ): Promise<GuessDto> {
    return this.guessService.createGuess(locationId, guessDto, userId)
  }
}

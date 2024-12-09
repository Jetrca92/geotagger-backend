import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DatabaseService } from 'modules/database/database.service'
import { LogService } from './log.service'
import { AuthGuard } from '@nestjs/passport'
import { CreateLogDto } from './dto/create-log.dto'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { LogDto } from './dto/log.dto'

@ApiTags('log')
@Controller('log')
export class LogController {
  constructor(
    private prisma: DatabaseService,
    private readonly logService: LogService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log user action' })
  @ApiResponse({ status: 201, description: 'Log successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async logAction(@GetCurrentUserById() userId: string, @Body() logDto: CreateLogDto): Promise<LogDto> {
    return this.logService.createLog(logDto, userId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get last 100 logs' })
  @ApiResponse({ status: 200, description: 'Return last 100 logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(AuthGuard('jwt'))
  @Get('')
  async getLogs(): Promise<LogDto[]> {
    return this.logService.getLogs()
  }
}

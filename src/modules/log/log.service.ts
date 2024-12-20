import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common'
import { DatabaseService } from 'modules/database/database.service'
import { CreateLogDto } from './dto/create-log.dto'
import { LogDto } from './dto/log.dto'

@Injectable()
export class LogService {
  constructor(private readonly prisma: DatabaseService) {}

  async createLog(logDto: CreateLogDto, userId: string): Promise<LogDto> {
    if (!userId) {
      Logger.warn('UserId not provided while creating a new log.')
      throw new UnauthorizedException('User must be authenticated to create a new log.')
    }
    try {
      const newLog = await this.prisma.userActionLog.create({
        data: {
          action: logDto.action,
          componentType: logDto.componentType,
          newValue: logDto.newValue,
          location: logDto.location,
          user: {
            connect: { id: userId },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      })

      Logger.log(`Log successfully created for user ${userId}`)
      return newLog as LogDto
    } catch (error) {
      Logger.error(error)
      throw new InternalServerErrorException('Failed to create a log.')
    }
  }

  async getLogs(): Promise<LogDto[]> {
    const logs = await this.prisma.userActionLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      take: 100,
    })

    if (logs.length === 0) {
      Logger.warn('No logs found.')
      return []
    }

    return logs
  }
}

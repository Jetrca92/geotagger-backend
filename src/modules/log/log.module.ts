import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { LogService } from './log.service'
import { DatabaseService } from 'modules/database/database.service'
import { LogController } from './log.controller'

@Module({
  imports: [DatabaseModule],
  providers: [LogService, DatabaseService],
  controllers: [LogController],
})
export class LogModule {}

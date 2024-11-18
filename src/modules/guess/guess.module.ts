import { Module } from '@nestjs/common'
import { GuessController } from './guess.controller'
import { GuessService } from './guess.service'
import { DatabaseModule } from 'modules/database/database.module'
import { DatabaseService } from 'modules/database/database.service'

@Module({
  imports: [DatabaseModule],
  controllers: [GuessController],
  providers: [GuessService, DatabaseService],
})
export class GuessModule {}

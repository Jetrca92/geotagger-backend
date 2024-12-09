import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { DatabaseService } from 'modules/database/database.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { S3Service } from 'modules/s3service/s3service.service'

@Module({
  imports: [DatabaseModule],
  providers: [DatabaseService, UserService, S3Service],
  controllers: [UserController],
})
export class UserModule {}

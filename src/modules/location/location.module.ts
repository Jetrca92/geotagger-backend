import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { LocationService } from './location.service'
import { DatabaseService } from 'modules/database/database.service'
import { LocationController } from './location.controller'
import { HttpModule } from '@nestjs/axios'
import { S3Service } from 'modules/s3service/s3service.service'
import { UserService } from 'modules/user/user.service'

@Module({
  imports: [DatabaseModule, HttpModule],
  providers: [LocationService, DatabaseService, S3Service, UserService],
  controllers: [LocationController],
})
export class LocationModule {}

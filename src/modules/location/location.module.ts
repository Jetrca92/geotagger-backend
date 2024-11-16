import { Module } from '@nestjs/common'
import { DatabaseModule } from 'modules/database/database.module'
import { LocationService } from './location.service'
import { DatabaseService } from 'modules/database/database.service'
import { LocationController } from './location.controller'
import { MapsService } from 'modules/maps/maps.service'
import { HttpModule } from '@nestjs/axios'
import { S3Service } from 'modules/s3service/s3service.service'

@Module({
  imports: [DatabaseModule, HttpModule],
  providers: [LocationService, DatabaseService, MapsService, S3Service],
  controllers: [LocationController],
})
export class LocationModule {}

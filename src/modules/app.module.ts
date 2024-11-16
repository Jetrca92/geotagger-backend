import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { EmailModule } from './email/email.module'
import { UserModule } from './user/user.module'
import { LocationModule } from './location/location.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    EmailModule,
    UserModule,
    LocationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

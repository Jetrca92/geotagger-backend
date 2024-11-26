import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { EmailModule } from './email/email.module'
import { UserModule } from './user/user.module'
import { LocationModule } from './location/location.module'
import { GuessModule } from './guess/guess.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.STAGE || 'development'}`,
    }),
    DatabaseModule,
    AuthModule,
    EmailModule,
    UserModule,
    LocationModule,
    GuessModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

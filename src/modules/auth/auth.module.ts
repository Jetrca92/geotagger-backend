import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { DatabaseModule } from 'modules/database/database.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { EnvVars } from 'common/constants/env-vars.constant'
import { JwtStrategy } from './jwt/jwt.strategy'
import { DatabaseService } from 'modules/database/database.service'

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(EnvVars.JWT_SECRET),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    DatabaseModule,
  ],
  providers: [AuthService, JwtStrategy, DatabaseService],
  controllers: [AuthController],
})
export class AuthModule {}

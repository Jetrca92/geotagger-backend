import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const initSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Geotagger')
    .setDescription('Geotagger API')
    .setVersion('1.0')
    .addTag('Guess Location')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
}

const initValidation = (app: INestApplication) =>
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  initSwagger(app)
  initValidation(app)

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    allowedHeaders: 'Authorization, Content-Type',
  })

  const PORT = process.env.PORT || 8080
  await app.listen(PORT)

  Logger.log(`App is listening on http://localhost:${PORT}`)
}

bootstrap()

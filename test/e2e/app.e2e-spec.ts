import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { DatabaseService } from '../../src/modules/database/database.service'
import { AppModule } from '../../src/modules/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication
  let databaseService: DatabaseService
  let userToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    databaseService = moduleFixture.get(DatabaseService)
    await app.init()
  })

  afterAll(async () => {
    await databaseService.user.deleteMany()
    await app.close()
  })

  describe('Auth', () => {
    describe('Register', () => {
      it('/auth/register (POST) should register new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'new@user.com', firstName: 'New', lastName: 'User', password: 'test123' })
          .expect(201)
      })

      it('/auth/register (POST) should return error because user already exists', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'new@user.com', firstName: 'New', lastName: 'User', password: 'test123' })
          .expect(400)
      })
    })

    describe('Login', () => {
      it('/auth/login (POST) should return access_token', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'new@user.com', password: 'test123' })
          .expect(201)
          .then((res) => {
            userToken = res.body.access_token
          })
      })

      it('/auth/login (POST) should return error because of wrong password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'new@user.com', password: 'test111' })
          .expect(400)
      })
    })

    describe('Forgot password', () => {
      it('/auth/forgot-password (POST) should send password reset mail', async () => {
        return request(app.getHttpServer())
          .post('/auth/forgot-password')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      })

      it('/auth/forgot-password (POST) should return error if unauthorized', () => {
        return request(app.getHttpServer()).post('/auth/forgot-password').expect(401)
      })

      it('/auth/forgot-password (POST) should return error if user does not exist', async () => {
        const invalidToken = 'invalidToken123'
        return request(app.getHttpServer())
          .post('/auth/forgot-password')
          .set('Authorization', `Bearer ${invalidToken}`)
          .expect(404)
      })
    })
  })

  console.log(userToken)
})

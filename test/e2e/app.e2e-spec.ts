import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import * as bcrypt from 'utils/bcrypt'
import { DatabaseService } from '../../src/modules/database/database.service'
import { AppModule } from '../../src/modules/app.module'
import { EmailService } from 'modules/email/email.service'
import { S3Service } from 'modules/s3service/s3service.service'
import { v4 as uuidv4 } from 'uuid'

describe('AppController (e2e)', () => {
  let app: INestApplication
  let databaseService: DatabaseService

  const mockEmailService = {
    sendResetPasswordLink: jest.fn().mockResolvedValue(undefined),
  }

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://mock-s3-url.com/mock-image.jpg'),
    deleteFile: jest.fn().mockRejectedValue(undefined),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .overrideProvider(S3Service)
      .useValue(mockS3Service)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    databaseService = moduleFixture.get(DatabaseService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Auth', () => {
    let userToken: string
    afterAll(async () => {
      await databaseService.user.deleteMany()
    })

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
      it('/auth/login (POST) should return access_token', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'new@user.com', password: 'test123' })
          .expect(201)

        userToken = res.body.access_token
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
          .then(() => {
            expect(mockEmailService.sendResetPasswordLink).toHaveBeenCalledWith('new@user.com')
          })
      })

      it('/auth/forgot-password (POST) should return error if unauthorized', () => {
        return request(app.getHttpServer()).post('/auth/forgot-password').expect(401)
      })

      it('/auth/forgot-password (POST) should return error if user does not exist', async () => {
        const invalidToken = 'invalidToken123'
        return request(app.getHttpServer())
          .post('/auth/forgot-password')
          .set('Authorization', `Bearer ${invalidToken}`)
          .expect(401)
      })
    })
  })

  describe('User', () => {
    let userToken: string
    let userId: string
    beforeAll(async () => {
      const uniqueUserId = uuidv4()
      const password = '123456'
      const hashedPassword = await bcrypt.hash(password)
      await databaseService.user.create({
        data: {
          id: uniqueUserId,
          firstName: 'test',
          lastName: 'user',
          email: `${uniqueUserId}@example.com`,
          password: hashedPassword,
          points: 10,
        },
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `${uniqueUserId}@example.com`, password: password })
        .expect(201)
      userToken = res.body.access_token
    })

    afterAll(async () => {
      await databaseService.user.deleteMany()
    })

    describe('Find current user', () => {
      it('/user (GET) should get current user', async () => {
        const response = await request(app.getHttpServer())
          .get('/user')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
        userId = response.body.id
      })

      it('/user (GET) should return error if unauthorized', () => {
        return request(app.getHttpServer()).get('/user').expect(401)
      })
    })

    describe('Update user', () => {
      it('/user/update-user (PATCH) should update current user', async () => {
        return request(app.getHttpServer())
          .patch('/user/update-user')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ firstName: 'Updated' })
          .expect(200)
          .then((res) => {
            expect(res.body.firstName).toBe('Updated')
          })
      })

      it('/user/update-user (PATCH) should return error if unauthorized', () => {
        return request(app.getHttpServer()).patch('/user/update-user').send({ firstName: 'Updated' }).expect(401)
      })
    })

    describe('Update user password', () => {
      it('/user/update-password (PATCH) should update current user', async () => {
        return request(app.getHttpServer())
          .patch('/user/update-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ currentPassword: '123456', newPassword: 'test1234' })
          .expect(200)
      })

      it('/user/update-password (PATCH) should return error if unauthorized', () => {
        return request(app.getHttpServer())
          .patch('/user/update-password')
          .send({ currentPassword: 'test1234', newPassword: 'test123' })
          .expect(401)
      })

      it('/user/update-password (PATCH) should return error if wrong current password', async () => {
        return request(app.getHttpServer())
          .patch('/user/update-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ currentPassword: 'test123', newPassword: 'test1234' })
          .expect(400)
      })
    })

    describe('Upload file to s3', () => {
      const mockFileBuffer = Buffer.from('mock-file-content')
      const file = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        buffer: mockFileBuffer,
        size: mockFileBuffer.length,
      }
      it('/user/upload/:id (POST) should upload file and return updated user', async () => {
        return request(app.getHttpServer())
          .post(`/user/upload/${userId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .attach('image', Buffer.from(file.buffer), file.originalname)
          .expect(201)
          .then((res) => {
            expect(res.body.avatarUrl).toBe('https://mock-s3-url.com/mock-image.jpg')
          })
      })

      it('/user/upload/:id (POST) should return error if unauthorized', async () => {
        return request(app.getHttpServer())
          .post(`/user/upload/${userId}`)
          .attach('image', Buffer.from(file.buffer), file.originalname)
          .expect(401)
      })

      it('/user/upload/:id (POST) should return error if no file', () => {
        return request(app.getHttpServer())
          .post(`/user/upload/${userId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(400)
      })
    })
  })

  describe('Location', () => {
    let userToken: string
    let uniqueUserId: string
    let locationId: string
    const wrongId: string = uuidv4()
    const password = '123456'

    beforeAll(async () => {
      uniqueUserId = uuidv4()
      const hashedPassword = await bcrypt.hash(password)
      await databaseService.user.create({
        data: {
          id: uniqueUserId,
          firstName: 'test',
          lastName: 'user',
          email: `${uniqueUserId}@example.com`,
          password: hashedPassword,
          points: 10,
        },
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `${uniqueUserId}@example.com`, password: password })
        .expect(201)
      userToken = res.body.access_token
    })

    afterAll(async () => {
      await databaseService.$disconnect()
      await databaseService.user.deleteMany()
      await databaseService.location.deleteMany()
    })

    describe('Get latest locations and user locations', () => {
      it('/location (GET) should return latest locations', () => {
        return request(app.getHttpServer()).get(`/location`).expect(200)
      })

      it('location/user-locations (GET) should return latests user locations', () => {
        return request(app.getHttpServer())
          .get('/location/user-locations')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      })

      it('location/user-locations (GET) should return error if unauthorized', () => {
        return request(app.getHttpServer()).get('/location/user-locations').expect(401)
      })
    })

    describe('Create a new location', () => {
      it('/location (POST) should create a new location', async () => {
        const res = await request(app.getHttpServer())
          .post(`/location`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ latitude: 46.258046, longitude: 15.121128, address: 'Rimska cesta 94a' })
          .expect(201)

        locationId = res.body.id
        expect(res.body).toHaveProperty('id')
        return res
      })

      it('/location (POST) should return error if unauthorized ', () => {
        return request(app.getHttpServer())
          .post(`/location`)
          .send({ latitude: 46.258046, longitude: 15.121128, address: 'Rimska cesta 94a' })
          .expect(401)
      })

      it('/location (POST) should throw error if bad dto', () => {
        return request(app.getHttpServer())
          .post(`/location`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ latitude: 46.258046, longitude: 15.121128, address: 6 })
          .expect(400)
      })
    })

    describe('Return a location by id', () => {
      it('/location/location/:locationId (GET) should return a location', () => {
        return request(app.getHttpServer())
          .get(`/location/location/${locationId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      })

      it('/location/location/:locationId (GET) should return error if bad id', () => {
        return request(app.getHttpServer()).get(`/location/location/notuuid`).expect(400)
      })

      it('/location/location/:locationId (GET) should return error if wrong id', () => {
        return request(app.getHttpServer()).get(`/location/location/${wrongId}`).expect(404)
      })
    })

    describe('Update location', () => {
      it('/location/location/:locationId (PATCH) should update location', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/location/location/${locationId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ longitude: 16 })
          .expect(200)
          .then((res) => {
            expect(res.body.longitude).toBe(16)
          })

        return res
      })

      it('/location/location/:locationId (PATCH) should return error if unauthorized', () => {
        return request(app.getHttpServer())
          .patch(`/location/location/${locationId}`)
          .send({ imageUrl: 'http://image.jpg' })
          .expect(401)
      })

      it('/location/location/:locationId (PATCH) should return not found if wrong id', () => {
        return request(app.getHttpServer())
          .patch(`/location/location/${wrongId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ imageUrl: 'http://image.jpg' })
          .expect(404)
      })
    })

    describe('Delete location', () => {
      it('/location/location/:locationId (DELETE) should return error if unauthorized', () => {
        return request(app.getHttpServer()).delete(`/location/location/${locationId}`).expect(401)
      })

      it('/location/location/:locationId (DELETE) should delete location', () => {
        return request(app.getHttpServer())
          .delete(`/location/location/${locationId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      })
    })
  })

  describe('Guess', () => {
    let userToken: string
    let uniqueUserId: string
    let uniqueUserLocationId: string
    let uniqueLocationId: string
    const wrongId: string = uuidv4()
    const password = '123456'

    beforeAll(async () => {
      await databaseService.$connect()
      uniqueUserId = uuidv4()
      uniqueLocationId = uuidv4()
      uniqueUserLocationId = uuidv4()
      const hashedPassword = await bcrypt.hash(password)
      await databaseService.user.create({
        data: {
          id: uniqueUserId,
          firstName: 'test',
          lastName: 'user',
          email: `${uniqueUserId}@example.com`,
          password: hashedPassword,
          points: 10,
        },
      })

      await databaseService.user.create({
        data: {
          id: uniqueUserLocationId,
          firstName: 'test1',
          lastName: 'user1',
          email: `${uniqueUserLocationId}@example.com`,
          password: hashedPassword,
          points: 10,
        },
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `${uniqueUserId}@example.com`, password: password })
        .expect(201)
      userToken = res.body.access_token

      await databaseService.location.create({
        data: {
          id: uniqueLocationId,
          latitude: 46.37833,
          longitude: 13.83666,
          address: 'Triglav',
          ownerId: uniqueUserLocationId,
        },
      })
    })

    afterAll(async () => {
      await databaseService.$disconnect()
      await databaseService.user.deleteMany()
      await databaseService.location.deleteMany()
    })

    describe('Create a guess', () => {
      it('/location/guess/:locationId (POST) should create a new guess', () => {
        return request(app.getHttpServer())
          .post(`/location/guess/${uniqueLocationId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ latitude: 44.258046, longitude: 14.121128, address: 'Rimska cesta 1a' })
          .expect(201)
      })

      it('/location/guess/:locationId (POST) should return error if unauthorized', () => {
        return request(app.getHttpServer())
          .post(`/location/guess/${uniqueLocationId}`)
          .send({ latitude: 44.258046, longitude: 14.121128, address: 'Rimska cesta 1a' })
          .expect(401)
      })

      it('/location/guess/:locationId (POST) should return error if wrong id', () => {
        return request(app.getHttpServer())
          .post(`/location/guess/${wrongId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ latitude: 44.258046, longitude: 14.121128, address: 'Rimska cesta 1a' })
          .expect(404)
      })
    })

    describe('Get user guesses', () => {
      it('location/guess/user-guesses (GET) should return latests user guesses', () => {
        return request(app.getHttpServer())
          .get('/location/guess/user-guesses')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      })

      it('location/guess/user-guesses (GET) should return error if unauthorized', () => {
        return request(app.getHttpServer()).get('/location/guess/user-guesses').expect(401)
      })
    })

    describe('Get location guesses', () => {
      it('location/guess/:locationId (GET) should return latests guesses for that location', () => {
        return request(app.getHttpServer())
          .get(`/location/guess/${uniqueLocationId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      })

      it('location/guess/:locationId (GET) should throw error if unauthorized', () => {
        return request(app.getHttpServer()).get(`/location/guess/${uniqueLocationId}`).expect(401)
      })

      it('location/guess/:locationId (GET) should throw error if wrong id', () => {
        return request(app.getHttpServer())
          .get(`/location/guess/${wrongId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(404)
      })
    })
  })
})

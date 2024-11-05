import { Injectable, Logger } from '@nestjs/common'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { ConfigService } from '@nestjs/config'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { EnvVars } from 'common/constants/env-vars.constant'

@Injectable()
export class S3Service {
  private readonly s3: S3Client
  private readonly bucketName: string

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.get(EnvVars.AWS_REGION),
      credentials: {
        accessKeyId: configService.get(EnvVars.AWS_ACCESS_KEY_ID),
        secretAccessKey: configService.get(EnvVars.AWS_SECRET_ACCESS_KEY),
      },
    })
    this.bucketName = configService.get(EnvVars.AWS_S3_BUCKET_NAME)
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileExt = extname(file.originalname)
    const fileName = `${uuidv4()}${fileExt}`
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })

    await this.s3.send(command)
    Logger.log('File uploaded to s3')
    return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${fileName}`
  }
}

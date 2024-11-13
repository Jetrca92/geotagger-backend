import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, Max, Min } from 'class-validator'

export class CreateLocationDto {
  @ApiProperty({ example: 46.258046, description: 'Latitude number' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number

  @ApiProperty({ example: 15.121128, description: 'Longitude number' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  imageUrl: string

  @ApiProperty({ example: 'Rimska cesta 94a', description: 'Location address' })
  @IsString()
  address: string
}

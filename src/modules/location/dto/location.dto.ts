import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, IsUUID, Max, Min } from 'class-validator'

export class LocationDto {
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

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Owner ID of the user' })
  @IsUUID()
  ownerId: string
}

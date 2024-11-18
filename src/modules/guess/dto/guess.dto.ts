import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNumber, IsString, IsUUID, Max, Min } from 'class-validator'

export class GuessDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the location',
    format: 'uuid',
  })
  @IsUUID()
  id: string

  @ApiProperty({ example: 46.258046, description: 'Latitude number' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-90, { message: 'Latitude must be valid (at least -90)' })
  @Max(90, { message: 'Latitude must be valit (cannot exceed 90)' })
  guessedLatitude: number

  @ApiProperty({ example: 15.121128, description: 'Longitude number' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-180, { message: 'Longitude must be valid (at least -180)' })
  @Max(180, { message: 'Longitude must be valid (cannot exceed 180)' })
  guessedLongitude: number

  @ApiProperty({ example: 'Rimska cesta 94a', description: 'Location address' })
  @IsString()
  address: string

  @ApiProperty({ example: 502, description: 'Error distance in meters' })
  errorDistance: number

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Owner ID of the user' })
  @IsUUID()
  ownerId: string
}

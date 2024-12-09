import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator'

export class CreateLocationDto {
  @ApiProperty({ example: 46.258046, description: 'Latitude number' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty()
  @Min(-90, { message: 'Latitude must be valid (at least -90)' })
  @Max(90, { message: 'Latitude must be valit (cannot exceed 90)' })
  latitude: number

  @ApiProperty({ example: 15.121128, description: 'Longitude number' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty()
  @Min(-180, { message: 'Longitude must be valid (at least -180)' })
  @Max(180, { message: 'Longitude must be valid (cannot exceed 180)' })
  longitude: number

  @ApiProperty({ example: 'Rimska cesta 94a', description: 'Location address' })
  @IsString()
  @IsNotEmpty()
  address: string
}

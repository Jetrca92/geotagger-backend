import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNumber, Max, Min } from 'class-validator'

export class CreateGuessDto {
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
}

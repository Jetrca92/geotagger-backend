import * as haversine from 'haversine-distance'

import { LatLongDto } from 'modules/guess/dto/lat-long.dto'
import { CreateLocationDto } from 'modules/location/dto/create-location.dto'
import { LocationDto } from 'modules/location/dto/location.dto'

export const calculateErrorDistance = (location: LocationDto, guess: CreateLocationDto) => {
  const locationCoordinates: LatLongDto = {
    lat: location.latitude,
    lng: location.longitude,
  }
  const guessCoordinates: LatLongDto = {
    lat: guess.latitude,
    lng: guess.longitude,
  }

  const haversineMeters = haversine(locationCoordinates, guessCoordinates)
  const haversineKilometers = haversineMeters / 1000
  if (haversineMeters > 999) return haversineKilometers
  return haversineMeters
}

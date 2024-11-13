import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class MapsService {
  private apiKey: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')
  }

  async getGeocode(address: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
          params: {
            address,
            key: this.apiKey,
          },
        }),
      )

      if (response.data && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location
        return {
          latitude: location.lat,
          longitude: location.lng,
        }
      }

      throw new HttpException('No results found', HttpStatus.NOT_FOUND)
    } catch (error) {
      throw new HttpException('Failed to fetch geocode', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }
}

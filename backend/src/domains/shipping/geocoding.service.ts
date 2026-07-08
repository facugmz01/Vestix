import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zipCode: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const query = [address, city, state, zipCode, 'Argentina']
      .filter(Boolean)
      .join(', ');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'VestixERP/1.0 (delivery-module)' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) return null;

      const lat = parseFloat(results[0].lat);
      const lon = parseFloat(results[0].lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

      return { latitude: lat, longitude: lon };
    } catch (err: any) {
      this.logger.warn(`Geocoding failed for "${query}": ${err.message}`);
      return null;
    }
  }
}

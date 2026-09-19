import { LocationCoordinates } from '../../types/silvercare';

export interface RouteInfo {
  origin: LocationCoordinates;
  destination: LocationCoordinates;
  distanceKm: number;
  durationMinutes: number;
  trafficStatus: 'normal' | 'light' | 'moderate';
  steps: string[];
}

export interface LocationProvider {
  getElderLocation(): Promise<LocationCoordinates>;
  getCaregiverLocation(): Promise<LocationCoordinates>;
  calculateRoute(): Promise<RouteInfo>;
}

export class DemoLocationProvider implements LocationProvider {
  // Anna's home coordinates
  private elderLocation: LocationCoordinates = {
    lat: 43.238949,
    lng: 76.889709,
    address: 'ул. Абая, 44, кв. 18 (Дом Анны Павловны)',
  };

  // Son Alexey's current position
  private caregiverLocation: LocationCoordinates = {
    lat: 43.255058,
    lng: 76.912628,
    address: 'пр. Достык, 89 (Алексей)',
  };

  async getElderLocation(): Promise<LocationCoordinates> {
    return this.elderLocation;
  }

  async getCaregiverLocation(): Promise<LocationCoordinates> {
    // Attempt real browser geolocation if available
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              address: 'Текущее местоположение опекуна (GPS)',
            });
          },
          () => resolve(this.caregiverLocation),
          { timeout: 3000 }
        );
      });
    }
    return this.caregiverLocation;
  }

  async calculateRoute(): Promise<RouteInfo> {
    const origin = await this.getCaregiverLocation();
    const destination = await this.getElderLocation();

    return {
      origin,
      destination,
      distanceKm: 3.4,
      durationMinutes: 8,
      trafficStatus: 'normal',
      steps: [
        'Двигайтесь на запад по пр. Абая',
        'Через 1.8 км поверните направо во двор',
        'Подъезд 2, домофон 18 — Вы на месте у Анны Павловны',
      ],
    };
  }
}

export const locationService: LocationProvider = new DemoLocationProvider();

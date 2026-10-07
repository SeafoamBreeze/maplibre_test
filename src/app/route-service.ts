import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Station } from './stations';

export interface RouteGeometry {
  /** [lng, lat] pairs along the road */
  coords: [number, number][];
  /** distance in metres */
  distance: number;
  /** duration in seconds */
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class RouteService {
  private http = inject(HttpClient);

  /** Fetch the driving Route between two Stations from Mapbox Directions. */
  fetchRoute(from: Station, to: Station): Promise<RouteGeometry> {
    const coords = `${from.coords[0]},${from.coords[1]};${to.coords[0]},${to.coords[1]}`;
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
      `?geocoding_json=true&overview=full&access_token=${environment.mapboxToken}`;

    return firstValueFrom(this.http.get<any>(url)).then((res) => {
      const route = res?.routes?.[0];
      if (!route) {
        throw new Error(res?.code === 'TokenDoesNotExist'
          ? 'Invalid Mapbox token — check .env'
          : 'No route found between these Stations');
      }
      return {
        coords: route.geometry.coordinates as [number, number][],
        distance: route.distance,
        duration: route.duration,
      };
    });
  }
}

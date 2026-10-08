import { Station } from './stations';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export interface RouteGeometry {
  /** [lng, lat] pairs along the road */
  coords: [number, number][];
  /** distance in metres */
  distance: number;
  /** duration in seconds */
  duration: number;
}

/**
 * Framework-agnostic Route computation: given a pair of Stations,
 * returns the driving Route geometry from the Mapbox Directions API
 * (single provider, ADR-0002).
 */
export async function fetchRoute(from: Station, to: Station): Promise<RouteGeometry> {
  const coords = `${from.coords[0]},${from.coords[1]};${to.coords[0]},${to.coords[1]}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?overview=full&geometries=geojson&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  const json: any = await res.json();
  const route = json?.routes?.[0];
  if (!route) {
    throw new Error(
      json?.code === 'TokenDoesNotExist'
        ? 'Invalid Mapbox token — check .env'
        : 'No route found between these Stations',
    );
  }
  return {
    coords: route.geometry.coordinates as [number, number][],
    distance: route.distance,
    duration: route.duration,
  };
}

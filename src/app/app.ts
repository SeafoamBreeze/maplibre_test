import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import type { Feature } from 'geojson';
import { MapComponent } from './map-component';
import { STATIONS, Station } from './stations';
import { RouteService, RouteGeometry } from './route-service';

@Component({
  selector: 'app-root',
  imports: [MapComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly stations = STATIONS;

  /** First endpoint of the pending Route. */
  readonly from = signal<Station | null>(null);
  /** Second endpoint; when set, a Route is requested. */
  readonly to = signal<Station | null>(null);
  readonly route = signal<RouteGeometry | null>(null);
  readonly routeError = signal<string | null>(null);
  readonly routeLoading = signal(false);

  private routeService = inject(RouteService);
  private map: maplibregl.Map | null = null;

  onMapReady(map: maplibregl.Map) {
    this.map = map;
    for (const station of this.stations) {
      const el = document.createElement('button');
      el.className = 'station-marker';
      el.setAttribute('aria-label', station.name);
      new maplibregl.Marker({ element: el })
        .setLngLat(station.coords)
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(station.name))
        .addTo(map);
    }
    // Redraw a Route that arrived before the map was ready.
    if (this.route()) this.drawRoute(this.route()!);
  }

  selectStation(station: Station) {
    const from = this.from();
    if (!from || (from && this.to())) {
      // Start a fresh pair.
      this.from.set(station);
      this.to.set(null);
      this.clearRoute();
      return;
    }
    if (from.id === station.id) {
      this.from.set(null);
      this.clearRoute();
      return;
    }
    this.to.set(station);
    this.loadRoute(from, station);
  }

  reset() {
    this.from.set(null);
    this.to.set(null);
    this.clearRoute();
  }

  private async loadRoute(from: Station, to: Station) {
    this.routeLoading.set(true);
    this.routeError.set(null);
    try {
      const route = await this.routeService.fetchRoute(from, to);
      this.route.set(route);
      if (this.map) this.drawRoute(route);
    } catch (err) {
      this.route.set(null);
      this.routeError.set(err instanceof Error ? err.message : 'Route request failed');
    } finally {
      this.routeLoading.set(false);
    }
  }

  private drawRoute(route: RouteGeometry) {
    const map = this.map;
    if (!map) return;
    const data: Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route.coords },
    };
    if (map.getLayer('route-line')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData(data);
    } else {
      map.addSource('route', { type: 'geojson', data });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
    }
    const bounds = new maplibregl.LngLatBounds();
    for (const coord of route.coords) {
      bounds.extend(coord);
    }
    map.fitBounds(bounds, { padding: 60, duration: 800 });
  }

  /** Route duration in whole minutes, for display. */
  routeMinutes(): number {
    const route = this.route();
    return route ? Math.round(route.duration / 60) : 0;
  }

  /** Route distance in km with one decimal, for display. */
  routeKm(): string {
    const route = this.route();
    return route ? (route.distance / 1000).toFixed(1) : '0.0';
  }

  private clearRoute() {
    this.route.set(null);
    this.routeError.set(null);
    const map = this.map;
    if (map?.getLayer('route-line')) {
      map.removeLayer('route-line');
      map.removeSource('route');
    }
  }
}

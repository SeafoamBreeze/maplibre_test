import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Feature } from 'geojson';
import MapComponent from './MapComponent';
import { STATIONS, Station } from './stations';
import { fetchRoute, RouteGeometry } from './route-service';

/**
 * Basemap style URL. Passed as a prop (not a string literal in markup)
 * so nothing can mangle the `//` in the URL.
 */
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
// Module-level constants: stable references, so App re-renders never
// tear down and rebuild the map.
const CENTER: [number, number] = [103.7665, 1.3888];
const ZOOM = 13.5;

export default function App() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const unmounted = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  /** Marker elements by Station id, so selection state can be reflected on the map. */
  const markerEls = useRef(new Map<string, HTMLButtonElement>());

  /** First endpoint of the pending Route. */
  const [from, setFrom] = useState<Station | null>(null);
  /** Second endpoint; when set, a Route is requested. */
  const [to, setTo] = useState<Station | null>(null);
  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(
    () => () => {
      unmounted.current = true;
      markersRef.current.forEach((m) => m.remove());
    },
    [],
  );

  // Reflect selection state onto the map markers.
  useEffect(() => {
    for (const [id, el] of markerEls.current) {
      el.classList.toggle('selected', from?.id === id || to?.id === id);
    }
  }, [from, to]);

  const clearRoute = () => {
    setRoute(null);
    setRouteError(null);
    const map = mapRef.current;
    if (map?.getLayer('route-line')) {
      map.removeLayer('route-line');
      map.removeSource('route');
    }
  };

  const drawRoute = (route: RouteGeometry) => {
    const map = mapRef.current;
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
    }
    if (!map.getLayer('route-line')) {
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
  };

  const loadRoute = (from: Station, to: Station) => {
    setRouteLoading(true);
    setRouteError(null);
    fetchRoute(from, to)
      .then((route) => {
        setRoute(route);
        drawRoute(route);
      })
      .catch((err) => {
        setRoute(null);
        setRouteError(err instanceof Error ? err.message : 'Route request failed');
      })
      .finally(() => setRouteLoading(false));
  };

  const selectStation = (station: Station) => {
    if (!from || to) {
      // Start a fresh pair.
      setFrom(station);
      setTo(null);
      clearRoute();
    } else if (from.id === station.id) {
      setFrom(null);
      clearRoute();
    } else {
      setTo(station);
      loadRoute(from, station);
    }
  };
  // Marker click listeners are bound once at map-ready; always invoke the
  // latest closure through a ref.
  const selectStationRef = useRef(selectStation);
  selectStationRef.current = selectStation;

  const reset = () => {
    setFrom(null);
    setTo(null);
    clearRoute();
  };

  const onMapReady = (map: maplibregl.Map) => {
    mapRef.current = map;
    if (unmounted.current) return;
    markersRef.current = STATIONS.map((station) => {
      const el = document.createElement('button');
      el.className = 'station-marker';
      el.setAttribute('aria-label', station.name);
      el.addEventListener('click', () => selectStationRef.current(station));
      markerEls.current.set(station.id, el);
      return new maplibregl.Marker({ element: el })
        .setLngLat(station.coords)
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(station.name))
        .addTo(map);
    });
    // Redraw a Route that arrived before the map was ready.
    if (route) drawRoute(route);
  };

  /** Route duration in whole minutes, for display. */
  const routeMinutes = route ? Math.round(route.duration / 60) : 0;
  /** Route distance in km with one decimal, for display. */
  const routeKm = route ? (route.distance / 1000).toFixed(1) : '0.0';

  return (
    <div className="layout">
      <aside className="panel">
        <h1>Station Routes</h1>
        <p className="hint">Select two Stations to draw the driving Route between them.</p>

        <ul className="station-list">
          {STATIONS.map((station) => (
            <li key={station.id}>
              <button
                className={
                  'station-btn' +
                  (from?.id === station.id || to?.id === station.id ? ' selected' : '')
                }
                onClick={() => selectStation(station)}
              >
                {from?.id === station.id && <span className="badge">A</span>}
                {to?.id === station.id && <span className="badge badge-b">B</span>}
                {station.name}
              </button>
            </li>
          ))}
        </ul>

        {routeLoading && <p className="status">Fetching route…</p>}
        {routeError && <p className="status error">{routeError}</p>}
        {route && <p className="status route-info">{routeKm} km · {routeMinutes} min</p>}

        {(from || to) && (
          <button className="reset" onClick={reset}>
            Reset
          </button>
        )}
      </aside>

      <main className="map-area">
        <MapComponent style={MAP_STYLE} center={CENTER} zoom={ZOOM} onMapReady={onMapReady} />
      </main>
    </div>
  );
}

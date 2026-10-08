import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import MapComponent from './MapComponent';
import { STATIONS } from './stations';

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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const unmounted = useRef(false);

  useEffect(
    () => () => {
      unmounted.current = true;
      markersRef.current.forEach((m) => m.remove());
    },
    [],
  );

  const onMapReady = (map: maplibregl.Map) => {
    if (unmounted.current) return;
    markersRef.current = STATIONS.map((station) => {
      const el = document.createElement('button');
      el.className = 'station-marker';
      el.setAttribute('aria-label', station.name);
      return new maplibregl.Marker({ element: el })
        .setLngLat(station.coords)
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(station.name))
        .addTo(map);
    });
  };

  return (
    <div className="layout">
      <main className="map-area">
        <MapComponent style={MAP_STYLE} center={CENTER} zoom={ZOOM} onMapReady={onMapReady} />
      </main>
    </div>
  );
}

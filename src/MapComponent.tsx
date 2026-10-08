import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { resolveStyle } from './mapbox-style';

// The bundled worker URL is not resolvable under the Vite dev server,
// so point maplibre-gl at an explicit asset URL.
maplibregl.setWorkerUrl(workerUrl);

interface MapComponentProps {
  /** Mapbox style URL, e.g. mapbox://styles/mapbox/streets-v12 */
  style: string;
  /** [lng, lat] — pass a stable reference; a new array rebuilds the map. */
  center: [number, number];
  zoom: number;
  /** Receives the ready maplibregl.Map exactly once. */
  onMapReady?: (map: maplibregl.Map) => void;
}

/**
 * Thin wrapper around a maplibregl.Map instance.
 * We own the map lifecycle: creation, resize, destruction (ADR-0001).
 */
export default function MapComponent({ style, center, zoom, onMapReady }: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [styleError, setStyleError] = useState<string | null>(null);
  // Keep the latest callback without re-running the lifecycle effect.
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    let map: maplibregl.Map | null = null;
    let cancelled = false;
    setStyleError(null);

    resolveStyle(style)
      .then((resolvedStyle) => {
        const container = containerRef.current;
        // The component may have unmounted while the style loaded.
        if (cancelled || !container) return;
        map = new maplibregl.Map({
          container,
          style: resolvedStyle,
          center,
          zoom,
        });
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.on('load', () => onMapReadyRef.current?.(map!));
      })
      .catch((err) => {
        // Surface a broken token / style as a visible error, not a blank map.
        if (!cancelled) {
          setStyleError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
      map?.remove();
      map = null;
    };
  }, [style, center, zoom]);

  return (
    <>
      <div ref={containerRef} className="map" />
      {styleError && <div className="map-error">{styleError}</div>}
    </>
  );
}

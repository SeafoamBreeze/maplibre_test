import MapComponent from './MapComponent';

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
  return (
    <div className="layout">
      <main className="map-area">
        <MapComponent style={MAP_STYLE} center={CENTER} zoom={ZOOM} />
      </main>
    </div>
  );
}

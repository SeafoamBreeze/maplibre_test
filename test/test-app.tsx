import { render, cleanup } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as maplibregl from 'maplibre-gl';
import App from '../src/App';

/**
 * Single test seam: the root App component.
 * maplibre-gl is stubbed at its constructor because jsdom lacks WebGL;
 * the Mapbox style fetch is stubbed at the fetch boundary.
 */
const constructed: maplibregl.MapOptions[] = [];
let removed = 0;
const markers: { element: HTMLElement; coords: [number, number] }[] = [];
const sources = new Set<string>();
const layers = new Set<string>();

vi.mock('maplibre-gl', () => ({
  setWorkerUrl: vi.fn(),
  NavigationControl: class {},
  Popup: class {
    setText() {
      return this;
    }
  },
  LngLatBounds: class {
    extend() {}
  },
  Marker: class {
    element: HTMLElement;
    constructor(options: { element: HTMLElement }) {
      this.element = options.element;
    }
    setLngLat(coords: [number, number]) {
      markers.push({ element: this.element, coords });
      return this;
    }
    setPopup() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  },
  Map: class {
    constructor(options: maplibregl.MapOptions) {
      constructed.push(options);
    }
    addControl() {}
    on(event: string, cb: () => void) {
      // Fire `load` synchronously so map-ready handlers run in tests.
      if (event === 'load') cb();
    }
    getLayer(id: string) {
      return layers.has(id) ? {} : null;
    }
    getSource(id: string) {
      return sources.has(id) ? { setData() {} } : null;
    }
    addSource(id: string) {
      sources.add(id);
    }
    addLayer(def: { id: string }) {
      layers.add(def.id);
    }
    removeLayer(id: string) {
      layers.delete(id);
    }
    removeSource(id: string) {
      sources.delete(id);
    }
    fitBounds() {}
    remove() {
      removed++;
    }
  },
}));

const minimalStyle = { version: 8, sources: {}, layers: [] };

beforeEach(() => {
  constructed.length = 0;
  removed = 0;
  markers.length = 0;
  sources.clear();
  layers.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => minimalStyle }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('constructs the map on mount with the expected center and zoom', async () => {
    render(<App />);
    await vi.waitFor(() => expect(constructed).toHaveLength(1));
    expect(constructed[0].center).toEqual([103.842, 1.385]);
    expect(constructed[0].zoom).toBe(14.5);
  });

  it('renders a marker for every Station at its coordinates', async () => {
    const { STATIONS } = await import('../src/stations');
    render(<App />);
    await vi.waitFor(() => expect(markers).toHaveLength(STATIONS.length));
    for (const station of STATIONS) {
      const marker = markers.find((m) => m.element.getAttribute('aria-label') === station.name);
      expect(marker, `marker for ${station.name}`).toBeDefined();
      expect(marker!.coords).toEqual(station.coords);
    }
  });

  it('draws the Route line when the Directions API responds', async () => {
    const { STATIONS } = await import('../src/stations');
    const [from, to] = STATIONS;
    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url.includes('/directions/')) {
        return {
          ok: true,
          json: async () => ({
            routes: [
              {
                geometry: { type: 'LineString', coordinates: [[1, 2], [3, 4]] },
                distance: 1234,
                duration: 567,
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => minimalStyle };
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<App />);
    // Select the pair: first button = origin, second = destination.
    const buttons = container.querySelectorAll<HTMLButtonElement>('.station-btn');
    // Separate act() flushes: the second selection must see the first's state.
    await act(async () => buttons[0].click());
    await act(async () => buttons[1].click());

    await vi.waitFor(() => expect(layers.has('route-line')).toBe(true));
    expect(sources.has('route')).toBe(true);
    const directionsCall = fetchMock.mock.calls.map((c) => String(c[0])).find((u) =>
      u.includes('/directions/'),
    );
    expect(directionsCall).toContain(`${from.coords[0]},${from.coords[1]};${to.coords[0]},${to.coords[1]}`);
  });

  it('shows a visible error when the Mapbox style request fails (e.g. bad token)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }),
    );
    const { container } = render(<App />);
    await vi.waitFor(() =>
      expect(container.querySelector('.map-error')?.textContent).toContain('check the token'),
    );
    expect(constructed).toHaveLength(0);
  });

  it('destroys the map on unmount', async () => {
    const { unmount } = render(<App />);
    await vi.waitFor(() => expect(constructed).toHaveLength(1));
    unmount();
    expect(removed).toBe(1);
  });
});

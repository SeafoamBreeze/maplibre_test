import { render, cleanup } from '@testing-library/react';
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

vi.mock('maplibre-gl', () => ({
  setWorkerUrl: vi.fn(),
  NavigationControl: class {},
  Popup: class {
    setText() {
      return this;
    }
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
    expect(constructed[0].center).toEqual([103.7665, 1.3888]);
    expect(constructed[0].zoom).toBe(13.5);
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

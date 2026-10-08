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

vi.mock('maplibre-gl', () => ({
  setWorkerUrl: vi.fn(),
  NavigationControl: class {},
  Map: class {
    constructor(options: maplibregl.MapOptions) {
      constructed.push(options);
    }
    addControl() {}
    on() {}
    remove() {
      removed++;
    }
  },
}));

const minimalStyle = { version: 8, sources: {}, layers: [] };

beforeEach(() => {
  constructed.length = 0;
  removed = 0;
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

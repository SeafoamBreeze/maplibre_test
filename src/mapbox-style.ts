import * as maplibre from 'maplibre-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

/** Top-level Style Specification keys maplibre-gl's validator accepts. */
const STYLE_KEYS = new Set([
  'version', 'metadata', 'center', 'zoom', 'minzoom', 'maxzoom',
  'sources', 'sprite', 'sprites', 'glyphs', 'layers', 'light', 'sky',
  'transition', 'terrain',
]);

/**
 * maplibre-gl (unlike Mapbox GL JS) does not append the access token to
 * `mapbox://` style URLs, so resolve them to the public https form here.
 * The Mapbox API also returns extra top-level keys (name, fog, projection,
 * owner, …) that maplibre's validator rejects, so fetch and filter the
 * style instead of pointing the map at the URL directly.
 */
export function resolveStyle(style: string): Promise<maplibre.StyleSpecification | string> {
  if (!style.startsWith('mapbox://')) return Promise.resolve(style);
  const url =
    `https://api.mapbox.com/styles/v1/${style.replace('mapbox://styles/', '')}` +
    `?access_token=${MAPBOX_TOKEN}`;
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          res.status === 404 || res.status === 403
            ? `Mapbox style request failed (${res.status}) — check the token in .env`
            : `Mapbox style request failed (${res.status})`,
        );
      }
      return res.json() as Promise<Record<string, unknown>>;
    })
    .then((json) => {
      const spec = Object.fromEntries(
        Object.entries(json).filter(([key]) => STYLE_KEYS.has(key)),
      ) as maplibre.StyleSpecification;
      // maplibre-gl does not resolve `mapbox://` source URLs (no token is
      // appended), and does not support Mapbox's `composite` source type.
      // Rewrite both to plain vector/raster sources with https tile URLs.
      const token = `access_token=${MAPBOX_TOKEN}`;
      const toTileUrl = (mapboxUrl: string, raster: boolean) => {
        const id = mapboxUrl.replace('mapbox://', '');
        const ext = raster ? 'png' : 'mvt';
        return `https://api.mapbox.com/v4/${id}/{z}/{x}/{y}.${ext}?${token}`;
      };
      // `mapbox://` glyphs/sprite URLs are equally unresolvable for maplibre.
      if (typeof spec.glyphs === 'string' && spec.glyphs.startsWith('mapbox://fonts/')) {
        spec.glyphs =
          spec.glyphs.replace('mapbox://fonts/', 'https://api.mapbox.com/fonts/v1/') + `?${token}`;
      }
      if (typeof spec.sprite === 'string' && spec.sprite.startsWith('mapbox://sprites/')) {
        // maplibre appends `.json` / `@2x.png` to this URL.
        spec.sprite =
          `https://api.mapbox.com/styles/v1/${spec.sprite.replace('mapbox://sprites/', '')}/sprite?${token}`;
      }
      for (const source of Object.values((spec.sources ?? {}) as Record<string, any>)) {
        if (source.type === 'composite' && typeof source.url === 'string') {
          // Keep only the first dataset (base map); the extras feed Mapbox
          // 3D terrain effects that this app does not use.
          const first = source.url.split(',')[0];
          source.type = 'vector';
          source.tiles = [toTileUrl(first, false)];
          delete source.url;
        } else if (typeof source.url === 'string' && source.url.startsWith('mapbox://')) {
          source.tiles = [toTileUrl(source.url, source.type === 'raster')];
          delete source.url;
        }
        if (Array.isArray(source.tiles)) {
          source.tiles = source.tiles.map((t: string) =>
            t.startsWith('mapbox://') ? toTileUrl(t, source.type === 'raster') : t,
          );
        }
      }
      return spec;
    });
}

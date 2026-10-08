# Maplibre Station Map

A React (Vite + TypeScript) web app that displays hardcoded Stations on a MapLibre map and draws vehicle Routes between pairs of Stations, using Mapbox as the single map/style/routing provider.

## Getting started

```bash
npm install
cp .env.example .env   # put your Mapbox access token in VITE_MAPBOX_TOKEN
npm start
```

Open the URL Vite prints (default `http://localhost:5173`).

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm start`       | Dev server with hot reload            |
| `npm test`        | Run the Vitest suite once             |
| `npm run typecheck` | Type-check without emitting         |
| `npm run build`   | Production build into `dist/`         |
| `npm run preview` | Serve the production build locally    |

## Configuration

The Mapbox access token is read from `VITE_MAPBOX_TOKEN` in a gitignored `.env` file (Vite-native env handling). A missing or invalid token surfaces as a visible error on the map.

## Testing

Tests live in `test/` with a `test-` filename prefix and drive the app through a single seam: the root `App` component. `maplibregl.Map` and `fetch` are stubbed (no WebGL in jsdom).

## Domain

See `CONTEXT.md` for the glossary (Station, Route) and `docs/adr/` for architecture decisions.

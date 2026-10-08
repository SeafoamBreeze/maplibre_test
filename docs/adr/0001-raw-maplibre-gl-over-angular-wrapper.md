# Raw maplibre-gl over a wrapper library

We integrate MapLibre by owning a thin standalone component that creates and destroys the `maplibregl.Map` instance directly, instead of using a community wrapper library (e.g. `ngx-maplibre-gl` or a React equivalent).

**Considered options**: wrapper libraries offer declarative components (`<mgl-map>`, `<mgl-marker>`) with nicer DX, but they are volunteer-maintained, lag framework releases, and would put a third-party layer between us and the map lifecycle we'd have to debug through.

**Consequences**: we write and own ~100 lines of map lifecycle code (init, resize, destroy, prop → option sync). In exchange the dependency tree stays minimal (one official package) and no middle layer can go stale. Currently implemented in `src/MapComponent.tsx`.

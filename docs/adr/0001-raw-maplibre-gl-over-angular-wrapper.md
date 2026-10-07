# Raw maplibre-gl over an Angular wrapper

We integrate MapLibre by owning a thin standalone Angular component that creates and destroys the `maplibregl.Map` instance directly, instead of using a community wrapper like `ngx-maplibre-gl`.

**Considered options**: `ngx-maplibre-gl` offers declarative components (`<mgl-map>`, `<mgl-marker>`) with nicer DX, but it is volunteer-maintained, lags Angular releases, and would put a third-party layer between us and the map lifecycle we'd have to debug through.

**Consequences**: we write and own ~100 lines of map lifecycle code (init, resize, destroy, input → option sync). In exchange the dependency tree stays minimal (one official package) and no middle layer can go stale.

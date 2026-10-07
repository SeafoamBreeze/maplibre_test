# Single-provider Mapbox for tiles and routing

Mapbox is the sole mapping provider: both the map style/tiles (`mapbox://styles/mapbox/streets-v12`, rendered by MapLibre GL JS) and route computation (Mapbox Directions, `driving` profile) come from it, under one access token.

**Considered options**: mixing a free OSM-based style (e.g. MapTiler or the MapLibre demo style) with Mapbox Directions would save quota on the free plan, at the cost of two providers, two tokens, and two style/routing coordinate ecosystems to keep aligned.

**Consequences**: one token, one bill, one integration surface. We are bound to Mapbox's free-plan quotas (~50k map loads, ~100k Directions requests per month) and pricing if this grows; swapping providers later means changing the style URL and the routing client, both isolated behind one config.

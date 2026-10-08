# Maplibre GL JS

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues, operated via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Tests

Tests live in the root `test/` directory with a `test-` filename prefix (e.g. `test/test-app.tsx`); run with `npm test` (Vitest). The single testing seam is the root `App` component; `maplibregl.Map` and `fetch` are stubbed (no WebGL in jsdom).

# React over Angular

We migrate the app from Angular to React (Vite + TypeScript, no router) rather than continuing to develop on Angular.

**Considered options**: staying on Angular keeps the diff small, but at this app's size (~400 lines, single screen) the framework machinery — decorators, dependency injection, module system, AOT build — is more overhead than value. React + Vite gives a simpler, faster toolchain, and Vite's native `.env` handling (`VITE_*` variables) removes the env-generation script and the `src/environments/` indirection.

**Consequences**: all Angular files are deleted and the app is rewritten in place (no parallel setup). The map-lifecycle decision is framework-neutral and unchanged (ADR-0001); the single-provider Mapbox constraint is unchanged (ADR-0002). Tests move to Vitest + Testing Library with a single seam at the root `App` component (`maplibregl.Map` and `fetch` stubbed — no WebGL in jsdom).

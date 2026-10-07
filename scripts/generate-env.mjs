/**
 * Generates src/environments/environment.local.ts (gitignored) from the
 * repo-root .env file. Run automatically before `ng serve` / `ng build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const lines = readFileSync(join(root, '.env'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

const env = Object.fromEntries(lines.map((l) => l.split('=').map((s) => s.trim())));

const out = `// Generated from .env by scripts/generate-env.mjs — do not edit by hand.
export const environment = {
  mapboxToken: ${JSON.stringify(env.MAPBOX_TOKEN ?? '')},
};
`;

const dir = join(root, 'src', 'environments');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'environment.local.ts'), out);
console.log('Generated src/environments/environment.local.ts from .env');

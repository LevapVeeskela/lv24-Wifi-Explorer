import { rmSync } from 'node:fs';
import { build } from 'esbuild';

rmSync('dist-electron', { recursive: true, force: true });

/**
 * Bundle the Electron main/preload (and the cross-platform backend + core)
 * into self-contained CJS files. Keeps workspace packages out of the asar
 * resolution path and makes the desktop app portable across OSes.
 */
await build({
  entryPoints: ['packages/desktop/src/main.ts', 'packages/desktop/src/preload.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  outdir: 'dist-electron',
  outbase: 'packages/desktop/src',
  external: ['electron'],
  sourcemap: false,
  logLevel: 'info',
});

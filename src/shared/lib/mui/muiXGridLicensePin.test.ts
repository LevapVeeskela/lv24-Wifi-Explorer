/**
 * Structural + runtime proof: Material UI stays 9.x; commercial Data Grid Pro
 * is pinned to MUI X 8.x so VITE_MUI_LICENSE_KEY (v8-era planVersion) validates.
 * Does not commit the secret — reads env when present.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const require = createRequire(join(frontendRoot, 'package.json'));

function readPkgVersion(name: string): string {
  const pkg = require(`${name}/package.json`) as { version: string };
  return pkg.version;
}

function loadProjectMuiKey(): string | null {
  for (const name of ['.env.local', '.env'] as const) {
    const p = join(frontendRoot, name);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/VITE_MUI_LICENSE_KEY=(.+)/);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return process.env.VITE_MUI_LICENSE_KEY?.trim() || null;
}

describe('MUI X grid license pin (Material 9 + Data Grid Pro 8)', () => {
  it('package.json pins material 9.x and grid-pro/license 8.x', () => {
    const pkg = JSON.parse(readFileSync(join(frontendRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      resolutions?: Record<string, string>;
    };
    expect(pkg.dependencies['@mui/material']).toMatch(/^9\./);
    expect(pkg.dependencies['@mui/x-data-grid-pro']).toMatch(/^8\./);
    expect(pkg.dependencies['@mui/x-license']).toMatch(/^8\./);
    expect(pkg.dependencies['@mui/x-charts']).toMatch(/^8\./);
    expect(pkg.resolutions?.['@mui/x-data-grid']).toMatch(/^8\./);
    expect(pkg.resolutions?.['@mui/x-data-grid-pro']).toMatch(/^8\./);
    expect(pkg.resolutions?.['@mui/x-license']).toMatch(/^8\./);
  });

  it('resolved node_modules match the pin', () => {
    expect(readPkgVersion('@mui/material')).toMatch(/^9\./);
    expect(readPkgVersion('@mui/x-data-grid-pro')).toMatch(/^8\./);
    expect(readPkgVersion('@mui/x-license')).toMatch(/^8\./);
    expect(readPkgVersion('@mui/x-data-grid')).toMatch(/^8\./);
    expect(readPkgVersion('@mui/x-charts')).toMatch(/^8\./);
  });

  const projectKey = loadProjectMuiKey();

  it.skipIf(!projectKey)(
    'verifyLicense reports Valid for shipped grid-pro 8 packageInfo + project key',
    () => {
      const key = projectKey as string;

      const verifyMod = require(
        join(frontendRoot, 'node_modules/@mui/x-license/verifyLicense/verifyLicense.js')
      ) as {
        verifyLicense: (input: {
          releaseInfo: string;
          licenseKey: string;
          packageName: string;
        }) => {
          status: string;
        };
      };

      const dgpPath = join(
        frontendRoot,
        'node_modules/@mui/x-data-grid-pro/esm/DataGridPro/DataGridPro.js'
      );
      const dgpSrc = readFileSync(dgpPath, 'utf8');
      const releaseMatch = dgpSrc.match(/releaseInfo["']?\s*[:=]\s*["']([A-Za-z0-9+/=]+)["']/);
      expect(releaseMatch?.[1]).toBeTruthy();

      const result = verifyMod.verifyLicense({
        releaseInfo: releaseMatch![1]!,
        licenseKey: key,
        packageName: 'x-data-grid-pro',
      });
      expect(result.status).toBe('Valid');
    }
  );
});

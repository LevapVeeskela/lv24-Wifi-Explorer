import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLI_VERSION, formatVersion } from './version';

type CliManifest = { name: string; version: string };

const manifest = JSON.parse(
  readFileSync(join(process.cwd(), 'packages', 'cli', 'package.json'), 'utf8')
) as CliManifest;

describe('lv24-wifi --version', () => {
  it('prints the 1.0.1 package version', () => {
    expect(formatVersion()).toBe('1.0.1\n');
  });

  it('matches packages/cli/package.json', () => {
    expect(manifest.name).toBe('@lv24/wifi-cli');
    expect(manifest.version).toBe(CLI_VERSION);
  });
});

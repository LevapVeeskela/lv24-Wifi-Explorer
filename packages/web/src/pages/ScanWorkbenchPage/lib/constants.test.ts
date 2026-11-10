import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from './constants';

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  version: string;
};

describe('APP_VERSION', () => {
  it('matches the root package.json version', () => {
    expect(APP_VERSION).toBe(manifest.version);
  });

  it('is a semver string', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

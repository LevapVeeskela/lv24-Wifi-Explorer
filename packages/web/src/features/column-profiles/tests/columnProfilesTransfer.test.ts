import { describe, expect, it } from 'vitest';
import { exportColumnProfilesJson, importColumnProfilesJson } from '../transfer';
import type { ColumnProfilesStoreV1 } from '../types';

function store(profiles: ColumnProfilesStoreV1['profiles'] = []): ColumnProfilesStoreV1 {
  return { version: 1, activeProfileId: 'default', profiles };
}

const COMPACT = {
  name: 'Compact',
  visibility: { vendor: false, annotation: false },
};

describe('column profile transfer', () => {
  it('exports custom profiles without ids or active state', () => {
    const payload = JSON.parse(
      exportColumnProfilesJson(
        store([{ id: 'p1', name: 'Compact', visibility: { vendor: false } }])
      )
    );
    expect(payload).toEqual({
      version: 1,
      profiles: [{ name: 'Compact', visibility: { vendor: false } }],
    });
  });

  it('merges imported profiles and skips duplicate names case-insensitively', () => {
    const result = importColumnProfilesJson(
      JSON.stringify({ version: 1, profiles: [COMPACT, { name: 'compact', visibility: {} }] }),
      store([{ id: 'p1', name: 'Compact', visibility: {} }])
    );
    expect(result.error).toBeUndefined();
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(2);
    expect(result.store.profiles).toHaveLength(1);
  });

  it('imports new profiles with generated ids and defaults for missing columns', () => {
    const result = importColumnProfilesJson(
      JSON.stringify({ version: 1, profiles: [COMPACT] }),
      store()
    );
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    const [profile] = result.store.profiles;
    expect(profile.name).toBe('Compact');
    expect(profile.id).not.toBe('default');
    expect(profile.visibility.annotation).toBe(false);
    // Missing fields fall back to the product default visibility.
    expect(profile.visibility.ssid).toBe(true);
  });

  it('rejects invalid JSON and invalid shape', () => {
    expect(importColumnProfilesJson('{nope', store()).error).toBe('invalid_json');
    expect(importColumnProfilesJson('{"version":2}', store()).error).toBe('invalid_shape');
    expect(importColumnProfilesJson('{"version":1,"profiles":{}}', store()).error).toBe(
      'invalid_shape'
    );
  });

  it('skips malformed entries instead of failing the whole import', () => {
    const result = importColumnProfilesJson(
      JSON.stringify({
        version: 1,
        profiles: [{ name: '' }, { name: 'Ok', visibility: { vendor: false } }, 42],
      }),
      store()
    );
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2);
  });
});

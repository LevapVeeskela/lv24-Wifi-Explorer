import { describe, expect, it } from 'vitest';
import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';
import { FILTER_DEFAULTS } from '@/features/scan-filters';
import { applyProfileToState, profileFromState } from '../apply';
import { builtInDefaultWorkbenchProfile, normalizeWorkbenchProfilesStore } from '../normalize';
import { loadWorkbenchProfilesStore, saveWorkbenchProfilesStore } from '../persist';
import {
  activeWorkbenchProfile,
  addWorkbenchProfile,
  checkProfileName,
  deleteWorkbenchProfile,
  renameWorkbenchProfile,
  selectWorkbenchProfile,
} from '../store';
import { exportWorkbenchProfilesJson, importWorkbenchProfilesJson } from '../transfer';
import {
  BUILT_IN_DEFAULT_PROFILE_ID,
  BUILT_IN_DEFAULT_PROFILE_NAME,
  MAX_WORKBENCH_PROFILES,
  WORKBENCH_PROFILES_STORAGE_KEY,
  type WorkbenchProfilesStoreV1,
  type WorkbenchStateInput,
} from '../types';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function state(overrides: Partial<WorkbenchStateInput> = {}): WorkbenchStateInput {
  return {
    columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, vendor: true, noiseDbm: false },
    filters: { ...FILTER_DEFAULTS, band: '5', minRssiDbm: -70 },
    organizeBy: 'ssid',
    ...overrides,
  };
}

function emptyStore(): WorkbenchProfilesStoreV1 {
  return normalizeWorkbenchProfilesStore(null);
}

describe('workbench profiles: built-in default', () => {
  it('is always present as the first profile and never persisted', () => {
    const storage = memoryStorage();
    const store = emptyStore();
    expect(store.profiles[0]).toMatchObject({
      id: BUILT_IN_DEFAULT_PROFILE_ID,
      name: BUILT_IN_DEFAULT_PROFILE_NAME,
      builtIn: true,
      organizeBy: 'none',
    });
    expect(store.activeProfileId).toBeNull();

    saveWorkbenchProfilesStore(addWorkbenchProfile(store, 'Mine', state()).store, storage);
    const persisted = JSON.parse(storage.getItem(WORKBENCH_PROFILES_STORAGE_KEY) ?? '{}') as {
      profiles: { id: string }[];
    };
    expect(persisted.profiles.map((p) => p.id)).not.toContain(BUILT_IN_DEFAULT_PROFILE_ID);

    const loaded = loadWorkbenchProfilesStore(storage);
    expect(loaded.profiles[0].id).toBe(BUILT_IN_DEFAULT_PROFILE_ID);
    expect(loaded.profiles).toHaveLength(2);
  });

  it('cannot be renamed or deleted', () => {
    const store = emptyStore();
    expect(renameWorkbenchProfile(store, BUILT_IN_DEFAULT_PROFILE_ID, 'Nope').error).toBe(
      'built_in_readonly'
    );
    expect(deleteWorkbenchProfile(store, BUILT_IN_DEFAULT_PROFILE_ID).error).toBe(
      'built_in_readonly'
    );
    expect(builtInDefaultWorkbenchProfile().columnVisibility).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });
});

describe('workbench profiles: normalization', () => {
  it('strips unknown props and coerces bad values', () => {
    const profile = profileFromState(state(), { id: 'p1', name: '  Lab  ' });
    expect(profile.name).toBe('Lab');
    expect(profile.columnVisibility).not.toHaveProperty('bogusColumn');
    expect(profile.filters.band).toBe('5');

    const normalized = normalizeWorkbenchProfilesStore({
      version: 1,
      activeProfileId: 'p1',
      extra: 'dropped',
      profiles: [
        {
          id: 'p1',
          name: 'Lab',
          organizeBy: 'nonsense',
          columnVisibility: { vendor: 'yes', ssid: false, bogusColumn: true },
          filters: { band: 'bogus', security: ['open', 'bogus'], minRssiDbm: -200 },
          unknownProp: 1,
        },
      ],
    });
    const [custom] = normalized.profiles.filter((p) => !p.builtIn);
    expect(custom).toMatchObject({ id: 'p1', name: 'Lab', organizeBy: 'none' });
    expect(custom).not.toHaveProperty('unknownProp');
    expect(custom.columnVisibility.vendor).toBe(DEFAULT_COLUMN_VISIBILITY.vendor);
    expect(custom.columnVisibility.ssid).toBe(false);
    expect(custom.columnVisibility).not.toHaveProperty('bogusColumn');
    expect(custom.filters.band).toBe(FILTER_DEFAULTS.band);
    expect(custom.filters.security).toEqual(['open']);
    expect(custom.filters.minRssiDbm).toBeNull();
    expect(normalized.activeProfileId).toBe('p1');
  });

  it('drops invalid, duplicate-name and reserved-id entries and caps the list', () => {
    const many = Array.from({ length: MAX_WORKBENCH_PROFILES + 5 }, (_, i) => ({
      id: `p${i}`,
      name: `Profile ${i}`,
      columnVisibility: {},
      filters: {},
      organizeBy: 'none',
    }));
    const store = normalizeWorkbenchProfilesStore({
      version: 1,
      activeProfileId: 'missing',
      profiles: [
        null,
        { id: '', name: 'x' },
        { id: 'default', name: 'Fake default' },
        { id: 'a', name: 'Same' },
        { id: 'b', name: 'same' },
        { id: 'a', name: 'Other id' },
        ...many,
      ],
    });
    expect(store.profiles).toHaveLength(1 + MAX_WORKBENCH_PROFILES);
    expect(store.profiles.filter((p) => p.name.toLowerCase() === 'same')).toHaveLength(1);
    expect(store.profiles.filter((p) => p.id === 'a')).toHaveLength(1);
    expect(store.activeProfileId).toBeNull();
  });

  it('rejects foreign versions and garbage payloads', () => {
    expect(normalizeWorkbenchProfilesStore({ version: 2, profiles: [] }).profiles).toHaveLength(1);
    expect(normalizeWorkbenchProfilesStore('nope').profiles).toHaveLength(1);
    expect(normalizeWorkbenchProfilesStore(null).activeProfileId).toBeNull();
  });

  it('snaps scanIntervalSec to a supported option', () => {
    expect(profileFromState(state({ scanIntervalSec: 7 })).scanIntervalSec).toBe(5);
    expect(profileFromState(state({ scanIntervalSec: 14 })).scanIntervalSec).toBe(15);
    expect(profileFromState(state({ scanIntervalSec: 1 })).scanIntervalSec).toBe(3);
    expect(profileFromState(state()).scanIntervalSec).toBeUndefined();
  });
});

describe('workbench profiles: apply/roundtrip', () => {
  it('restores the captured state and roundtrips through storage', () => {
    const storage = memoryStorage();
    const captured = state({ scanIntervalSec: 10 });
    const added = addWorkbenchProfile(emptyStore(), 'Lab', captured);
    expect(added.error).toBeUndefined();
    expect(added.store.activeProfileId).toBe(added.store.profiles[1].id);

    saveWorkbenchProfilesStore(added.store, storage);
    const loaded = loadWorkbenchProfilesStore(storage);
    const active = activeWorkbenchProfile(loaded);
    expect(active?.name).toBe('Lab');

    const patch = applyProfileToState(active!);
    expect(patch.organizeBy).toBe('ssid');
    expect(patch.filters.band).toBe('5');
    expect(patch.filters.minRssiDbm).toBe(-70);
    expect(patch.columnVisibility).toEqual(captured.columnVisibility);
    expect(patch.scanIntervalSec).toBe(10);
  });

  it('roundtrips through export/import with replace', () => {
    const source = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    const json = exportWorkbenchProfilesJson(source);
    const parsed = JSON.parse(json) as { version: number; profiles: { id: string }[] };
    expect(parsed.version).toBe(1);
    expect(parsed.profiles.map((p) => p.id)).not.toContain(BUILT_IN_DEFAULT_PROFILE_ID);

    const result = importWorkbenchProfilesJson(
      json,
      addWorkbenchProfile(emptyStore(), 'Old', state()).store,
      { mode: 'replace' }
    );
    expect(result.error).toBeUndefined();
    expect(result.imported).toBe(1);
    expect(result.store.profiles.map((p) => p.name)).toEqual([
      BUILT_IN_DEFAULT_PROFILE_NAME,
      'Lab',
    ]);
  });
});

describe('workbench profiles: duplicate names', () => {
  it('rejects duplicates case-insensitively, including the built-in name', () => {
    const store = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    expect(checkProfileName(store, 'default')).toEqual({ ok: false, error: 'duplicate_name' });
    expect(checkProfileName(store, '  LAB ')).toEqual({ ok: false, error: 'duplicate_name' });
    expect(checkProfileName(store, '   ')).toEqual({ ok: false, error: 'empty_name' });
    expect(addWorkbenchProfile(store, 'lab', state()).error).toBe('duplicate_name');

    const id = store.profiles[1].id;
    expect(renameWorkbenchProfile(store, id, 'DEFAULT').error).toBe('duplicate_name');
    expect(renameWorkbenchProfile(store, id, 'Renamed').store.profiles[1].name).toBe('Renamed');
  });

  it('truncates names to 64 chars and enforces the profile cap', () => {
    const long = 'x'.repeat(100);
    const added = addWorkbenchProfile(emptyStore(), long, state());
    expect(added.store.profiles[1].name).toHaveLength(64);

    let store = emptyStore();
    for (let i = 0; i < MAX_WORKBENCH_PROFILES; i += 1) {
      store = addWorkbenchProfile(store, `P${i}`, state()).store;
    }
    expect(addWorkbenchProfile(store, 'One more', state()).error).toBe('limit_reached');
  });
});

describe('workbench profiles: import validation', () => {
  it('reports bad JSON and bad shapes without touching the store', () => {
    const store = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    const badJson = importWorkbenchProfilesJson('{not json', store);
    expect(badJson.error).toBe('invalid_json');
    expect(badJson.store).toBe(store);

    const badShape = importWorkbenchProfilesJson('{"version":1,"profiles":"nope"}', store);
    expect(badShape.error).toBe('invalid_shape');
    expect(badShape.store).toBe(store);

    const empty = importWorkbenchProfilesJson('{"version":1,"profiles":[]}', store);
    expect(empty.error).toBeUndefined();
    expect(empty.imported).toBe(0);
  });

  it('merges by skipping or renaming duplicate names', () => {
    const store = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    const payload = JSON.stringify({
      version: 1,
      profiles: [{ id: 'imp', name: 'lab', columnVisibility: {}, filters: {}, organizeBy: 'ap' }],
    });

    const skipped = importWorkbenchProfilesJson(payload, store);
    expect(skipped).toMatchObject({ imported: 0, skipped: 1 });
    expect(skipped.store.profiles).toHaveLength(2);

    const renamed = importWorkbenchProfilesJson(payload, store, { onDuplicateName: 'rename' });
    expect(renamed).toMatchObject({ imported: 1, skipped: 0 });
    expect(renamed.store.profiles.map((p) => p.name)).toEqual([
      BUILT_IN_DEFAULT_PROFILE_NAME,
      'Lab',
      'lab (2)',
    ]);
  });

  it('strips unknown props and regenerates colliding ids', () => {
    const store = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    const existingId = store.profiles[1].id;
    const result = importWorkbenchProfilesJson(
      JSON.stringify({
        version: 1,
        profiles: [
          {
            id: existingId,
            name: 'Imported',
            columnVisibility: { vendor: false, bogus: true },
            filters: { band: '24' },
            organizeBy: 'vendor',
            evil: 'x',
          },
        ],
      }),
      store
    );
    expect(result.imported).toBe(1);
    const imported = result.store.profiles[2];
    expect(imported.id).not.toBe(existingId);
    expect(imported).not.toHaveProperty('evil');
    expect(imported.columnVisibility).not.toHaveProperty('bogus');
    expect(imported.filters.band).toBe('24');
  });
});

describe('workbench profiles: selection', () => {
  it('selects existing profiles and clears with null', () => {
    const store = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    const id = store.profiles[1].id;
    expect(selectWorkbenchProfile(store, 'missing').error).toBe('not_found');
    expect(selectWorkbenchProfile(store, id).store.activeProfileId).toBe(id);
    expect(selectWorkbenchProfile(store, null).store.activeProfileId).toBeNull();
    expect(selectWorkbenchProfile(store, BUILT_IN_DEFAULT_PROFILE_ID).store.activeProfileId).toBe(
      BUILT_IN_DEFAULT_PROFILE_ID
    );
  });

  it('clears the active id when the active profile is deleted', () => {
    const store = addWorkbenchProfile(emptyStore(), 'Lab', state()).store;
    const deleted = deleteWorkbenchProfile(store, store.profiles[1].id);
    expect(deleted.error).toBeUndefined();
    expect(deleted.store.profiles).toHaveLength(1);
    expect(deleted.store.activeProfileId).toBeNull();
  });
});

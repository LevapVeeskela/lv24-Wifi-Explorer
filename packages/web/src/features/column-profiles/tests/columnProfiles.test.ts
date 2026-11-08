import { describe, expect, it } from 'vitest';
import { STORAGE_COLUMN_PROFILES } from '@/shared/lib/persistence/keys';
import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';
import { BUILT_IN_DEFAULT_PROFILE_ID } from '../types';
import {
  createCustomProfile,
  deleteCustomProfile,
  loadColumnProfilesStore,
  listProfiles,
  profileById,
  saveColumnProfilesStore,
  selectActiveProfile,
} from '../persist';

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

describe('column profiles persist', () => {
  it('starts with built-in default only', () => {
    const store = loadColumnProfilesStore(memoryStorage());
    expect(store.activeProfileId).toBe(BUILT_IN_DEFAULT_PROFILE_ID);
    expect(store.profiles).toEqual([]);
    expect(listProfiles(store)).toHaveLength(1);
    expect(profileById(store, BUILT_IN_DEFAULT_PROFILE_ID)?.visibility).toEqual(
      DEFAULT_COLUMN_VISIBILITY
    );
  });

  it('persists custom profiles under STORAGE_COLUMN_PROFILES', () => {
    const storage = memoryStorage();
    let store = loadColumnProfilesStore(storage);
    store = createCustomProfile(store, 'Survey', {
      ...DEFAULT_COLUMN_VISIBILITY,
      security: true,
      rssiDbm: true,
    });
    saveColumnProfilesStore(store, storage);
    expect(storage.getItem(STORAGE_COLUMN_PROFILES)).toContain('"Survey"');

    const loaded = loadColumnProfilesStore(storage);
    expect(loaded.profiles).toHaveLength(1);
    expect(loaded.activeProfileId).toBe(loaded.profiles[0]!.id);
    expect(loaded.profiles[0]!.visibility.security).toBe(true);
  });

  it('select and delete custom profile', () => {
    let store = loadColumnProfilesStore(memoryStorage());
    store = createCustomProfile(store, 'A', DEFAULT_COLUMN_VISIBILITY);
    const customId = store.profiles[0]!.id;
    store = selectActiveProfile(store, customId);
    expect(store.activeProfileId).toBe(customId);

    store = deleteCustomProfile(store, customId);
    expect(store.profiles).toHaveLength(0);
    expect(store.activeProfileId).toBe(BUILT_IN_DEFAULT_PROFILE_ID);
  });

  it('ignores built-in entries in stored payload', () => {
    const storage = memoryStorage();
    storage.setItem(
      STORAGE_COLUMN_PROFILES,
      JSON.stringify({
        version: 1,
        activeProfileId: BUILT_IN_DEFAULT_PROFILE_ID,
        profiles: [
          {
            id: BUILT_IN_DEFAULT_PROFILE_ID,
            name: 'Hack',
            builtIn: true,
            visibility: { bssid: false },
          },
        ],
      })
    );
    const loaded = loadColumnProfilesStore(storage);
    expect(loaded.profiles).toHaveLength(0);
    expect(profileById(loaded, BUILT_IN_DEFAULT_PROFILE_ID)?.visibility.bssid).toBe(true);
  });
});

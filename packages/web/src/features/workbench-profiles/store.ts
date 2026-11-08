import { profileFromState, type ProfileMeta } from './apply';
import { normalizeProfileName } from './normalize';
import {
  BUILT_IN_DEFAULT_PROFILE_ID,
  MAX_WORKBENCH_PROFILES,
  type WorkbenchProfile,
  type WorkbenchProfilesStoreV1,
  type WorkbenchStateInput,
} from './types';

export type ProfileNameError = 'empty_name' | 'duplicate_name';
export type StoreMutationError =
  | ProfileNameError
  | 'limit_reached'
  | 'not_found'
  | 'built_in_readonly';

export type ProfileNameCheck = { ok: true; name: string } | { ok: false; error: ProfileNameError };

export type StoreMutation = {
  store: WorkbenchProfilesStoreV1;
  error?: StoreMutationError;
};

function nameKey(name: string): string {
  return name.toLowerCase();
}

/** Case-insensitive uniqueness check, ignoring `exceptId` while renaming. */
export function checkProfileName(
  store: WorkbenchProfilesStoreV1,
  rawName: string,
  exceptId?: string
): ProfileNameCheck {
  const name = normalizeProfileName(rawName);
  if (!name) return { ok: false, error: 'empty_name' };
  const key = nameKey(name);
  const taken = store.profiles.some(
    (profile) => profile.id !== exceptId && nameKey(profile.name) === key
  );
  return taken ? { ok: false, error: 'duplicate_name' } : { ok: true, name };
}

export function findWorkbenchProfile(
  store: WorkbenchProfilesStoreV1,
  id: string | null
): WorkbenchProfile | undefined {
  if (!id) return undefined;
  return store.profiles.find((profile) => profile.id === id);
}

export function activeWorkbenchProfile(store: WorkbenchProfilesStoreV1): WorkbenchProfile | null {
  return findWorkbenchProfile(store, store.activeProfileId) ?? null;
}

/** Custom (persistable) profiles only, excluding built-ins. */
export function listCustomWorkbenchProfiles(store: WorkbenchProfilesStoreV1): WorkbenchProfile[] {
  return store.profiles.filter((profile) => !profile.builtIn);
}

export function addWorkbenchProfile(
  store: WorkbenchProfilesStoreV1,
  name: string,
  state: WorkbenchStateInput,
  meta: Omit<ProfileMeta, 'name'> = {}
): StoreMutation {
  const check = checkProfileName(store, name);
  if (!check.ok) return { store, error: check.error };
  if (listCustomWorkbenchProfiles(store).length >= MAX_WORKBENCH_PROFILES) {
    return { store, error: 'limit_reached' };
  }
  const profile = profileFromState(state, { ...meta, name: check.name });
  return {
    store: {
      ...store,
      profiles: [...store.profiles, profile],
      activeProfileId: profile.id,
    },
  };
}

/** Patch a custom profile's name and/or captured workbench state. */
export function updateWorkbenchProfile(
  store: WorkbenchProfilesStoreV1,
  profileId: string,
  patch: { name?: string; state?: WorkbenchStateInput }
): StoreMutation {
  const existing = findWorkbenchProfile(store, profileId);
  if (!existing) return { store, error: 'not_found' };
  if (existing.builtIn || profileId === BUILT_IN_DEFAULT_PROFILE_ID) {
    return { store, error: 'built_in_readonly' };
  }
  let name = existing.name;
  if (patch.name !== undefined) {
    const check = checkProfileName(store, patch.name, profileId);
    if (!check.ok) return { store, error: check.error };
    name = check.name;
  }
  const next = patch.state
    ? profileFromState(patch.state, { id: existing.id, name })
    : { ...existing, name };
  return {
    store: {
      ...store,
      profiles: store.profiles.map((profile) => (profile.id === profileId ? next : profile)),
    },
  };
}

export function renameWorkbenchProfile(
  store: WorkbenchProfilesStoreV1,
  profileId: string,
  name: string
): StoreMutation {
  return updateWorkbenchProfile(store, profileId, { name });
}

export function deleteWorkbenchProfile(
  store: WorkbenchProfilesStoreV1,
  profileId: string
): StoreMutation {
  const existing = findWorkbenchProfile(store, profileId);
  if (!existing) return { store, error: 'not_found' };
  if (existing.builtIn || profileId === BUILT_IN_DEFAULT_PROFILE_ID) {
    return { store, error: 'built_in_readonly' };
  }
  return {
    store: {
      ...store,
      profiles: store.profiles.filter((profile) => profile.id !== profileId),
      activeProfileId: store.activeProfileId === profileId ? null : store.activeProfileId,
    },
  };
}

/** Select a profile as active; `null` clears the selection. */
export function selectWorkbenchProfile(
  store: WorkbenchProfilesStoreV1,
  profileId: string | null
): StoreMutation {
  if (profileId == null) return { store: { ...store, activeProfileId: null } };
  if (!findWorkbenchProfile(store, profileId)) return { store, error: 'not_found' };
  return { store: { ...store, activeProfileId: profileId } };
}

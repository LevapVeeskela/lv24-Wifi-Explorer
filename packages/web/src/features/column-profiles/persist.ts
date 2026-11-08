import { STORAGE_COLUMN_PROFILES } from '@/shared/lib/persistence/keys';
import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';
import { normalizeColumnVisibility } from './normalizeVisibility';
import {
  BUILT_IN_DEFAULT_PROFILE_ID,
  type ColumnProfilesStorage,
  type ColumnProfilesStoreV1,
  type ColumnVisibilityProfile,
} from './types';

function newProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `colprof-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function builtInDefaultProfile(): ColumnVisibilityProfile {
  return {
    id: BUILT_IN_DEFAULT_PROFILE_ID,
    name: BUILT_IN_DEFAULT_PROFILE_ID,
    builtIn: true,
    visibility: { ...DEFAULT_COLUMN_VISIBILITY },
  };
}

function parseProfile(value: unknown): ColumnVisibilityProfile | null {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : null;
  const name = typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim() : null;
  if (!id || !name || id === BUILT_IN_DEFAULT_PROFILE_ID) return null;
  if (rec.builtIn === true) return null;
  const visibilityRaw = rec.visibility;
  if (!visibilityRaw || typeof visibilityRaw !== 'object') return null;
  return {
    id,
    name,
    visibility: normalizeColumnVisibility(visibilityRaw as Record<string, boolean>),
  };
}

export function defaultColumnProfilesStorage(): ColumnProfilesStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadColumnProfilesStore(
  storage: ColumnProfilesStorage | null = defaultColumnProfilesStorage()
): ColumnProfilesStoreV1 {
  const fallback: ColumnProfilesStoreV1 = {
    version: 1,
    activeProfileId: BUILT_IN_DEFAULT_PROFILE_ID,
    profiles: [],
  };
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(STORAGE_COLUMN_PROFILES);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    const rec = parsed as Record<string, unknown>;
    if (rec.version !== 1) return fallback;
    const profiles = Array.isArray(rec.profiles)
      ? rec.profiles.map(parseProfile).filter((p): p is ColumnVisibilityProfile => p != null)
      : [];
    const activeProfileId =
      typeof rec.activeProfileId === 'string' && rec.activeProfileId.trim()
        ? rec.activeProfileId.trim()
        : BUILT_IN_DEFAULT_PROFILE_ID;
    const activeExists =
      activeProfileId === BUILT_IN_DEFAULT_PROFILE_ID ||
      profiles.some((p) => p.id === activeProfileId);
    return {
      version: 1,
      activeProfileId: activeExists ? activeProfileId : BUILT_IN_DEFAULT_PROFILE_ID,
      profiles,
    };
  } catch {
    return fallback;
  }
}

export function saveColumnProfilesStore(
  store: ColumnProfilesStoreV1,
  storage: ColumnProfilesStorage | null = defaultColumnProfilesStorage()
): void {
  if (!storage) return;
  const payload: ColumnProfilesStoreV1 = {
    version: 1,
    activeProfileId: store.activeProfileId,
    profiles: store.profiles.filter((p) => !p.builtIn && p.id !== BUILT_IN_DEFAULT_PROFILE_ID),
  };
  try {
    storage.setItem(STORAGE_COLUMN_PROFILES, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function listProfiles(store: ColumnProfilesStoreV1): ColumnVisibilityProfile[] {
  return [builtInDefaultProfile(), ...store.profiles];
}

export function profileById(
  store: ColumnProfilesStoreV1,
  id: string
): ColumnVisibilityProfile | undefined {
  if (id === BUILT_IN_DEFAULT_PROFILE_ID) return builtInDefaultProfile();
  return store.profiles.find((p) => p.id === id);
}

export function createCustomProfile(
  store: ColumnProfilesStoreV1,
  name: string,
  visibility: Record<string, boolean>
): ColumnProfilesStoreV1 {
  const trimmed = name.trim();
  if (!trimmed) return store;
  const profile: ColumnVisibilityProfile = {
    id: newProfileId(),
    name: trimmed,
    visibility: normalizeColumnVisibility(visibility),
  };
  return {
    ...store,
    activeProfileId: profile.id,
    profiles: [...store.profiles, profile],
  };
}

export function updateCustomProfileVisibility(
  store: ColumnProfilesStoreV1,
  profileId: string,
  visibility: Record<string, boolean>
): ColumnProfilesStoreV1 {
  if (profileId === BUILT_IN_DEFAULT_PROFILE_ID) return store;
  return {
    ...store,
    profiles: store.profiles.map((p) =>
      p.id === profileId ? { ...p, visibility: normalizeColumnVisibility(visibility) } : p
    ),
  };
}

export function renameCustomProfile(
  store: ColumnProfilesStoreV1,
  profileId: string,
  name: string
): ColumnProfilesStoreV1 {
  const trimmed = name.trim();
  if (!trimmed || profileId === BUILT_IN_DEFAULT_PROFILE_ID) return store;
  return {
    ...store,
    profiles: store.profiles.map((p) => (p.id === profileId ? { ...p, name: trimmed } : p)),
  };
}

export function deleteCustomProfile(
  store: ColumnProfilesStoreV1,
  profileId: string
): ColumnProfilesStoreV1 {
  if (profileId === BUILT_IN_DEFAULT_PROFILE_ID) return store;
  const nextProfiles = store.profiles.filter((p) => p.id !== profileId);
  const activeProfileId =
    store.activeProfileId === profileId ? BUILT_IN_DEFAULT_PROFILE_ID : store.activeProfileId;
  return { ...store, profiles: nextProfiles, activeProfileId };
}

export function selectActiveProfile(
  store: ColumnProfilesStoreV1,
  profileId: string
): ColumnProfilesStoreV1 {
  if (!profileById(store, profileId)) return store;
  return { ...store, activeProfileId: profileId };
}

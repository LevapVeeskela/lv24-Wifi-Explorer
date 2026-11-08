import { normalizeWorkbenchProfilesStore } from './normalize';
import {
  WORKBENCH_PROFILES_STORAGE_KEY,
  type WorkbenchProfilesStorage,
  type WorkbenchProfilesStoreV1,
} from './types';

const STAGING_KEY = `${WORKBENCH_PROFILES_STORAGE_KEY}.__staging`;

export function defaultWorkbenchProfilesStorage(): WorkbenchProfilesStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

function readStore(
  storage: WorkbenchProfilesStorage,
  key: string
): WorkbenchProfilesStoreV1 | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    // Reject structurally foreign payloads so the staging copy can win instead.
    if (!parsed || typeof parsed !== 'object') return null;
    if ((parsed as { version?: unknown }).version !== 1) return null;
    return normalizeWorkbenchProfilesStore(parsed);
  } catch {
    return null;
  }
}

/**
 * Load the store, falling back to the staging copy when the primary key is
 * missing or corrupt. Never throws; always returns a store with `Default`.
 */
export function loadWorkbenchProfilesStore(
  storage: WorkbenchProfilesStorage | null = defaultWorkbenchProfilesStorage()
): WorkbenchProfilesStoreV1 {
  if (!storage) return normalizeWorkbenchProfilesStore(null);
  try {
    const primary = readStore(storage, WORKBENCH_PROFILES_STORAGE_KEY);
    if (primary) return primary;
    const staged = readStore(storage, STAGING_KEY);
    if (staged) return staged;
  } catch {
    // storage disabled / private mode
  }
  return normalizeWorkbenchProfilesStore(null);
}

/**
 * Atomic-ish save: write a normalized payload to a staging key, commit it to
 * the primary key, then drop staging. Storage failures leave the previous
 * committed value intact and never throw.
 */
export function saveWorkbenchProfilesStore(
  store: WorkbenchProfilesStoreV1,
  storage: WorkbenchProfilesStorage | null = defaultWorkbenchProfilesStorage()
): void {
  if (!storage) return;
  const normalized = normalizeWorkbenchProfilesStore(store);
  const payload: WorkbenchProfilesStoreV1 = {
    version: 1,
    activeProfileId: normalized.activeProfileId,
    // The built-in profile is synthesized on load, never persisted.
    profiles: normalized.profiles.filter((profile) => !profile.builtIn),
  };
  const json = JSON.stringify(payload);
  try {
    storage.setItem(STAGING_KEY, json);
    storage.setItem(WORKBENCH_PROFILES_STORAGE_KEY, json);
  } catch {
    return; // quota / private mode — keep the previously committed value
  }
  try {
    storage.removeItem(STAGING_KEY);
  } catch {
    // stale staging copy is harmless; load prefers the primary key
  }
}

export function clearWorkbenchProfilesStore(
  storage: WorkbenchProfilesStorage | null = defaultWorkbenchProfilesStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(WORKBENCH_PROFILES_STORAGE_KEY);
    storage.removeItem(STAGING_KEY);
  } catch {
    // ignore
  }
}

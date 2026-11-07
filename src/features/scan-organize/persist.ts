import { STORAGE_ORGANIZE_BY } from '@/shared/lib/persistence/keys';
import type { OrganizeByValue } from './types';

export type OrganizeByStorage = Pick<Storage, 'getItem' | 'setItem'>;

const VALID: ReadonlySet<string> = new Set(['none', 'ssid', 'ap', 'vendor']);

function defaultStorage(): OrganizeByStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

/** Load the persisted organize-by mode, falling back to `'none'`. */
export function loadOrganizeBy(
  storage: OrganizeByStorage | null = defaultStorage()
): OrganizeByValue {
  if (!storage) return 'none';
  try {
    const raw = storage.getItem(STORAGE_ORGANIZE_BY);
    if (raw && VALID.has(raw)) return raw as OrganizeByValue;
  } catch {
    // ignore
  }
  return 'none';
}

export function saveOrganizeBy(
  value: OrganizeByValue,
  storage: OrganizeByStorage | null = defaultStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_ORGANIZE_BY, value);
  } catch {
    // quota / private mode
  }
}

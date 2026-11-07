import { STORAGE_COLUMNS } from '@/shared/lib/persistence/keys';
import { DEFAULT_COLUMN_VISIBILITY } from './columnCatalog';

export type ColumnVisibilityStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function defaultColumnVisibilityStorage(): ColumnVisibilityStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadColumnVisibility(
  storage: ColumnVisibilityStorage | null = defaultColumnVisibilityStorage()
): Record<string, boolean> {
  if (!storage) return { ...DEFAULT_COLUMN_VISIBILITY };
  try {
    const raw = storage.getItem(STORAGE_COLUMNS);
    if (!raw) return { ...DEFAULT_COLUMN_VISIBILITY };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_COLUMN_VISIBILITY };
    return { ...DEFAULT_COLUMN_VISIBILITY, ...(parsed as Record<string, boolean>) };
  } catch {
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }
}

export function saveColumnVisibility(
  model: Record<string, boolean>,
  storage: ColumnVisibilityStorage | null = defaultColumnVisibilityStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_COLUMNS, JSON.stringify(model));
  } catch {
    // quota / private mode
  }
}

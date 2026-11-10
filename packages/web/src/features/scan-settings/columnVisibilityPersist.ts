import { STORAGE_COLUMNS, STORAGE_COLUMNS_ISSUES_REVEALED } from '@/shared/lib/persistence/keys';
import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';

export type ColumnVisibilityStorage = Pick<Storage, 'getItem' | 'setItem'>;

const REVEALED = '1';

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
    const merged = { ...DEFAULT_COLUMN_VISIBILITY, ...(parsed as Record<string, boolean>) };

    // One-time migration: older builds hid the issue counter by default and
    // persisted that flag as soon as the user touched any column. Reveal it
    // once, then respect the user's own choice from the next launch on.
    if (!storage.getItem(STORAGE_COLUMNS_ISSUES_REVEALED)) {
      merged.issueFlags = true;
      storage.setItem(STORAGE_COLUMNS_ISSUES_REVEALED, REVEALED);
      storage.setItem(STORAGE_COLUMNS, JSON.stringify(merged));
    }

    return merged;
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
    // Marks the issue-counter migration as done, so hiding it later sticks.
    storage.setItem(STORAGE_COLUMNS_ISSUES_REVEALED, REVEALED);
  } catch {
    // quota / private mode
  }
}

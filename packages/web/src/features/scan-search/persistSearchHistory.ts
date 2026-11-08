import { SCAN_SEARCH_HISTORY_STORAGE_KEY, parseScanSearchHistoryFromJson } from './searchHistory';

export { SCAN_SEARCH_HISTORY_STORAGE_KEY };

export type SearchHistoryStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function defaultSearchHistoryStorage(): SearchHistoryStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadScanSearchHistory(
  storage: SearchHistoryStorage | null = defaultSearchHistoryStorage()
): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(SCAN_SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return parseScanSearchHistoryFromJson(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveScanSearchHistory(
  queries: readonly string[],
  storage: SearchHistoryStorage | null = defaultSearchHistoryStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(SCAN_SEARCH_HISTORY_STORAGE_KEY, JSON.stringify([...queries]));
  } catch {
    // quota / private mode — keep in-memory only
  }
}

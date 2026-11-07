/** Matches Electron / Flutter storage id for scan search recents. */
export const SCAN_SEARCH_HISTORY_STORAGE_KEY = 'lv24.wifi-explorer.search-history';

/** Maximum recent queries kept in memory and in localStorage. */
export const SCAN_SEARCH_HISTORY_MAX_ENTRIES = 10;

/** Adds [query] to the front of history, deduping and capping at max entries. */
export function pushScanSearchHistory(history: readonly string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [...history];

  const next = [
    trimmed,
    ...history.filter((entry) => entry !== trimmed),
  ];
  if (next.length <= SCAN_SEARCH_HISTORY_MAX_ENTRIES) return next;
  return next.slice(0, SCAN_SEARCH_HISTORY_MAX_ENTRIES);
}

/** Recent queries to show in the app bar autocomplete for the current input. */
export function filterScanSearchHistoryForAutocomplete(
  history: readonly string[],
  typed: string,
): string[] {
  const needle = typed.trim().toLowerCase();
  if (!needle) return [...history];
  return history.filter((entry) => entry.toLowerCase().includes(needle));
}

/** Parses persisted JSON (array of strings) into a sanitized history list. */
export function parseScanSearchHistoryFromJson(decoded: unknown): string[] {
  if (!Array.isArray(decoded)) return [];
  const out: string[] = [];
  for (const item of decoded) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (out.includes(trimmed)) continue;
    out.push(trimmed);
    if (out.length >= SCAN_SEARCH_HISTORY_MAX_ENTRIES) break;
  }
  return out;
}

export type BandFilterValue = 'all' | '24' | '5' | '6';

export type SecurityFilterValue = 'open' | 'secure';

export type ScanWorkbenchFilters = {
  band: BandFilterValue;
  security: SecurityFilterValue[];
  searchQuery: string;
  vendorQuery: string;
  minRssiDbm: number | null;
  /** When false, omit hidden SSID rows (same as scan settings). */
  includeHiddenSsid: boolean;
};

export const FILTER_DEFAULTS: ScanWorkbenchFilters = {
  band: 'all',
  security: [],
  searchQuery: '',
  vendorQuery: '',
  minRssiDbm: null,
  includeHiddenSsid: true,
};

/** Search box debounce — AppBar writes `searchQuery` after this delay. */
export const SEARCH_DEBOUNCE_MS = 150;

export function bandFilterToGhz(band: BandFilterValue): 2.4 | 5 | 6 | null {
  if (band === '24') return 2.4;
  if (band === '5') return 5;
  if (band === '6') return 6;
  return null;
}

export function hasActiveFilters(filters: ScanWorkbenchFilters): boolean {
  return (
    filters.band !== 'all' ||
    filters.security.length === 1 ||
    filters.searchQuery.trim().length > 0 ||
    filters.vendorQuery.trim().length > 0 ||
    filters.minRssiDbm != null
  );
}

import type { ScanIssueId } from '@/domain';

export type BandFilterValue = 'all' | '24' | '5' | '6';

export type SecurityFilterValue = 'open' | 'secure';

/** Supported channel widths (MHz) for the width facet. */
export type WidthFilterValue = 20 | 40 | 80 | 160;

export type NetworkTypeFilterValue = 'infrastructure' | 'ibss';

export type ScanWorkbenchFilters = {
  band: BandFilterValue;
  security: SecurityFilterValue[];
  searchQuery: string;
  vendorQuery: string;
  minRssiDbm: number | null;
  /** When false, omit hidden SSID rows (same as scan settings). */
  includeHiddenSsid: boolean;
  /** Issue ids to keep; empty/omitted means "any issue state". */
  issueIds?: readonly ScanIssueId[];
  /** Exact channel number; null/omitted means "any channel". */
  channel?: number | null;
  /** Exact channel width in MHz; null/omitted means "any width". */
  widthMhz?: WidthFilterValue | null;
  /** PHY mode (e.g. `ax`); null/omitted means "any mode". */
  phy?: string | null;
  /** Network type facet; null/omitted means "any type". */
  networkType?: NetworkTypeFilterValue | null;
  /** Keep only rows that have a non-empty annotation. */
  annotatedOnly?: boolean;
  /**
   * Keep only currently selected rows. Applied only when the caller passes the
   * current selection to `applyAllFilters` (page-side pre-filter alternative).
   */
  selectedOnly?: boolean;
};

export const FILTER_DEFAULTS: ScanWorkbenchFilters = {
  band: 'all',
  security: [],
  searchQuery: '',
  vendorQuery: '',
  minRssiDbm: null,
  includeHiddenSsid: true,
  issueIds: [],
  channel: null,
  widthMhz: null,
  phy: null,
  networkType: null,
  annotatedOnly: false,
  selectedOnly: false,
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
    filters.minRssiDbm != null ||
    (filters.issueIds?.length ?? 0) > 0 ||
    filters.channel != null ||
    filters.widthMhz != null ||
    (filters.phy ?? '').length > 0 ||
    filters.networkType != null ||
    filters.annotatedOnly === true ||
    filters.selectedOnly === true
  );
}

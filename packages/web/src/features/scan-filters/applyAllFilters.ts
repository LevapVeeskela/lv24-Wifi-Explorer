import type { ScanGridRow } from '@/entities/bss';
import type { ParseScanQueryResult } from '@/features/scan-search';
import { scanIssueMessageKey, type ScanIssueId } from '@/domain';
import { matchBss, parseScanQuery } from '@/features/scan-search';
import { bandFilterToGhz, type ScanWorkbenchFilters } from './types';

/**
 * Extra inputs that are not part of the persisted filter object.
 * `selectedOnly` needs the live selection, so the page passes it here instead of
 * duplicating row ids inside `ScanWorkbenchFilters`.
 */
export type ApplyAllFiltersOptions = {
  /** Row ids currently selected in the grid; required for `filters.selectedOnly`. */
  selectedIds?: ReadonlySet<string>;
};

function foldSearch(value: string): string {
  return value.trim().toLowerCase();
}

function isHiddenSearchToken(query: string): boolean {
  return (
    query === '\u0000' ||
    query === '<hidden>' ||
    query === '‹hidden›' ||
    query === '«скрытая»' ||
    query === '‹скрытая›' ||
    query === 'скрытая'
  );
}

/** Plain-text fallback when the scan query DSL fails to parse. */
function matchesSearchFallback(row: ScanGridRow, query: string): boolean {
  const q = foldSearch(query);
  if (!q) return true;
  if (isHiddenSearchToken(q)) return row.ssidHidden;
  const haystack = [row.ssid, row.bssid, row.vendor ?? '', row.annotation, row.securityLabel]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function matchesScanSearchQuery(
  row: ScanGridRow,
  query: string,
  parsedSearch?: ParseScanQueryResult
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const parsed = parsedSearch ?? parseScanQuery(trimmed);
  if (parsed.ok) {
    return matchBss(row.source, parsed.ast, {
      annotation: row.annotation,
    });
  }

  return matchesSearchFallback(row, trimmed);
}

function matchesSecurity(row: ScanGridRow, security: ScanWorkbenchFilters['security']): boolean {
  if (security.length !== 1) return true;
  if (security[0] === 'open') return row.securityOpen;
  return !row.securityOpen;
}

function matchesIssues(row: ScanGridRow, issueIds: readonly ScanIssueId[]): boolean {
  if (issueIds.length === 0) return true;
  return row.issueKeys.some((key) => issueIds.some((id) => key === scanIssueMessageKey(id)));
}

export function applyAllFilters(
  rows: readonly ScanGridRow[],
  filters: ScanWorkbenchFilters,
  parsedSearch?: ParseScanQueryResult,
  options?: ApplyAllFiltersOptions
): ScanGridRow[] {
  const bandGhz = bandFilterToGhz(filters.band);
  const vendorQ = foldSearch(filters.vendorQuery);
  const searchQ = filters.searchQuery.trim();
  const issueIds = filters.issueIds ?? [];
  const channel = filters.channel ?? null;
  const widthMhz = filters.widthMhz ?? null;
  const phy = (filters.phy ?? '').trim().toLowerCase();
  const networkType = filters.networkType ?? null;
  const annotatedOnly = filters.annotatedOnly === true;
  const selectedOnly = filters.selectedOnly === true;
  const selectedIds = options?.selectedIds;

  return rows.filter((row) => {
    if (!filters.includeHiddenSsid && row.ssidHidden) return false;
    if (bandGhz != null && row.band !== bandGhz) return false;
    if (!matchesSecurity(row, filters.security)) return false;
    if (!matchesIssues(row, issueIds)) return false;
    if (filters.minRssiDbm != null && row.rssiDbm < filters.minRssiDbm) return false;
    if (vendorQ && !(row.vendor ?? '').toLowerCase().includes(vendorQ)) return false;
    if (channel != null && row.channel !== channel) return false;
    if (widthMhz != null && row.channelWidth !== widthMhz) return false;
    if (phy && row.phyMode.toLowerCase() !== phy) return false;
    if (networkType != null && row.networkType !== networkType) return false;
    if (annotatedOnly && row.annotation.trim().length === 0) return false;
    // Without a selection set the facet cannot restrict anything; keep rows.
    if (selectedOnly && selectedIds != null && !selectedIds.has(row.id)) return false;
    if (searchQ && !matchesScanSearchQuery(row, searchQ, parsedSearch)) return false;
    return true;
  });
}

import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { ParseScanQueryResult } from '@/features/scan-search';
import { matchBss, parseScanQuery } from '@/features/scan-search';
import { bandFilterToGhz, type ScanWorkbenchFilters } from './types';

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
  parsedSearch?: ParseScanQueryResult,
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

export function applyAllFilters(
  rows: readonly ScanGridRow[],
  filters: ScanWorkbenchFilters,
  parsedSearch?: ParseScanQueryResult,
): ScanGridRow[] {
  const bandGhz = bandFilterToGhz(filters.band);
  const vendorQ = foldSearch(filters.vendorQuery);
  const searchQ = filters.searchQuery.trim();

  return rows.filter((row) => {
    if (!filters.includeHiddenSsid && row.ssidHidden) return false;
    if (bandGhz != null && row.band !== bandGhz) return false;
    if (!matchesSecurity(row, filters.security)) return false;
    if (filters.minRssiDbm != null && row.rssiDbm < filters.minRssiDbm) return false;
    if (vendorQ && !(row.vendor ?? '').toLowerCase().includes(vendorQ)) return false;
    if (searchQ && !matchesScanSearchQuery(row, searchQ, parsedSearch)) return false;
    return true;
  });
}

import type { CsvExportRequest, CsvExportRow } from './types';

const BSSID_HEADER = 'bssid';

function foldKey(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, ':');
}

function rowKeys(row: CsvExportRow): string[] {
  const keys = [row.bssid];
  if (row.id) keys.push(row.id);
  return keys.map(foldKey);
}

/**
 * Headers are column ids (not localized titles). `bssid` is always present,
 * inserted first when the BSSID column is hidden.
 */
export function resolveCsvHeaders(visibleColumnIds: readonly string[]): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();

  const push = (id: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    headers.push(id);
  };

  if (!visibleColumnIds.includes(BSSID_HEADER)) {
    push(BSSID_HEADER);
  }
  for (const id of visibleColumnIds) {
    push(id);
  }
  return headers;
}

export function selectCsvRows(request: CsvExportRequest): CsvExportRow[] {
  if (request.scope === 'visible') {
    return [...request.visibleRows];
  }
  if (request.scope === 'all') {
    return [...request.allRows];
  }

  const selected = new Set((request.selectedIds ?? []).map(foldKey).filter(Boolean));
  if (selected.size === 0) return [];

  return request.allRows.filter((row) => rowKeys(row).some((key) => selected.has(key)));
}

export function cellForColumn(row: CsvExportRow, columnId: string): unknown {
  if (columnId === BSSID_HEADER) return row.bssid;
  if (Object.prototype.hasOwnProperty.call(row, columnId)) {
    return row[columnId];
  }
  return '';
}

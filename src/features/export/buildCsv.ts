import { encodeUtf8, formatCsvCell, joinCsv } from './csvText';
import { cellForColumn, resolveCsvHeaders, selectCsvRows } from './resolveCsv';
import type { CsvBuildResult, CsvExportRequest } from './types';

/** Build a UTF-8 CSV: visible/selected/all rows, column ids as headers, BSSID always included. */
export function buildCsv(request: CsvExportRequest): CsvBuildResult {
  const headers = resolveCsvHeaders(request.visibleColumnIds);
  const rows = selectCsvRows(request);
  const cells = rows.map((row) => headers.map((id) => formatCsvCell(cellForColumn(row, id))));
  const text = joinCsv(headers, cells, request.bom === true);
  return {
    text,
    bytes: encodeUtf8(text),
    headers,
    rowCount: rows.length,
  };
}

export function buildCsvText(request: CsvExportRequest): string {
  return buildCsv(request).text;
}

export function encodeCsvUtf8(request: CsvExportRequest): Uint8Array {
  return buildCsv(request).bytes;
}

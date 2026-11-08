/** Row/column scopes for CSV export. Columns stay the visible set; rows change. */
export type CsvExportScope = 'visible' | 'selected' | 'all';

/**
 * One exportable BSS row. `bssid` is required so a file stays joinable
 * even when the BSSID column is hidden in the grid.
 */
export type CsvExportRow = {
  id?: string;
  bssid: string;
  [columnId: string]: unknown;
};

export type CsvExportRequest = {
  scope: CsvExportScope;
  /** Session rows (unfiltered). Used by `all` and as the pool for `selected`. */
  allRows: readonly CsvExportRow[];
  /** Rows currently shown after filters. Used by `visible`. */
  visibleRows: readonly CsvExportRow[];
  /** Grid row ids and/or BSSID values for `selected`. */
  selectedIds?: readonly string[];
  /** Visible grid field ids, in display order. Headers use these ids. */
  visibleColumnIds: readonly string[];
  /** Prepend UTF-8 BOM (off by default; machine format). */
  bom?: boolean;
};

export type CsvBuildResult = {
  /** CSV text (JS string; encode with {@link encodeCsvUtf8} for bytes). */
  text: string;
  /** UTF-8 bytes of `text` (optional BOM if requested). */
  bytes: Uint8Array;
  headers: readonly string[];
  rowCount: number;
};

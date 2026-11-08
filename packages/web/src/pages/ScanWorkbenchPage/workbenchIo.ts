import type { GridApiPro } from '@mui/x-data-grid-pro';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { ObservedBss } from '@/domain/bss';
import type { LocationAuthorization } from '@/domain/identity';
import type { AnnotationRule } from '@/features/annotations';
import {
  buildCsv,
  type CsvBuildResult,
  type CsvExportRow,
  type CsvExportScope,
} from '@/features/export';
import {
  createLv24ScanDocument,
  parseLv24Scan,
  serializeLv24Scan,
  suggestLv24ScanFileName,
  type Lv24ScanDocument,
  type Lv24PinnedColor,
  type Lv24ScanParseResult,
} from '@/features/snapshot';

const INTERNAL_FIELD = /^__/;

export const LV24_SCAN_FILE_ACCEPT = '.lv24scan,application/json,.json';
export const LV24_SCAN_EXTENSIONS = ['lv24scan'] as const;
export const CSV_MIME = 'text/csv;charset=utf-8';
export const LV24_SCAN_MIME = 'application/json;charset=utf-8';

export function collectVisibleColumnIds(
  api: GridApiPro | null | undefined,
  visibility: Record<string, boolean>
): string[] {
  if (api && typeof api.getVisibleColumns === 'function') {
    try {
      return api
        .getVisibleColumns()
        .map((column) => column.field)
        .filter((field) => Boolean(field) && !INTERNAL_FIELD.test(field));
    } catch {
      // Grid not mounted yet.
    }
  }
  return Object.entries(visibility)
    .filter(([field, visible]) => visible !== false && !INTERNAL_FIELD.test(field))
    .map(([field]) => field);
}

function asCsvRows(rows: readonly ScanGridRow[]): CsvExportRow[] {
  return rows.map((row) => ({
    ...row,
    id: row.id,
    bssid: row.bssid,
  }));
}

export function buildWorkbenchCsv(input: {
  scope: CsvExportScope;
  allRows: readonly ScanGridRow[];
  visibleRows: readonly ScanGridRow[];
  selectedIds: readonly string[];
  visibleColumnIds: readonly string[];
}): CsvBuildResult {
  return buildCsv({
    scope: input.scope,
    allRows: asCsvRows(input.allRows),
    visibleRows: asCsvRows(input.visibleRows),
    selectedIds: input.selectedIds,
    visibleColumnIds: input.visibleColumnIds,
  });
}

export function csvFileName(scope: CsvExportScope): string {
  return `lv24-export-${scope}.csv`;
}

export function buildWorkbenchSnapshot(input: {
  networks: readonly ObservedBss[];
  annotations: readonly AnnotationRule[];
  appVersion: string;
  location: LocationAuthorization;
  pinnedColors?: readonly Lv24PinnedColor[];
}): { fileName: string; text: string; document: Lv24ScanDocument } {
  const document = createLv24ScanDocument({
    networks: input.networks,
    annotations: input.annotations,
    appVersion: input.appVersion,
    location: input.location,
    pinnedColors: input.pinnedColors,
    os: typeof navigator !== 'undefined' ? navigator.platform : null,
  });
  return {
    document,
    fileName: suggestLv24ScanFileName(document.metadata.capturedAt),
    text: serializeLv24Scan(document),
  };
}

export function parseWorkbenchSnapshot(text: string, fileName?: string): Lv24ScanParseResult {
  return parseLv24Scan(text, fileName);
}

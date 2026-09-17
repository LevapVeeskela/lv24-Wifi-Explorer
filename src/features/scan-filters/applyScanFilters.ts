import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { ParseScanQueryResult } from '@/features/scan-search';
import { applyAllFilters } from './applyAllFilters';
import type { ScanWorkbenchFilters } from './types';

export function applyScanFilters(
  rows: readonly ScanGridRow[],
  filters: ScanWorkbenchFilters,
  parsedSearch?: ParseScanQueryResult,
): ScanGridRow[] {
  return applyAllFilters(rows, filters, parsedSearch);
}

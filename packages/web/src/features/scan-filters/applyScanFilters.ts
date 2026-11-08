import type { ScanGridRow } from '@/entities/bss';
import type { ParseScanQueryResult } from '@/features/scan-search';
import { applyAllFilters, type ApplyAllFiltersOptions } from './applyAllFilters';
import type { ScanWorkbenchFilters } from './types';

export function applyScanFilters(
  rows: readonly ScanGridRow[],
  filters: ScanWorkbenchFilters,
  parsedSearch?: ParseScanQueryResult,
  options?: ApplyAllFiltersOptions
): ScanGridRow[] {
  return applyAllFilters(rows, filters, parsedSearch, options);
}

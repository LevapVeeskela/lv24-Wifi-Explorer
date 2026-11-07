import type { PrintColumn } from './types';

/** Decorative grid columns omitted from paper output. */
const SKIP_PRINT_FIELDS = new Set(['seriesColor', 'securityLock']);

export function resolvePrintColumns(
  visibleColumnIds: readonly string[],
  labelForField: (fieldId: string) => string,
): PrintColumn[] {
  const columns: PrintColumn[] = [];
  const seen = new Set<string>();

  for (const id of visibleColumnIds) {
    if (!id || SKIP_PRINT_FIELDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    columns.push({ id, label: labelForField(id) });
  }

  return columns;
}

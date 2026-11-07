import type { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid-pro';
import { normalizeBssid } from '@/entities/bss/normalizeBssid';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { MAX_BSS_COMPARE_SELECTION } from './constants';

export function selectedRowIdsFromModel(model: GridRowSelectionModel): string[] {
  if (model.type !== 'include') return [];
  return [...model.ids].map((id) => String(id));
}

export function selectedBssidsFromModel(model: GridRowSelectionModel): string[] {
  return selectedRowIdsFromModel(model)
    .map((id) => normalizeBssid(id))
    .filter((id): id is string => id != null);
}

/**
 * Keeps at most `max` rows, dropping the earliest selection when the user adds another.
 */
export function clampRowSelectionModel(
  next: GridRowSelectionModel,
  previous: GridRowSelectionModel,
  max = MAX_BSS_COMPARE_SELECTION,
): GridRowSelectionModel {
  if (next.type !== 'include') return next;
  if (next.ids.size <= max) return next;

  const prevOrder = selectedRowIdsFromModel(previous);
  const ordered: GridRowId[] = [];
  for (const id of prevOrder) {
    if (next.ids.has(id)) ordered.push(id);
  }
  for (const id of next.ids) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  while (ordered.length > max) {
    ordered.shift();
  }
  return { type: 'include', ids: new Set(ordered) };
}

export function resolveCompareRows(
  visibleRows: readonly ScanGridRow[],
  model: GridRowSelectionModel,
): ScanGridRow[] {
  const byId = new Map(visibleRows.map((row) => [row.id, row]));
  const rows: ScanGridRow[] = [];
  for (const id of selectedRowIdsFromModel(model)) {
    const row = byId.get(id);
    if (row) rows.push(row);
  }
  return rows;
}

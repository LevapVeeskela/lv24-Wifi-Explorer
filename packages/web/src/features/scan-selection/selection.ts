import type { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid-pro';
import { normalizeBssid } from '@/entities/bss/normalizeBssid';

/**
 * Selected row (inspector / charts) is independent of the associated Mac link.
 * Title bar and the Wifi + weight-600 cue bind to `connectedBssid`.
 */
export type ScanSelection = {
  selectedBssid: string | null;
  connectedBssid: string | null;
};

export const EMPTY_SCAN_SELECTION: ScanSelection = {
  selectedBssid: null,
  connectedBssid: null,
};

export function emptyRowSelectionModel(): GridRowSelectionModel {
  return { type: 'include', ids: new Set<GridRowId>() };
}

export function rowSelectionModelFromBssid(
  bssid: string | null | undefined
): GridRowSelectionModel {
  const id = normalizeBssid(bssid);
  return {
    type: 'include',
    ids: id ? new Set<GridRowId>([id]) : new Set<GridRowId>(),
  };
}

export function selectedBssidFromModel(model: GridRowSelectionModel): string | null {
  if (model.type !== 'include' || model.ids.size === 0) return null;
  const id = model.ids.values().next().value;
  if (id == null) return null;
  return normalizeBssid(String(id));
}

export function sameNormalizedBssid(
  left: string | null | undefined,
  right: string | null | undefined
): boolean {
  const a = normalizeBssid(left);
  const b = normalizeBssid(right);
  return a != null && a === b;
}

export function isConnectedRow(
  rowBssid: string | null | undefined,
  connectedBssid: string | null | undefined
): boolean {
  return sameNormalizedBssid(rowBssid, connectedBssid);
}

export function isSelectedRow(
  rowBssid: string | null | undefined,
  selectedBssid: string | null | undefined
): boolean {
  return sameNormalizedBssid(rowBssid, selectedBssid);
}

export function isRowIdSelected(model: GridRowSelectionModel, id: GridRowId): boolean {
  return model.type === 'include' && model.ids.has(id);
}

export function selectionCount(model: GridRowSelectionModel): number {
  return model.type === 'include' ? model.ids.size : 0;
}

export function firstSelectedRowId(model: GridRowSelectionModel): GridRowId | null {
  if (model.type !== 'include' || model.ids.size === 0) return null;
  return model.ids.values().next().value ?? null;
}
